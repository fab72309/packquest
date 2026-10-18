import { demoTemplates, type DemoTemplate } from '../data/demoTemplates'
import type { TemplateDefinition, TemplateItem } from '../domain/template'

const storageKey = 'packquest.local-demo.templates.v1'

function cloneTemplates(templates: TemplateDefinition[]) {
  return templates.map((template) => ({
    ...template,
    items: template.items.map((item) => ({ ...item })),
  }))
}

function starterTemplateDefinitions(): TemplateDefinition[] {
  return demoTemplates.map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    period: template.period,
    version: 1,
    items: template.items.map((item, position) => ({
      id: item.id,
      category: item.category,
      label: item.label,
      quantity: item.quantity ?? 1,
      required: true,
      position,
    })),
  }))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isTemplateItem(value: unknown): value is TemplateItem {
  if (!isRecord(value)) return false
  return typeof value.id === 'string'
    && typeof value.category === 'string'
    && typeof value.label === 'string'
    && Number.isInteger(value.quantity)
    && typeof value.required === 'boolean'
    && Number.isInteger(value.position)
}

function isTemplateDefinition(value: unknown): value is TemplateDefinition {
  if (!isRecord(value)) return false
  return typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.description === 'string'
    && typeof value.period === 'string'
    && Number.isInteger(value.version)
    && Array.isArray(value.items)
    && value.items.every(isTemplateItem)
}

export function loadLocalDemoTemplateDefinitions(): TemplateDefinition[] {
  const defaults = starterTemplateDefinitions()
  if (typeof window === 'undefined') return defaults

  try {
    const saved = window.localStorage.getItem(storageKey)
    if (!saved) return defaults
    const parsed: unknown = JSON.parse(saved)
    if (!Array.isArray(parsed) || !parsed.every(isTemplateDefinition)) return defaults
    return cloneTemplates(parsed)
  } catch {
    return defaults
  }
}

export function saveLocalDemoTemplateDefinitions(templates: TemplateDefinition[]) {
  if (typeof window === 'undefined') throw new Error('Le stockage local est indisponible.')
  window.localStorage.setItem(storageKey, JSON.stringify(templates))
}

export function loadLocalDemoMissionTemplates(): DemoTemplate[] {
  return loadLocalDemoTemplateDefinitions().map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    period: template.period,
    items: template.items
      .slice()
      .sort((left, right) => left.position - right.position)
      .map((item) => ({
        id: item.id,
        category: item.category,
        label: item.label,
        quantity: item.quantity,
        required: item.required,
        status: 'pending',
      })),
  }))
}
