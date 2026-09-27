import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { demoTemplates, getTemplate, type DemoTemplate } from '../data/demoTemplates'
import { loadLocalDemoMissionTemplates } from '../services/demoTemplateStorage'
import type { ChecklistItemStatus, DemoMission, HelpRequest } from '../domain/types'

type DemoMissionContextValue = {
  mission: DemoMission
  rewardProgress: number
  helpRequests: HelpRequest[]
  updateItemStatus: (itemId: string, status: ChecklistItemStatus) => void
  startMission: () => void
  finishPreparation: () => void
  sendHelpRequest: (itemId: string, message: string) => void
  replyToHelpRequest: (itemId: string, response: string) => void
  createDemoMission: (template: DemoTemplate, title: string, period: string) => void
  resetDemo: () => void
}

const initialMission: DemoMission = {
  title: 'La valise de la semaine',
  period: 'Semaine prochaine',
  templateName: 'Semaine classique',
  stage: 'started',
  items: getTemplate('classic').items.map((item) => ({ ...item })),
}

const initialHelp: HelpRequest[] = [
  { itemId: 'sweat', message: 'Je ne le trouve pas. Tu sais où il est ?' },
]

function getInitialState() {
  const mission = {
    ...initialMission,
    items: initialMission.items.map((item) => ({
      ...item,
      status: ({
        shirt: 'packed',
        underwear: 'packed',
        socks: 'packed',
        toothbrush: 'packed',
        sweat: 'not_found',
        towel: 'missing',
      } as Record<string, ChecklistItemStatus>)[item.id] ?? 'pending',
    })),
  }
  return {
    mission,
    rewardedItemIds: mission.items.filter((item) => item.status !== 'pending').map((item) => item.id),
    helpRequests: initialHelp.map((request) => ({ ...request })),
  }
}

const DemoMissionContext = createContext<DemoMissionContextValue | null>(null)

export function DemoMissionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(getInitialState)

  const updateItemStatus = useCallback((itemId: string, status: ChecklistItemStatus) => {
    setState((current) => {
      const items = current.mission.items.map((item) =>
        item.id === itemId ? { ...item, status } : item,
      )
      return {
        ...current,
        rewardedItemIds: status === 'pending' || current.rewardedItemIds.includes(itemId)
          ? current.rewardedItemIds
          : [...current.rewardedItemIds, itemId],
        mission: { ...current.mission, stage: 'started', items },
        helpRequests: status === 'packed'
          ? current.helpRequests.filter((request) => request.itemId !== itemId)
          : current.helpRequests,
      }
    })
  }, [])

  const startMission = useCallback(() => {
    setState((current) => ({
      ...current,
      mission: { ...current.mission, stage: 'started' },
    }))
  }, [])

  const finishPreparation = useCallback(() => {
    setState((current) => {
      const isReadyToRecord = current.mission.items.every((item) => item.status !== 'pending')
      if (!isReadyToRecord || current.mission.items.length === 0) return current
      return {
        ...current,
        mission: { ...current.mission, stage: 'preparation-recorded' },
      }
    })
  }, [])

  const sendHelpRequest = useCallback((itemId: string, message: string) => {
    setState((current) => ({
      ...current,
      helpRequests: [
        ...current.helpRequests.filter((request) => request.itemId !== itemId),
        { itemId, message },
      ],
    }))
  }, [])

  const replyToHelpRequest = useCallback((itemId: string, response: string) => {
    setState((current) => ({
      ...current,
      helpRequests: current.helpRequests.map((request) =>
        request.itemId === itemId ? { ...request, response } : request,
      ),
    }))
  }, [])

  const createDemoMission = useCallback((template: DemoTemplate, title: string, period: string) => {
    setState({
      mission: {
        title: title.trim() || template.name,
        period: period.trim() || template.period,
        templateName: template.name,
        stage: 'sent',
        items: template.items.map((item) => ({ ...item, status: 'pending' })),
      },
      rewardedItemIds: [],
      helpRequests: [],
    })
  }, [])

  const resetDemo = useCallback(() => {
    const availableTemplates = import.meta.env.DEV ? loadLocalDemoMissionTemplates() : demoTemplates
    const defaultTemplate = availableTemplates[0]
    const defaultMission = defaultTemplate
      ? {
          title: 'La valise de la semaine',
          period: defaultTemplate.period,
          templateName: defaultTemplate.name,
          stage: 'started' as const,
          items: defaultTemplate.items.map((item) => ({
            ...item,
            status: ({
              shirt: 'packed',
              underwear: 'packed',
              socks: 'packed',
              toothbrush: 'packed',
              sweat: 'not_found',
              towel: 'missing',
            } as Record<string, ChecklistItemStatus>)[item.id] ?? 'pending',
          })),
        }
      : getInitialState().mission

    setState({
      mission: defaultMission,
      rewardedItemIds: defaultMission.items.filter((item) => item.status !== 'pending').map((item) => item.id),
      helpRequests: initialHelp.filter((request) => defaultMission.items.some((item) => item.id === request.itemId && item.status === 'not_found')).map((request) => ({ ...request })),
    })
  }, [])

  const value = useMemo(
    () => ({
      mission: state.mission,
      rewardProgress: state.rewardedItemIds.length,
      helpRequests: state.helpRequests,
      updateItemStatus,
      startMission,
      finishPreparation,
      sendHelpRequest,
      replyToHelpRequest,
      createDemoMission,
      resetDemo,
    }),
    [
      state,
      updateItemStatus,
      startMission,
      finishPreparation,
      sendHelpRequest,
      replyToHelpRequest,
      createDemoMission,
      resetDemo,
    ],
  )

  return <DemoMissionContext.Provider value={value}>{children}</DemoMissionContext.Provider>
}

export function useDemoMission() {
  const context = useContext(DemoMissionContext)
  if (!context) throw new Error('useDemoMission doit être utilisé dans DemoMissionProvider')
  return context
}
