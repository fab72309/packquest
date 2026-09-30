-- Missions keep a snapshot of the template items the parent chose to include.
-- A null list preserves the existing behavior for callers that send no selection.
drop function if exists public.packquest_create_mission(uuid, uuid, uuid, text, text);

create function public.packquest_create_mission(
  p_owner_id uuid,
  p_child_id uuid,
  p_template_id uuid,
  p_title text default null,
  p_period text default null,
  p_selected_item_ids uuid[] default null
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  v_family_id uuid;
  v_template public.templates;
  v_mission public.missions;
  v_item_count bigint;
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

  if p_selected_item_ids is null then
    select count(*) into v_item_count
    from public.template_items
    where template_id = p_template_id and family_id = v_family_id;
  else
    if cardinality(p_selected_item_ids) = 0
      or cardinality(p_selected_item_ids) <> (
        select count(distinct selected.item_id)
        from unnest(p_selected_item_ids) as selected(item_id)
      )
      or exists (
        select 1
        from unnest(p_selected_item_ids) as selected(item_id)
        where selected.item_id is null
          or not exists (
            select 1 from public.template_items i
            where i.id = selected.item_id
              and i.template_id = p_template_id
              and i.family_id = v_family_id
          )
      ) then
      raise exception using errcode = '22023', message = 'Selected template items are invalid';
    end if;
    v_item_count := cardinality(p_selected_item_ids);
  end if;

  if v_item_count = 0 then
    raise exception using errcode = '22023', message = 'Template has no selected items';
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
  where i.template_id = p_template_id
    and i.family_id = v_family_id
    and (p_selected_item_ids is null or i.id = any(p_selected_item_ids));

  return to_jsonb(v_mission);
end; $$;

revoke all on function public.packquest_create_mission(uuid, uuid, uuid, text, text, uuid[])
  from public, anon, authenticated;
grant execute on function public.packquest_create_mission(uuid, uuid, uuid, text, text, uuid[])
  to service_role;
