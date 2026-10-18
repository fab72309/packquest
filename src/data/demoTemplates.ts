import type { MissionItem } from '../domain/types'

export type DemoTemplate = {
  id: string
  name: string
  description: string
  period: string
  items: MissionItem[]
}

const classicItems: MissionItem[] = [
  { id: 'shirt', category: 'Vêtements', label: 'T-shirts', quantity: 4, status: 'pending' },
  { id: 'underwear', category: 'Vêtements', label: 'Sous-vêtements', quantity: 5, status: 'pending' },
  { id: 'socks', category: 'Vêtements', label: 'Paires de chaussettes', quantity: 5, status: 'pending' },
  { id: 'pants', category: 'Vêtements', label: 'Pantalons', quantity: 2, status: 'pending' },
  { id: 'sweat', category: 'Vêtements', label: 'Sweat préféré', quantity: 1, status: 'pending' },
  { id: 'pyjama', category: 'Vêtements', label: 'Pyjama', quantity: 1, status: 'pending' },
  { id: 'toothbrush', category: 'Hygiène', label: 'Brosse à dents', quantity: 1, status: 'pending' },
  { id: 'toothpaste', category: 'Hygiène', label: 'Dentifrice', quantity: 1, status: 'pending' },
  { id: 'towel', category: 'Hygiène', label: 'Serviette', quantity: 1, status: 'pending' },
  { id: 'notebook', category: 'École', label: 'Cahiers', quantity: 2, status: 'pending' },
  { id: 'pencil-case', category: 'École', label: 'Trousse', quantity: 1, status: 'pending' },
  { id: 'bottle', category: 'À ne pas oublier', label: 'Gourde', quantity: 1, status: 'pending' },
]

export const demoTemplates: DemoTemplate[] = [
  {
    id: 'classic',
    name: 'Semaine classique',
    description: 'Les essentiels pour une semaine à l’internat.',
    period: 'Semaine prochaine',
    items: classicItems,
  },
  {
    id: 'sport',
    name: 'Semaine avec sport',
    description: 'Une semaine classique, avec la tenue de sport.',
    period: 'Semaine prochaine',
    items: [
      ...classicItems,
      { id: 'sports-shoes', category: 'Sport', label: 'Chaussures de sport', quantity: 1, status: 'pending' },
      { id: 'sportswear', category: 'Sport', label: 'Tenue de sport', quantity: 1, status: 'pending' },
      { id: 'sports-bottle', category: 'Sport', label: 'Gourde de sport', quantity: 1, status: 'pending' },
    ],
  },
]

export function getTemplate(templateId: string) {
  return demoTemplates.find((template) => template.id === templateId) ?? demoTemplates[0]
}
