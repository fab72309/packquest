-- Only the authenticated parent reads these tables through PostgREST. Child
-- capabilities are checked by the Edge Function and service-role-only RPCs.
create table public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  avatar_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, family_id)
);

create table public.pairing_tokens (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null,
  child_profile_id uuid not null,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  foreign key (child_profile_id, family_id)
    references public.child_profiles (id, family_id) on delete cascade
);

create table public.child_devices (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null,
  child_profile_id uuid not null,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz,
  revoked_at timestamptz,
  unique (id, child_profile_id),
  foreign key (child_profile_id, family_id)
    references public.child_profiles (id, family_id) on delete cascade
);

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null,
  child_profile_id uuid not null,
  source_template_id uuid references public.templates (id) on delete set null,
  template_name text not null check (char_length(btrim(template_name)) between 1 and 100),
  title text not null check (char_length(btrim(title)) between 1 and 100),
  period text not null check (char_length(btrim(period)) between 1 and 80),
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'started', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (id, family_id, child_profile_id),
  foreign key (child_profile_id, family_id)
    references public.child_profiles (id, family_id) on delete cascade,
  check ((status <> 'completed') or completed_at is not null),
  check ((status <> 'cancelled') or cancelled_at is not null)
);

create table public.mission_items (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null,
  family_id uuid not null,
  child_profile_id uuid not null,
  category_name text not null check (char_length(btrim(category_name)) between 1 and 60),
  category_position integer not null check (category_position >= 0),
  label text not null check (char_length(btrim(label)) between 1 and 100),
  quantity integer not null check (quantity between 1 and 999),
  is_required boolean not null,
  position integer not null check (position >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'packed', 'not_found', 'missing')),
  help_request text check (help_request is null or char_length(btrim(help_request)) between 1 and 240),
  help_response text check (help_response is null or char_length(btrim(help_response)) between 1 and 240),
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now(),
  foreign key (mission_id, family_id, child_profile_id)
    references public.missions (id, family_id, child_profile_id) on delete cascade
);

comment on column public.mission_items.version is
  'Checklist status version for offline reconciliation; contextual help does not change it.';

-- Receipts make retries after a lost response safe. They never contain a raw
-- device secret and are not exposed through the Data API.
create table public.child_mutation_receipts (
  device_id uuid not null references public.child_devices (id) on delete cascade,
  mutation_id uuid not null,
  action text not null,
  request jsonb not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  primary key (device_id, mutation_id)
);

create index child_profiles_family on public.child_profiles (family_id);
create index pairing_tokens_child on public.pairing_tokens (child_profile_id, expires_at);
create index child_devices_child on public.child_devices (child_profile_id, revoked_at);
create index missions_child_status on public.missions (child_profile_id, status, created_at desc);
create index missions_family_history on public.missions (family_id, completed_at desc, created_at desc);
create index missions_source_template on public.missions (source_template_id);
create index mission_items_mission_order on public.mission_items (mission_id, category_position, position);
create index child_mutation_receipts_created on public.child_mutation_receipts (created_at);

alter table public.child_profiles enable row level security;
alter table public.pairing_tokens enable row level security;
alter table public.child_devices enable row level security;
alter table public.missions enable row level security;
alter table public.mission_items enable row level security;
alter table public.child_mutation_receipts enable row level security;

revoke all on public.child_profiles, public.pairing_tokens, public.child_devices,
  public.missions, public.mission_items, public.child_mutation_receipts
  from public, anon, authenticated;
grant select, insert, update, delete on public.child_profiles, public.pairing_tokens,
  public.child_devices, public.missions, public.mission_items,
  public.child_mutation_receipts to service_role;
grant select on public.child_profiles, public.missions, public.mission_items to authenticated;
grant select (id, family_id, child_profile_id, created_at, last_seen_at, revoked_at)
  on public.child_devices to authenticated;

create policy child_profiles_parent_select on public.child_profiles
  for select to authenticated using (exists (
    select 1 from public.families f
    where f.id = child_profiles.family_id and f.owner_user_id = (select auth.uid())
  ));
create policy child_profiles_parent_insert_denied on public.child_profiles
  for insert to authenticated with check (false);
create policy child_profiles_parent_update_denied on public.child_profiles
  for update to authenticated using (false) with check (false);
create policy child_profiles_parent_delete_denied on public.child_profiles
  for delete to authenticated using (false);

create policy child_devices_parent_select on public.child_devices
  for select to authenticated using (exists (
    select 1 from public.families f
    where f.id = child_devices.family_id and f.owner_user_id = (select auth.uid())
  ));
