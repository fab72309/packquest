create index template_categories_template_family_fk
  on public.template_categories (template_id, family_id);

create index template_items_template_family_fk
  on public.template_items (template_id, family_id);

create index template_items_category_template_family_fk
  on public.template_items (category_id, template_id, family_id);
