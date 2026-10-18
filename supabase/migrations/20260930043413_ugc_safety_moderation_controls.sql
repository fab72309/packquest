alter table public.child_profiles
  add column help_policy_version text,
  add column help_policy_accepted_at timestamptz,
  add column child_help_policy_version text,
  add column child_help_policy_accepted_at timestamptz,
  add column help_interactions_paused_at timestamptz,
  add column help_interactions_paused_by text
    check (help_interactions_paused_by is null or help_interactions_paused_by in ('child', 'parent')),
  add constraint child_profiles_parent_help_policy_pair
    check ((help_policy_accepted_at is null) = (help_policy_version is null)),
  add constraint child_profiles_child_help_policy_pair
    check ((child_help_policy_accepted_at is null) = (child_help_policy_version is null)),
  add constraint child_profiles_help_pause_pair
    check ((help_interactions_paused_at is null) = (help_interactions_paused_by is null));

create table public.content_safety_reports (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  child_profile_id uuid not null references public.child_profiles (id) on delete cascade,
  mission_id uuid not null references public.missions (id) on delete cascade,
  mission_item_id uuid not null references public.mission_items (id) on delete cascade,
  reporter_role text not null check (reporter_role in ('parent', 'child')),
  reporter_user_id uuid references auth.users (id) on delete cascade,
  reporter_device_id uuid references public.child_devices (id) on delete cascade,
  reported_role text not null check (reported_role in ('parent', 'child')),
  reported_content text not null check (char_length(btrim(reported_content)) between 1 and 240),
  reason text not null check (reason in ('personal_information', 'unsafe_or_inappropriate', 'hurtful_or_bullying', 'other')),
  status text not null default 'open' check (status in ('open', 'reviewed', 'actioned', 'closed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  review_action text,
  constraint content_safety_reports_actor_pair check (
    (reporter_role = 'parent' and reporter_user_id is not null and reporter_device_id is null)
    or (reporter_role = 'child' and reporter_user_id is null and reporter_device_id is not null)
  ),
  constraint content_safety_reports_distinct_roles check (reporter_role <> reported_role)
);

create index content_safety_reports_open on public.content_safety_reports (created_at)
  where status = 'open';
create index content_safety_reports_family on public.content_safety_reports (family_id, created_at desc);

alter table public.content_safety_reports enable row level security;
revoke all on public.content_safety_reports from public, anon, authenticated;
grant all on public.content_safety_reports to service_role;

create or replace function public.packquest_guard_child_help_permission()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.help_request is distinct from old.help_request and new.help_request is not null
     and not exists (
       select 1 from public.missions m
       join public.child_profiles c on c.id = m.child_profile_id
       where m.id = new.mission_id
         and c.allow_help_requests
         and c.help_interactions_paused_at is null
         and c.help_policy_version = '2026-09-30'
         and c.child_help_policy_version = '2026-09-30'
     ) then
    raise exception using errcode = '22023', message = 'Help requests require active consent and policy acceptance';
  end if;
  return new;
end;
$$;

create or replace function public.packquest_guard_parent_help_response()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.help_response is distinct from old.help_response and new.help_response is not null
     and not exists (
       select 1 from public.missions m
       join public.child_profiles c on c.id = m.child_profile_id
       where m.id = new.mission_id
         and c.allow_help_requests
         and c.help_interactions_paused_at is null
         and c.help_policy_version = '2026-09-30'
         and c.child_help_policy_version = '2026-09-30'
     ) then
    raise exception using errcode = '22023', message = 'Help replies are paused';
  end if;
  return new;
end;
$$;

create trigger mission_items_guard_parent_help_response
before update of help_response on public.mission_items
for each row execute function public.packquest_guard_parent_help_response();

create or replace function public.packquest_filter_help_contact_details()
returns trigger
language plpgsql
set search_path = ''
as $$
declare v_message text;
begin
  if new.help_request is distinct from old.help_request then
    v_message := new.help_request;
  elsif new.help_response is distinct from old.help_response then
    v_message := new.help_response;
  else
    return new;
  end if;
  if v_message is not null and (
    v_message ~* '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}'
    or v_message ~* '(https?://|www\.)'
    or char_length(regexp_replace(v_message, '[^0-9]', '', 'g')) >= 8
  ) then
    raise exception using errcode = '22023', message = 'Do not send contact details or links in help messages';
  end if;
  return new;
end;
$$;

create trigger mission_items_filter_help_contact_details
before update of help_request, help_response on public.mission_items
for each row execute function public.packquest_filter_help_contact_details();

create or replace function public.packquest_child_acknowledge_help_policy(
  p_device_hash text, p_policy_version text
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v_device public.child_devices; v_child public.child_profiles;
begin
  if p_policy_version <> '2026-09-30' then
    raise exception using errcode = '22023', message = 'Help policy version is not current';
  end if;
  select * into v_device from public.child_devices
  where token_hash = p_device_hash and revoked_at is null for update;
  if v_device.id is null then
    raise exception using errcode = '42501', message = 'Device not authorized';
  end if;
  select * into v_child from public.child_profiles
  where id = v_device.child_profile_id for update;
  if not v_child.allow_help_requests or v_child.help_interactions_paused_at is not null
     or v_child.help_policy_version <> p_policy_version then
    raise exception using errcode = '42501', message = 'Help interactions are not available';
  end if;
  update public.child_profiles set child_help_policy_accepted_at = now(),
    child_help_policy_version = p_policy_version, updated_at = now()
  where id = v_child.id returning * into v_child;
  return jsonb_build_object(
    'accepted_at', v_child.child_help_policy_accepted_at,
    'policy_version', v_child.child_help_policy_version
  );
end;
$$;

create or replace function public.packquest_set_child_help_permission(
  p_owner_id uuid, p_child_id uuid, p_enabled boolean, p_policy_version text default null
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v_child public.child_profiles;
begin
  if p_enabled and p_policy_version <> '2026-09-30' then
    raise exception using errcode = '22023', message = 'Current help policy acceptance is required';
  end if;
  select c.* into v_child from public.child_profiles c
  join public.families f on f.id = c.family_id
  where c.id = p_child_id and f.owner_user_id = p_owner_id for update of c;
  if v_child.id is null then
    raise exception using errcode = '42501', message = 'Child profile not authorized';
  end if;
  if p_enabled and v_child.help_interactions_paused_by = 'child' then
    raise exception using errcode = '42501', message = 'A child safety report must be reviewed before messages resume';
  end if;
  if p_enabled then
    update public.child_profiles set allow_help_requests = true,
      help_policy_version = p_policy_version, help_policy_accepted_at = now(),
      help_interactions_paused_at = null, help_interactions_paused_by = null,
      updated_at = now()
    where id = v_child.id returning * into v_child;
  else
    update public.child_profiles set allow_help_requests = false,
      help_interactions_paused_at = coalesce(help_interactions_paused_at, now()),
      help_interactions_paused_by = coalesce(help_interactions_paused_by, 'parent'),
      updated_at = now()
    where id = v_child.id returning * into v_child;
  end if;
  return jsonb_build_object(
    'id', v_child.id, 'name', v_child.name,
    'allow_help_requests', v_child.allow_help_requests,
    'help_interactions_paused_at', v_child.help_interactions_paused_at,
    'help_interactions_paused_by', v_child.help_interactions_paused_by,
    'help_policy_version', v_child.help_policy_version
  );
end;
$$;

create or replace function public.packquest_child_report_help(
  p_device_hash text, p_item_id uuid, p_reason text
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  v_device public.child_devices;
  v_child public.child_profiles;
  v_mission public.missions;
  v_item public.mission_items;
  v_report public.content_safety_reports;
begin
  if p_reason not in ('personal_information', 'unsafe_or_inappropriate', 'hurtful_or_bullying', 'other') then
    raise exception using errcode = '22023', message = 'Report reason is invalid';
  end if;
  select * into v_device from public.child_devices
  where token_hash = p_device_hash and revoked_at is null for update;
  if v_device.id is null then
    raise exception using errcode = '42501', message = 'Device not authorized';
  end if;
  select * into v_child from public.child_profiles
  where id = v_device.child_profile_id for update;
  select * into v_item from public.mission_items
  where id = p_item_id and child_profile_id = v_child.id;
  if v_item.id is null or nullif(btrim(v_item.help_response), '') is null then
    raise exception using errcode = '22023', message = 'Help reply not found';
  end if;
  select * into v_mission from public.missions
  where id = v_item.mission_id and child_profile_id = v_child.id
    and status = 'started' for update;
  if v_mission.id is null then
    raise exception using errcode = '22023', message = 'Mission not active';
  end if;

  select * into v_report from public.content_safety_reports
  where mission_item_id = v_item.id and reporter_device_id = v_device.id
    and reported_role = 'parent' and created_at > now() - interval '30 days'
  order by created_at desc limit 1;
  if v_report.id is null then
    insert into public.content_safety_reports (
      family_id, child_profile_id, mission_id, mission_item_id,
      reporter_role, reporter_device_id, reported_role, reported_content, reason
    ) values (
      v_child.family_id, v_child.id, v_mission.id, v_item.id,
      'child', v_device.id, 'parent', v_item.help_response, p_reason
    ) returning * into v_report;
  end if;
  update public.child_profiles set allow_help_requests = false,
    help_interactions_paused_at = coalesce(help_interactions_paused_at, now()),
    help_interactions_paused_by = 'child',
    updated_at = now()
  where id = v_child.id;
  update public.child_devices set last_seen_at = now() where id = v_device.id;
  return jsonb_build_object('id', v_report.id, 'status', v_report.status, 'paused', true);
end;
$$;

create or replace function public.packquest_child_block_parent(
  p_device_hash text
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v_device public.child_devices; v_child public.child_profiles;
begin
  select * into v_device from public.child_devices
  where token_hash = p_device_hash and revoked_at is null for update;
  if v_device.id is null then
    raise exception using errcode = '42501', message = 'Device not authorized';
  end if;
  select * into v_child from public.child_profiles
  where id = v_device.child_profile_id for update;
  update public.child_profiles set allow_help_requests = false,
    help_interactions_paused_at = coalesce(help_interactions_paused_at, now()),
    help_interactions_paused_by = 'child',
    updated_at = now()
  where id = v_child.id;
  update public.child_devices set last_seen_at = now() where id = v_device.id;
  return jsonb_build_object('paused', true);
end;
$$;

create or replace function public.packquest_parent_report_help(
  p_owner_id uuid, p_item_id uuid, p_reason text
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  v_family public.families;
  v_mission public.missions;
  v_item public.mission_items;
  v_child public.child_profiles;
  v_report public.content_safety_reports;
begin
  if p_reason not in ('personal_information', 'unsafe_or_inappropriate', 'hurtful_or_bullying', 'other') then
    raise exception using errcode = '22023', message = 'Report reason is invalid';
  end if;
  select * into v_family from public.families where owner_user_id = p_owner_id;
  if v_family.id is null then
    raise exception using errcode = '42501', message = 'Family not authorized';
  end if;
  select * into v_item from public.mission_items
  where id = p_item_id and family_id = v_family.id;
  if v_item.id is null or nullif(btrim(v_item.help_request), '') is null then
    raise exception using errcode = '22023', message = 'Help request not found';
  end if;
  select * into v_mission from public.missions
  where id = v_item.mission_id and family_id = v_family.id
    and status in ('sent', 'started') for update;
  if v_mission.id is null then
    raise exception using errcode = '22023', message = 'Mission not active';
  end if;
  select * into v_child from public.child_profiles
  where id = v_item.child_profile_id for update;

  select * into v_report from public.content_safety_reports
  where mission_item_id = v_item.id and reporter_user_id = p_owner_id
    and reported_role = 'child' and created_at > now() - interval '30 days'
  order by created_at desc limit 1;
  if v_report.id is null then
    insert into public.content_safety_reports (
      family_id, child_profile_id, mission_id, mission_item_id,
      reporter_role, reporter_user_id, reported_role, reported_content, reason
    ) values (
      v_family.id, v_child.id, v_mission.id, v_item.id,
      'parent', p_owner_id, 'child', v_item.help_request, p_reason
    ) returning * into v_report;
  end if;
  update public.child_profiles set allow_help_requests = false,
    help_interactions_paused_at = coalesce(help_interactions_paused_at, now()),
    help_interactions_paused_by = coalesce(help_interactions_paused_by, 'parent'),
    updated_at = now()
  where id = v_child.id;
  return jsonb_build_object('id', v_report.id, 'status', v_report.status, 'paused', true);
end;
$$;

revoke all on function public.packquest_child_acknowledge_help_policy(text, text),
  public.packquest_set_child_help_permission(uuid, uuid, boolean, text),
  public.packquest_child_report_help(text, uuid, text),
  public.packquest_child_block_parent(text),
  public.packquest_parent_report_help(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.packquest_child_acknowledge_help_policy(text, text),
  public.packquest_set_child_help_permission(uuid, uuid, boolean, text),
  public.packquest_child_report_help(text, uuid, text),
  public.packquest_child_block_parent(text),
  public.packquest_parent_report_help(uuid, uuid, text)
  to service_role;

create or replace function public.packquest_child_snapshot(p_device_hash text)
returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v_device public.child_devices; v_child public.child_profiles; v_missions jsonb;
begin
  select * into v_device from public.child_devices
  where token_hash = p_device_hash and revoked_at is null for update;
  if v_device.id is null then
    raise exception using errcode = '42501', message = 'Device not authorized';
  end if;
  update public.child_devices set last_seen_at = now() where id = v_device.id;
  select * into v_child from public.child_profiles where id = v_device.child_profile_id;
  select coalesce(jsonb_agg(to_jsonb(m) || jsonb_build_object('items', (
    select coalesce(jsonb_agg(to_jsonb(i) order by i.category_position, i.position, i.id), '[]'::jsonb)
    from public.mission_items i where i.mission_id = m.id
  )) order by m.created_at desc), '[]'::jsonb)
  into v_missions from public.missions m
  where m.child_profile_id = v_device.child_profile_id and m.status in ('sent', 'started');
  return jsonb_build_object('child',
    jsonb_build_object('id', v_child.id, 'name', v_child.name, 'avatar_key', v_child.avatar_key,
      'allow_help_requests', v_child.allow_help_requests,
      'help_interactions_paused_at', v_child.help_interactions_paused_at,
      'child_help_policy_version', v_child.child_help_policy_version),
    'missions', v_missions);
end; $$;

grant execute on function public.packquest_child_snapshot(text) to service_role;
