export type ChecklistItemStatus = 'pending' | 'packed' | 'not_found' | 'missing'

export type DemoMissionStage = 'sent' | 'started' | 'preparation-recorded'

export type MissionItem = {
  id: string
  category: string
  label: string
  quantity?: number
  required?: boolean
  status: ChecklistItemStatus
}

export type DemoMission = {
  title: string
  period: string
  templateName: string
  stage: DemoMissionStage
  items: MissionItem[]
}

export type HelpRequest = {
  itemId: string
  message: string
  response?: string
}
