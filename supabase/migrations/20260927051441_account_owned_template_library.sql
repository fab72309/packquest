-- Parent-owned template library. Checklist missions remain independent snapshots.
create table public.families (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null default 'Ma famille' check (char_length(btrim(name)) between 1 and 100),
  default_templates_seeded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  description text not null default '' check (char_length(description) <= 240),
  period text not null default 'Semaine prochaine' check (char_length(btrim(period)) between 1 and 80),
  starter_key text,
  position integer not null default 0 check (position >= 0),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, family_id),
  unique (family_id, starter_key)
);

create table public.template_categories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  template_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  position integer not null default 0 check (position >= 0),
  starter_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, template_id, family_id),
  unique (template_id, starter_key),
  foreign key (template_id, family_id)
    references public.templates (id, family_id) on delete cascade
);

create unique index template_categories_name_per_template
  on public.template_categories (template_id, lower(name));

create table public.template_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  template_id uuid not null,
  category_id uuid not null,
  label text not null check (char_length(btrim(label)) between 1 and 100),
  quantity integer not null default 1 check (quantity between 1 and 999),
  is_required boolean not null default true,
  position integer not null default 0 check (position >= 0),
  starter_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, starter_key),
  foreign key (template_id, family_id)
    references public.templates (id, family_id) on delete cascade,
  foreign key (category_id, template_id, family_id)
    references public.template_categories (id, template_id, family_id) on delete cascade
);

create index templates_family_position on public.templates (family_id, position, created_at);
create index template_categories_family_position on public.template_categories (family_id, template_id, position);
create index template_items_family_position on public.template_items (family_id, template_id, position);
create index template_items_category on public.template_items (category_id);

alter table public.families enable row level security;
alter table public.templates enable row level security;
alter table public.template_categories enable row level security;
alter table public.template_items enable row level security;

revoke all on public.families, public.templates, public.template_categories, public.template_items from anon, authenticated;
grant select on public.families to authenticated;
grant insert (owner_user_id, name) on public.families to authenticated;
grant update (name) on public.families to authenticated;
grant select, insert, delete on public.templates to authenticated;
grant select, insert, delete on public.template_categories to authenticated;
grant select, insert, delete on public.template_items to authenticated;

create policy families_owner_select on public.families
  for select to authenticated
  using (owner_user_id = (select auth.uid()));
create policy families_owner_insert on public.families
  for insert to authenticated
  with check (owner_user_id = (select auth.uid()));
create policy families_owner_update on public.families
  for update to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));
create policy families_client_delete_denied on public.families
  for delete to authenticated
  using (false);

create policy templates_family_select on public.templates
  for select to authenticated
  using (exists (
    select 1 from public.families f
    where f.id = templates.family_id and f.owner_user_id = (select auth.uid())
  ));
create policy templates_family_insert on public.templates
  for insert to authenticated
  with check (exists (
    select 1 from public.families f
    where f.id = templates.family_id and f.owner_user_id = (select auth.uid())
  ));
create policy templates_family_update on public.templates
  for update to authenticated
  using (exists (
    select 1 from public.families f
    where f.id = templates.family_id and f.owner_user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.families f
    where f.id = templates.family_id and f.owner_user_id = (select auth.uid())
  ));
create policy templates_family_delete on public.templates
  for delete to authenticated
  using (exists (
    select 1 from public.families f
    where f.id = templates.family_id and f.owner_user_id = (select auth.uid())
  ));

create policy template_categories_family_select on public.template_categories
  for select to authenticated
  using (exists (
    select 1 from public.families f
    where f.id = template_categories.family_id and f.owner_user_id = (select auth.uid())
  ));
create policy template_categories_family_insert on public.template_categories
  for insert to authenticated
  with check (exists (
    select 1 from public.families f
    where f.id = template_categories.family_id and f.owner_user_id = (select auth.uid())
  ));
create policy template_categories_family_update on public.template_categories
  for update to authenticated
  using (exists (
    select 1 from public.families f
    where f.id = template_categories.family_id and f.owner_user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.families f
    where f.id = template_categories.family_id and f.owner_user_id = (select auth.uid())
  ));
create policy template_categories_family_delete on public.template_categories
  for delete to authenticated
  using (exists (
    select 1 from public.families f
    where f.id = template_categories.family_id and f.owner_user_id = (select auth.uid())
  ));

create policy template_items_family_select on public.template_items
  for select to authenticated
  using (exists (
    select 1 from public.families f
    where f.id = template_items.family_id and f.owner_user_id = (select auth.uid())
  ));
create policy template_items_family_insert on public.template_items
  for insert to authenticated
  with check (exists (
    select 1 from public.families f
    where f.id = template_items.family_id and f.owner_user_id = (select auth.uid())
  ));
create policy template_items_family_update on public.template_items
  for update to authenticated
  using (exists (
    select 1 from public.families f
    where f.id = template_items.family_id and f.owner_user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.families f
    where f.id = template_items.family_id and f.owner_user_id = (select auth.uid())
  ));