create policy child_devices_parent_insert_denied on public.child_devices
  for insert to authenticated with check (false);
create policy child_devices_parent_update_denied on public.child_devices
  for update to authenticated using (false) with check (false);
create policy child_devices_parent_delete_denied on public.child_devices
  for delete to authenticated using (false);

create policy missions_parent_select on public.missions
  for select to authenticated using (exists (
    select 1 from public.families f
    where f.id = missions.family_id and f.owner_user_id = (select auth.uid())
  ));
create policy missions_parent_insert_denied on public.missions
  for insert to authenticated with check (false);
create policy missions_parent_update_denied on public.missions
  for update to authenticated using (false) with check (false);
create policy missions_parent_delete_denied on public.missions
  for delete to authenticated using (false);

create policy mission_items_parent_select on public.mission_items
  for select to authenticated using (exists (
    select 1 from public.families f
    where f.id = mission_items.family_id and f.owner_user_id = (select auth.uid())
  ));
create policy mission_items_parent_insert_denied on public.mission_items
  for insert to authenticated with check (false);
create policy mission_items_parent_update_denied on public.mission_items
  for update to authenticated using (false) with check (false);
create policy mission_items_parent_delete_denied on public.mission_items
  for delete to authenticated using (false);

-- Sensitive token/receipt tables have no client privileges, including read.
create policy pairing_tokens_client_select_denied on public.pairing_tokens
  for select to authenticated using (false);
create policy pairing_tokens_client_insert_denied on public.pairing_tokens
  for insert to authenticated with check (false);
create policy pairing_tokens_client_update_denied on public.pairing_tokens
  for update to authenticated using (false) with check (false);
create policy pairing_tokens_client_delete_denied on public.pairing_tokens
  for delete to authenticated using (false);
create policy child_mutation_receipts_client_select_denied on public.child_mutation_receipts
  for select to authenticated using (false);
create policy child_mutation_receipts_client_insert_denied on public.child_mutation_receipts
  for insert to authenticated with check (false);
create policy child_mutation_receipts_client_update_denied on public.child_mutation_receipts
  for update to authenticated using (false) with check (false);
create policy child_mutation_receipts_client_delete_denied on public.child_mutation_receipts
  for delete to authenticated using (false);

create or replace function public.packquest_create_pairing(
  p_owner_id uuid, p_child_id uuid, p_token_hash text
) returns timestamptz
language plpgsql security invoker set search_path = '' as $$
declare v_family_id uuid; v_expires_at timestamptz := now() + interval '10 minutes';
begin
  select c.family_id into v_family_id
  from public.child_profiles c
  join public.families f on f.id = c.family_id
  where c.id = p_child_id and f.owner_user_id = p_owner_id
  for update of c;
  if v_family_id is null then
    raise exception using errcode = '42501', message = 'Child profile not authorized';
  end if;
  update public.pairing_tokens set consumed_at = now()
  where child_profile_id = p_child_id and consumed_at is null;
  insert into public.pairing_tokens (family_id, child_profile_id, token_hash, expires_at)
  values (v_family_id, p_child_id, p_token_hash, v_expires_at);
  return v_expires_at;
end; $$;

