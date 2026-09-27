export type TemplateItem = {
  id: string
  category: string
  label: string
  quantity: number
  required: boolean
  position: number
}

export type TemplateDefinition = {
  id: string
  name: string
  description: string
  period: string
  version: number
  items: TemplateItem[]
}