create policy template_items_family_delete on public.template_items
  for delete to authenticated
  using (exists (
    select 1 from public.families f
    where f.id = template_items.family_id and f.owner_user_id = (select auth.uid())
  ));

create or replace function public.mark_family_templates_seeded(p_family_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if not exists (
    select 1 from public.families f
    where f.id = p_family_id and f.owner_user_id = (select auth.uid())
  ) then
    raise exception using errcode = '42501', message = 'Family not found or not authorized';
  end if;

  if not exists (
    select 1 from public.templates t
    where t.family_id = p_family_id and t.starter_key = 'classic'
  ) or not exists (
    select 1 from public.templates t
    where t.family_id = p_family_id and t.starter_key = 'sport'
  ) then
    raise exception using errcode = '23514', message = 'Starter templates are incomplete';
  end if;

  if exists (
    select 1
    from (values ('classic', 12), ('sport', 15)) as expected(starter_key, item_count)
    join public.templates t on t.family_id = p_family_id and t.starter_key = expected.starter_key
    where (
      select count(*) from public.template_items i where i.template_id = t.id and i.starter_key is not null
    ) < expected.item_count
  ) then
    raise exception using errcode = '23514', message = 'Starter template items are incomplete';
  end if;

  update public.families
  set default_templates_seeded = true, updated_at = now()
  where id = p_family_id and owner_user_id = (select auth.uid());

  if not found then
    raise exception using errcode = '42501', message = 'Family not found or not authorized';
  end if;
end;
$$;

revoke all on function public.mark_family_templates_seeded(uuid) from public, anon, authenticated;
grant execute on function public.mark_family_templates_seeded(uuid) to authenticated;

create or replace function public.save_template_content(
  p_template_id uuid,
  p_expected_version integer,
  p_name text,
  p_description text,
  p_items jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_family_id uuid;
  v_new_version integer;
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if p_name is null or char_length(btrim(p_name)) not between 1 and 100 then
    raise exception using errcode = '22023', message = 'Template name is required';
  end if;
  if p_description is null or char_length(p_description) > 240 then
    raise exception using errcode = '22023', message = 'Template description is too long';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception using errcode = '22023', message = 'Template items must be an array';
  end if;

  select t.family_id into v_family_id
  from public.templates t
  join public.families f on f.id = t.family_id
  where t.id = p_template_id and f.owner_user_id = (select auth.uid());

  if v_family_id is null then
    raise exception using errcode = '42501', message = 'Template not found or not authorized';
  end if;

  if not exists (
    select 1 from public.templates t
    where t.id = p_template_id and t.family_id = v_family_id and t.version = p_expected_version
  ) then
    raise exception using errcode = '40001', message = 'Template has changed';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(p_items) as incoming(
      id uuid, category text, label text, quantity integer, is_required boolean, position integer
    )
    where incoming.id is null
       or nullif(btrim(incoming.category), '') is null
       or char_length(btrim(incoming.category)) > 60
       or nullif(btrim(incoming.label), '') is null
       or char_length(btrim(incoming.label)) > 100
       or incoming.quantity is null
       or incoming.quantity not between 1 and 999
       or incoming.is_required is null
       or incoming.position is null
       or incoming.position < 0
  ) then
    raise exception using errcode = '22023', message = 'Template items contain invalid values';
  end if;

  update public.templates
  set name = btrim(p_name), description = p_description, updated_at = now(), version = version + 1
  where id = p_template_id and family_id = v_family_id and version = p_expected_version
  returning version into v_new_version;

  if v_new_version is null then
    raise exception using errcode = '40001', message = 'Template has changed';
  end if;

  delete from public.template_categories c where c.template_id = p_template_id;

  insert into public.template_categories (family_id, template_id, name, position)
  select
    v_family_id,
    p_template_id,
    groups.name,
    (row_number() over (order by groups.first_position, groups.name) - 1)::integer
  from (
    select min(btrim(incoming.category)) as name, min(incoming.position) as first_position
    from jsonb_to_recordset(p_items) as incoming(
      id uuid, category text, label text, quantity integer, is_required boolean, position integer
    )
    group by lower(btrim(incoming.category))
  ) as groups;

  insert into public.template_items (
    id, family_id, template_id, category_id, label, quantity, is_required, position
  )
  select
    incoming.id,
    v_family_id,
    p_template_id,
    categories.id,
    btrim(incoming.label),
    incoming.quantity,
    incoming.is_required,
    incoming.position
  from jsonb_to_recordset(p_items) as incoming(
    id uuid, category text, label text, quantity integer, is_required boolean, position integer
  )
  join public.template_categories categories
    on categories.template_id = p_template_id
   and categories.family_id = v_family_id
   and lower(categories.name) = lower(btrim(incoming.category));

  return v_new_version;
end;
$$;

revoke all on function public.save_template_content(uuid, integer, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.save_template_content(uuid, integer, text, text, jsonb) to authenticated;