create or replace function public.packquest_redeem_pairing(
  p_token_hash text, p_device_hash text
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v_token public.pairing_tokens; v_device public.child_devices; v_child public.child_profiles;
begin
  update public.pairing_tokens set consumed_at = now()
  where token_hash = p_token_hash and consumed_at is null and expires_at > now()
  returning * into v_token;
  if v_token.id is null then
    raise exception using errcode = '22023', message = 'Pairing link is invalid or expired';
  end if;
  insert into public.child_devices (family_id, child_profile_id, token_hash)
  values (v_token.family_id, v_token.child_profile_id, p_device_hash)
  returning * into v_device;
  select * into v_child from public.child_profiles where id = v_token.child_profile_id;
  return jsonb_build_object('device_id', v_device.id,
    'child', jsonb_build_object('id', v_child.id, 'name', v_child.name, 'avatar_key', v_child.avatar_key));
end; $$;

create or replace function public.packquest_create_mission(
  p_owner_id uuid, p_child_id uuid, p_template_id uuid,
  p_title text default null, p_period text default null
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v_family_id uuid; v_template public.templates; v_mission public.missions;
begin
  select c.family_id into v_family_id
  from public.child_profiles c
  join public.families f on f.id = c.family_id
  where c.id = p_child_id and f.owner_user_id = p_owner_id;
  if v_family_id is null then
    raise exception using errcode = '42501', message = 'Child profile not authorized';
  end if;
  select * into v_template from public.templates
  where id = p_template_id and family_id = v_family_id for share;
  if v_template.id is null then
    raise exception using errcode = '22023', message = 'Template not found';
  end if;
  if not exists (select 1 from public.template_items where template_id = p_template_id) then
    raise exception using errcode = '22023', message = 'Template is empty';
  end if;
  insert into public.missions (
    family_id, child_profile_id, source_template_id, template_name, title, period
  ) values (
    v_family_id, p_child_id, p_template_id, v_template.name,
    coalesce(nullif(btrim(p_title), ''), v_template.name),
    coalesce(nullif(btrim(p_period), ''), v_template.period)
  ) returning * into v_mission;
  insert into public.mission_items (
    mission_id, family_id, child_profile_id, category_name, category_position,
    label, quantity, is_required, position
  )
  select v_mission.id, v_family_id, p_child_id, c.name, c.position,
    i.label, i.quantity, i.is_required, i.position
  from public.template_items i
  join public.template_categories c
    on c.id = i.category_id and c.template_id = i.template_id and c.family_id = i.family_id
  where i.template_id = p_template_id and i.family_id = v_family_id;
  return to_jsonb(v_mission);
end; $$;

create or replace function public.packquest_parent_mutation(
  p_owner_id uuid, p_action text, p_mission_id uuid default null,
  p_item_id uuid default null, p_response text default null,
  p_device_id uuid default null
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v_mission public.missions; v_item public.mission_items; v_device public.child_devices;
begin
  if p_action = 'revoke_device' then
    update public.child_devices d set revoked_at = coalesce(d.revoked_at, now())
    from public.families f
    where d.id = p_device_id and f.id = d.family_id and f.owner_user_id = p_owner_id
    returning d.* into v_device;
    if v_device.id is null then
      raise exception using errcode = '42501', message = 'Device not authorized';
    end if;
    return to_jsonb(v_device) - 'token_hash';
  end if;

  select m.* into v_mission
  from public.missions m
  join public.families f on f.id = m.family_id
  where m.id = p_mission_id and f.owner_user_id = p_owner_id
  for update of m;
  if v_mission.id is null then
    raise exception using errcode = '42501', message = 'Mission not authorized';
  end if;
  if p_action = 'send_mission' then
    if v_mission.status <> 'draft' then
      raise exception using errcode = '40001', message = 'Mission cannot be sent';
    end if;
    update public.missions set status = 'sent', sent_at = now(), updated_at = now()
    where id = v_mission.id returning * into v_mission;
    return to_jsonb(v_mission);
  elsif p_action = 'cancel_mission' then
    if v_mission.status not in ('draft', 'sent', 'started') then
      raise exception using errcode = '40001', message = 'Mission cannot be cancelled';
    end if;
    update public.missions set status = 'cancelled', cancelled_at = now(), updated_at = now()
    where id = v_mission.id returning * into v_mission;
    return to_jsonb(v_mission);
  elsif p_action = 'reply_help' then
    if v_mission.status not in ('sent', 'started') or
       nullif(btrim(p_response), '') is null or char_length(btrim(p_response)) > 240 then
      raise exception using errcode = '22023', message = 'Help reply is invalid';
    end if;
    update public.mission_items set help_response = btrim(p_response), updated_at = now()
    where id = p_item_id and mission_id = v_mission.id
      and help_request is not null and help_response is null
    returning * into v_item;
    if v_item.id is null then
      raise exception using errcode = '22023', message = 'Help request not found';
    end if;
    return to_jsonb(v_item);
  end if;
  raise exception using errcode = '22023', message = 'Unknown parent action';
end; $$;

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
    jsonb_build_object('id', v_child.id, 'name', v_child.name, 'avatar_key', v_child.avatar_key),
    'missions', v_missions);
end; $$;

create or replace function public.packquest_child_mutation(
  p_device_hash text, p_mutation_id uuid, p_action text,
  p_mission_id uuid default null, p_item_id uuid default null,
  p_status text default null, p_expected_version integer default null,
  p_message text default null
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  v_device public.child_devices;
  v_mission public.missions;
  v_item public.mission_items;
  v_receipt public.child_mutation_receipts;
  v_response jsonb;
  v_item_mission_id uuid;
  v_request jsonb;
begin
  if p_mutation_id is null then
    raise exception using errcode = '22023', message = 'Mutation ID required';
  end if;
  select * into v_device from public.child_devices
  where token_hash = p_device_hash and revoked_at is null for update;
  if v_device.id is null then
    raise exception using errcode = '42501', message = 'Device not authorized';
  end if;
  v_request := jsonb_build_object('action', p_action, 'mission_id', p_mission_id,
    'item_id', p_item_id, 'status', p_status,
    'expected_version', p_expected_version, 'message', p_message);
  select * into v_receipt from public.child_mutation_receipts
  where device_id = v_device.id and mutation_id = p_mutation_id;
  if v_receipt.mutation_id is not null then
    if v_receipt.request <> v_request then
      raise exception using errcode = '22023', message = 'Mutation ID reused for another request';
    end if;
    return v_receipt.response;
  end if;

  if p_action in ('update_item', 'request_help') then
    select mission_id into v_item_mission_id from public.mission_items where id = p_item_id;
    p_mission_id := v_item_mission_id;
  end if;
  select * into v_mission from public.missions
  where id = p_mission_id and child_profile_id = v_device.child_profile_id for update;
  if v_mission.id is null then
    raise exception using errcode = '42501', message = 'Mission not authorized';
  end if;

  if p_action = 'start_mission' then
    if v_mission.status <> 'sent' then
      raise exception using errcode = '40001', message = 'Mission cannot be started';
    end if;
    update public.missions set status = 'started', started_at = now(), updated_at = now()
    where id = v_mission.id returning * into v_mission;
    v_response := to_jsonb(v_mission);
  elsif p_action = 'update_item' then
    if v_mission.status <> 'started' then
      raise exception using errcode = '40001', message = 'Mission is no longer active';
    end if;
    if p_status is null or p_status not in ('pending', 'packed', 'not_found', 'missing') or
       p_expected_version is null then
      raise exception using errcode = '22023', message = 'Item update is invalid';
    end if;
    update public.mission_items set status = p_status, version = version + 1,
      updated_at = now()
    where id = p_item_id and mission_id = v_mission.id and version = p_expected_version
    returning * into v_item;
    if v_item.id is null then
      raise exception using errcode = '40001', message = 'Item has changed';
    end if;
    v_response := to_jsonb(v_item);
  elsif p_action = 'request_help' then
    if v_mission.status <> 'started' then
      raise exception using errcode = '40001', message = 'Mission is no longer active';
    end if;
    if nullif(btrim(p_message), '') is null or char_length(btrim(p_message)) > 240 then
      raise exception using errcode = '22023', message = 'Help request is invalid';
    end if;
    update public.mission_items set help_request = btrim(p_message),
      help_response = null, updated_at = now()
    where id = p_item_id and mission_id = v_mission.id
      and status = 'not_found' and help_request is null
    returning * into v_item;
    if v_item.id is null then
      raise exception using errcode = '22023', message = 'Item not found';
    end if;
    v_response := to_jsonb(v_item);
  elsif p_action = 'complete_mission' then
    if v_mission.status <> 'started' or exists (
      select 1 from public.mission_items where mission_id = v_mission.id and status = 'pending'
    ) then
      raise exception using errcode = '40001', message = 'Mission has unfinished items';
    end if;
    update public.missions set status = 'completed', completed_at = now(), updated_at = now()
    where id = v_mission.id returning * into v_mission;
    v_response := to_jsonb(v_mission);
  else
    raise exception using errcode = '22023', message = 'Unknown child action';
  end if;

  insert into public.child_mutation_receipts (device_id, mutation_id, action, request, response)
  values (v_device.id, p_mutation_id, p_action, v_request, v_response);
  update public.child_devices set last_seen_at = now() where id = v_device.id;
  return v_response;
end; $$;

revoke all on function public.packquest_create_pairing(uuid, uuid, text),
  public.packquest_redeem_pairing(text, text),
  public.packquest_create_mission(uuid, uuid, uuid, text, text),
  public.packquest_parent_mutation(uuid, text, uuid, uuid, text, uuid),
  public.packquest_child_snapshot(text),
  public.packquest_child_mutation(text, uuid, text, uuid, uuid, text, integer, text)
  from public, anon, authenticated;
grant execute on function public.packquest_create_pairing(uuid, uuid, text),
  public.packquest_redeem_pairing(text, text),
  public.packquest_create_mission(uuid, uuid, uuid, text, text),
  public.packquest_parent_mutation(uuid, text, uuid, uuid, text, uuid),
  public.packquest_child_snapshot(text),
  public.packquest_child_mutation(text, uuid, text, uuid, uuid, text, integer, text)
  to service_role;
