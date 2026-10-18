alter table public.child_profiles
  add column allow_help_requests boolean not null default false,
  add column parental_consent_at timestamptz,
  add column parental_consent_version text;

alter table public.child_profiles
  add constraint child_profiles_parental_consent_pair
  check ((parental_consent_at is null) = (parental_consent_version is null));

create or replace function public.packquest_require_guardian_consent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parental_consent_at is null or nullif(btrim(new.parental_consent_version), '') is null then
    raise exception using errcode = '22023', message = 'Guardian consent required';
  end if;
  return new;
end;
$$;

create trigger child_profiles_require_guardian_consent
before insert on public.child_profiles
for each row execute function public.packquest_require_guardian_consent();

create or replace function public.packquest_guard_child_help_permission()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.help_request is distinct from old.help_request
     and new.help_request is not null
     and not exists (
       select 1
       from public.missions m
       join public.child_profiles c on c.id = m.child_profile_id
       where m.id = new.mission_id and c.allow_help_requests
     ) then
    raise exception using errcode = '22023', message = 'Guardian disabled child help requests';
  end if;
  return new;
end;
$$;

create trigger mission_items_guard_child_help_permission
before update of help_request on public.mission_items
for each row execute function public.packquest_guard_child_help_permission();

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
    jsonb_build_object('id', v_child.id, 'name', v_child.name,
      'avatar_key', v_child.avatar_key, 'allow_help_requests', v_child.allow_help_requests),
    'missions', v_missions);
end; $$;
