-- Keep both RPCs inside the authenticated role's RLS and table privileges.
grant update (default_templates_seeded, updated_at)
  on public.families to authenticated;
grant update (name, description, version, updated_at)
  on public.templates to authenticated;

alter function public.mark_family_templates_seeded(uuid) security invoker;
alter function public.save_template_content(uuid, integer, text, text, jsonb) security invoker;
