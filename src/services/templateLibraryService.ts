import type { SupabaseClient } from '@supabase/supabase-js'
import { demoTemplates } from '../data/demoTemplates'
import type { TemplateDefinition } from '../domain/template'
import type { Database } from '../lib/supabase/database.types'

type Client = SupabaseClient<Database>
type FamilyRow = Database['public']['Tables']['families']['Row']
type TemplateRow = Database['public']['Tables']['templates']['Row']
type CategoryRow = Database['public']['Tables']['template_categories']['Row']
type ItemRow = Database['public']['Tables']['template_items']['Row']

async function getOrCreateFamily(client: Client, userId: string): Promise<FamilyRow> {
  const { data: existing, error: selectError } = await client
    .from('families')
    .select('*')
    .eq('owner_user_id', userId)
    .maybeSingle()

  if (selectError) throw selectError
  if (existing) return existing

  const { data: created, error: insertError } = await client
    .from('families')
    .insert({ owner_user_id: userId })
    .select('*')
    .single()

  if (!insertError && created) return created

  // A second tab can create the same account's family at the same time.
  if (insertError?.code === '23505') {
    const { data: racedFamily, error: racedSelectError } = await client
      .from('families')
      .select('*')
      .eq('owner_user_id', userId)
      .single()
    if (racedSelectError) throw racedSelectError
    return racedFamily
  }

  throw insertError ?? new Error('Le foyer n’a pas pu être créé.')
}

async function seedStarterTemplates(client: Client, family: FamilyRow) {
  const { data: existingFamily, error: familyError } = await client
    .from('families')
    .select('default_templates_seeded')
    .eq('id', family.id)
    .single()

  if (familyError) throw familyError
  if (existingFamily.default_templates_seeded) return

  const templateSeeds = demoTemplates.map((template, position) => ({
    family_id: family.id,
    name: template.name,
    description: template.description,
    period: template.period,
    position,
    starter_key: template.id,
  }))
  const { error: templateSeedError } = await client
    .from('templates')
    .upsert(templateSeeds, { onConflict: 'family_id,starter_key', ignoreDuplicates: true })
  if (templateSeedError) throw templateSeedError

  const { data: templates, error: templatesError } = await client
    .from('templates')
    .select('id,starter_key')
    .eq('family_id', family.id)
  if (templatesError) throw templatesError

  const templateIds = new Map(
    (templates ?? []).flatMap((template) => template.starter_key
      ? [[template.starter_key, template.id] as const]
      : []),
  )

  const categorySeeds = demoTemplates.flatMap((template) => {
    const templateId = templateIds.get(template.id)
    if (!templateId) return []
    const firstItemByCategory = new Map<string, number>()
    template.items.forEach((item, position) => {
      if (!firstItemByCategory.has(item.category)) firstItemByCategory.set(item.category, position)
    })
    return [...firstItemByCategory.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([name, position]) => ({
        family_id: family.id,
        template_id: templateId,
        name,
        position,
        starter_key: name,
      }))
  })

  const { error: categorySeedError } = await client
    .from('template_categories')
    .upsert(categorySeeds, { onConflict: 'template_id,starter_key', ignoreDuplicates: true })
  if (categorySeedError) throw categorySeedError

  const { data: categories, error: categoriesError } = await client
    .from('template_categories')
    .select('id,template_id,starter_key')
    .eq('family_id', family.id)
  if (categoriesError) throw categoriesError

  const categoryIds = new Map(
    (categories ?? []).flatMap((category) => category.starter_key
      ? [[`${category.template_id}:${category.starter_key}`, category.id] as const]
      : []),
  )

  const itemSeeds = demoTemplates.flatMap((template) => {
    const templateId = templateIds.get(template.id)
    if (!templateId) return []
    return template.items.map((item, position) => ({
      family_id: family.id,
      template_id: templateId,
      category_id: categoryIds.get(`${templateId}:${item.category}`) ?? '',
      label: item.label,
      quantity: item.quantity ?? 1,
      is_required: true,
      position,
      starter_key: item.id,
    }))
  })

  if (itemSeeds.some((item) => !item.category_id)) {
    throw new Error('Une catégorie de modèle n’a pas pu être initialisée.')
  }

  const { error: itemSeedError } = await client
    .from('template_items')
    .upsert(itemSeeds, { onConflict: 'template_id,starter_key', ignoreDuplicates: true })
  if (itemSeedError) throw itemSeedError

  const { error: markSeededError } = await client.rpc('mark_family_templates_seeded', {
    p_family_id: family.id,
  })
  if (markSeededError) throw markSeededError
}

export async function loadTemplateLibrary(client: Client, userId: string): Promise<TemplateDefinition[]> {
  const family = await getOrCreateFamily(client, userId)
  await seedStarterTemplates(client, family)

  const [templatesResult, categoriesResult, itemsResult] = await Promise.all([
    client.from('templates').select('*').eq('family_id', family.id).order('position').order('created_at'),
    client.from('template_categories').select('*').eq('family_id', family.id).order('position'),
    client.from('template_items').select('*').eq('family_id', family.id).order('position'),
  ])
  if (templatesResult.error) throw templatesResult.error
  if (categoriesResult.error) throw categoriesResult.error
  if (itemsResult.error) throw itemsResult.error

  const templates: TemplateRow[] = templatesResult.data ?? []
  const categories: CategoryRow[] = categoriesResult.data ?? []
  const items: ItemRow[] = itemsResult.data ?? []
  const categoryById = new Map(categories.map((category) => [category.id, category]))

  return templates.map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    period: template.period,
    version: template.version,
    items: items
      .filter((item) => item.template_id === template.id)
      .map((item) => {
        const category = categoryById.get(item.category_id)
        if (!category) throw new Error('Un modèle contient une affaire sans catégorie.')
        return {
          id: item.id,
          category: category.name,
          label: item.label,
          quantity: item.quantity,
          required: item.is_required,
          position: item.position,
        }
      }),
  }))
}

export async function saveTemplate(client: Client, template: TemplateDefinition): Promise<number> {
  const { data, error } = await client.rpc('save_template_content', {
    p_template_id: template.id,
    p_expected_version: template.version,
    p_name: template.name,
    p_description: template.description,
    p_items: template.items.map((item) => ({
      id: item.id,
      category: item.category,
      label: item.label,
      quantity: item.quantity,
      is_required: item.required,
      position: item.position,
    })),
  })
  if (error) throw error
  return data
}
