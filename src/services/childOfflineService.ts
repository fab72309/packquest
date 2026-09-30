import { readChildState, updateChildState, type StoredChildState } from './childOfflineStorage'

export type ChildItemStatus = 'pending' | 'packed' | 'not_found' | 'missing'
export type ChildMissionStatus = 'draft' | 'sent' | 'started' | 'completed' | 'cancelled'

export type ChildMissionItem = {
  id: string
  category_name: string
  category_position: number
  label: string
  quantity: number
  is_required: boolean
  position: number
  status: ChildItemStatus
  help_request: string | null
  help_response: string | null
  version: number
  updated_at: string
}

export type ChildMission = {
  id: string
  title: string
  period: string | null
  status: ChildMissionStatus
  sent_at: string | null
  started_at: string | null
  completed_at: string | null
  items: ChildMissionItem[]
}

export type ChildSnapshot = {
  child: { id: string; name: string }
  missions: ChildMission[]
}

export type ChildActionInput =
  | { type: 'start_mission'; missionId: string }
  | { type: 'update_item'; itemId: string; status: ChildItemStatus }
  | { type: 'request_help'; itemId: string; message: string }
  | { type: 'complete_mission'; missionId: string }

export type QueuedChildAction = ChildActionInput & {
  mutationId: string
  expectedVersion?: number
}

export type ChildSyncResult = {
  snapshot: ChildSnapshot | null
  pending: number
  conflict: boolean
  online: boolean
}

export class ChildOfflineError extends Error {
  readonly kind: 'not_paired' | 'network' | 'conflict' | 'server' | 'invalid_action' | 'not_configured' | 'storage'
  readonly status?: number

  constructor(
    message: string,
    kind: 'not_paired' | 'network' | 'conflict' | 'server' | 'invalid_action' | 'not_configured' | 'storage',
    status?: number,
  ) {
    super(message)
    this.name = 'ChildOfflineError'
    this.kind = kind
    this.status = status
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
let activeSync: Promise<ChildSyncResult> | null = null

async function callChildFunction<T>(body: Record<string, unknown>): Promise<T> {
  if (!supabaseUrl || !supabaseKey) {
    throw new ChildOfflineError('PackQuest n’est pas encore relié au serveur.', 'not_configured')
  }

  let response: Response
  try {
    response = await fetch(new URL('/functions/v1/packquest', supabaseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: supabaseKey },
      body: JSON.stringify(body),
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: AbortSignal.timeout(15000),
    })
  } catch {
    throw new ChildOfflineError('Connexion momentanément indisponible.', 'network')
  }

  if (!response.ok) {
    const kind = response.status === 409 ? 'conflict' : 'server'
    const message = response.status === 409
      ? 'Cette affaire a changé ailleurs. Vérifie la liste avant de réessayer.'
      : response.status === 401 || response.status === 403
        ? 'Cet appareil n’est plus relié à la famille.'
        : 'PackQuest n’a pas pu enregistrer cette action.'
    throw new ChildOfflineError(message, kind, response.status)
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new ChildOfflineError('La réponse du serveur est illisible.', 'server')
  }
}

function isSnapshot(value: unknown): value is ChildSnapshot {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ChildSnapshot>
  return Boolean(
    candidate.child
      && typeof candidate.child.id === 'string'
      && typeof candidate.child.name === 'string'
      && Array.isArray(candidate.missions)
      && candidate.missions.every((mission) => mission
        && typeof mission.id === 'string'
        && Array.isArray(mission.items)
        && mission.items.every((item) => item && typeof item.id === 'string' && typeof item.version === 'number')),
  )
}

function visibleSnapshot(state: StoredChildState | null): ChildSnapshot | null {
  if (!state?.snapshot) return null
  return state.queue.reduce(applyOptimisticAction, state.snapshot)
}

function applyOptimisticAction(snapshot: ChildSnapshot, action: QueuedChildAction): ChildSnapshot {
  if (action.type === 'start_mission' || action.type === 'complete_mission') {
    return {
      ...snapshot,
      missions: snapshot.missions.map((mission) => mission.id === action.missionId
        ? {
          ...mission,
          status: action.type === 'start_mission' ? 'started' : 'completed',
          started_at: action.type === 'start_mission' ? mission.started_at ?? new Date().toISOString() : mission.started_at,
          completed_at: action.type === 'complete_mission' ? mission.completed_at ?? new Date().toISOString() : mission.completed_at,
        }
        : mission),
    }
  }

  return {
    ...snapshot,
    missions: snapshot.missions.map((mission) => ({
      ...mission,
      items: mission.items.map((item) => {
        if (item.id !== action.itemId) return item
        if (action.type === 'update_item') {
          return { ...item, status: action.status, version: item.version + 1 }
        }
        return { ...item, help_request: action.message }
      }),
    })),
  }
}

function findMission(snapshot: ChildSnapshot, missionId: string): ChildMission | undefined {
  return snapshot.missions.find((mission) => mission.id === missionId)
}

function findItem(snapshot: ChildSnapshot, itemId: string): { mission: ChildMission; item: ChildMissionItem } | undefined {
  for (const mission of snapshot.missions) {
    const item = mission.items.find((candidate) => candidate.id === itemId)
    if (item) return { mission, item }
  }
  return undefined
}

function validateAction(snapshot: ChildSnapshot, action: ChildActionInput): number | undefined {
  if (action.type === 'start_mission') {
    if (findMission(snapshot, action.missionId)?.status !== 'sent') {
      throw new ChildOfflineError('Cette mission ne peut pas être démarrée.', 'invalid_action')
    }
    return undefined
  }
  if (action.type === 'complete_mission') {
    const mission = findMission(snapshot, action.missionId)
    if (!mission || mission.status !== 'started' || mission.items.length === 0 || mission.items.some((item) => item.status === 'pending')) {
      throw new ChildOfflineError('Indique chaque affaire avant de terminer.', 'invalid_action')
    }
    return undefined
  }

  const found = findItem(snapshot, action.itemId)
  if (!found || found.mission.status !== 'started') {
    throw new ChildOfflineError('Cette affaire n’est plus modifiable.', 'invalid_action')
  }
  if (action.type === 'request_help') {
    if (found.item.status !== 'not_found' || !action.message.trim() || action.message.trim().length > 160 || found.item.help_request) {
      throw new ChildOfflineError('Cette demande d’aide ne peut pas être envoyée.', 'invalid_action')
    }
    return undefined
  }
  return found.item.version
}

function requireState(state: StoredChildState | null): StoredChildState {
  if (!state?.deviceToken) {
    throw new ChildOfflineError('Relie d’abord cet appareil à ta famille.', 'not_paired')
  }
  return state
}

export async function hasPairedChildDevice(): Promise<boolean> {
  return Boolean((await readChildState())?.deviceToken)
}

export async function getCachedChildSnapshot(): Promise<ChildSnapshot | null> {
  return visibleSnapshot(await readChildState())
}

export async function getChildSyncState(): Promise<{ pending: number; conflict: boolean }> {
  const state = await readChildState()
  return { pending: state?.queue.length ?? 0, conflict: state?.conflict ?? false }
}

export async function pairChild(token: string): Promise<ChildSnapshot> {
  if (!token.trim()) throw new ChildOfflineError('Le code d’appairage est vide.', 'invalid_action')
  try {
    if (await hasPairedChildDevice()) {
      throw new ChildOfflineError('Cet appareil est déjà relié à une famille. Quitte-la depuis ton espace avant de scanner un nouveau QR code.', 'invalid_action')
    }
    await updateChildState((current) => current)
  } catch (error) {
    if (error instanceof ChildOfflineError) throw error
    throw new ChildOfflineError('Cet appareil ne peut pas enregistrer la connexion. Vérifie l’espace de stockage ou le mode privé.', 'storage')
  }
  const result = await callChildFunction<{ device_token?: string; child?: ChildSnapshot['child'] }>({
    action: 'pair',
    token: token.trim(),
  })
  if (!result.device_token || !result.child?.id || !result.child.name) {
    throw new ChildOfflineError('La réponse d’appairage est incomplète.', 'server')
  }

  // The pairing code is consumed once; keep the new device credential before any second request.
  const snapshot: ChildSnapshot = { child: result.child, missions: [] }
  try { await updateChildState(() => ({ deviceToken: result.device_token as string, snapshot, queue: [], conflict: false })) }
  catch { throw new ChildOfflineError('La connexion n’a pas pu être enregistrée sur cet appareil. Demande un nouveau QR code à ton parent.', 'storage') }
  try {
    return (await refreshChildSnapshot()) ?? snapshot
  } catch (error) {
    if (error instanceof ChildOfflineError && error.kind === 'network') return snapshot
    throw error
  }
}

export async function refreshChildSnapshot(): Promise<ChildSnapshot | null> {
  const state = await readChildState()
  if (!state) return null
  let response: unknown
  try {
    response = await callChildFunction<unknown>({ action: 'get_missions', device_token: state.deviceToken })
  } catch (error) {
    if (error instanceof ChildOfflineError && (error.status === 401 || error.status === 403)) {
      await forgetChildDevice()
    }
    throw error
  }
  if (!isSnapshot(response)) throw new ChildOfflineError('La liste des missions est incomplète.', 'server')
  const saved = await updateChildState((current) => {
    if (!current || current.deviceToken !== state.deviceToken) return current
    // Keep the original revision while unconfirmed mutations exist. A request may
    // have reached the server before its response was lost; replaying its stable ID
    // is the only safe way to settle it without inflating local item versions.
    if (current.queue.length > 0) return current
    return { ...current, snapshot: response as ChildSnapshot }
  })
  return visibleSnapshot(saved)
}

export async function enqueueChildAction(action: ChildActionInput): Promise<ChildSnapshot> {
  const saved = await updateChildState((current) => {
    const state = requireState(current)
    if (state.conflict) {
      throw new ChildOfflineError('Une modification doit d’abord être vérifiée avec le serveur.', 'conflict', 409)
    }
    const snapshot = visibleSnapshot(state)
    if (!snapshot) throw new ChildOfflineError('Ouvre une fois la mission avec une connexion.', 'invalid_action')
    const expectedVersion = validateAction(snapshot, action)
    const queued: QueuedChildAction = { ...action, mutationId: crypto.randomUUID(), expectedVersion }
    return { ...state, queue: [...state.queue, queued] }
  })
  const snapshot = visibleSnapshot(saved)
  if (!snapshot) throw new ChildOfflineError('La mission est indisponible.', 'invalid_action')
  return snapshot
}

function mutationBody(action: QueuedChildAction, deviceToken: string): Record<string, unknown> {
  const common = { action: action.type, device_token: deviceToken, mutation_id: action.mutationId }
  if (action.type === 'start_mission' || action.type === 'complete_mission') {
    return { ...common, mission_id: action.missionId }
  }
  if (action.type === 'request_help') {
    return { ...common, item_id: action.itemId, message: action.message }
  }
  return {
    ...common,
    item_id: action.itemId,
    status: action.status,
    expected_version: action.expectedVersion,
  }
}

async function syncChildNow(): Promise<ChildSyncResult> {
  let state = await readChildState()
  if (!state) return { snapshot: null, pending: 0, conflict: false, online: false }
  if (state.conflict) return { snapshot: visibleSnapshot(state), pending: state.queue.length, conflict: true, online: true }

  while (state.queue.length > 0) {
    const action = state.queue[0]
    try {
      await callChildFunction<unknown>(mutationBody(action, state.deviceToken))
      // A lost response keeps the mutation queued, so its stable ID can safely be retried.
      const authoritative = await callChildFunction<unknown>({ action: 'get_missions', device_token: state.deviceToken })
      if (!isSnapshot(authoritative)) throw new ChildOfflineError('La liste des missions est incomplète.', 'server')
      state = requireState(await updateChildState((current) => {
        const latest = requireState(current)
        if (latest.deviceToken !== state?.deviceToken) return latest
        return {
          ...latest,
          snapshot: authoritative,
          queue: latest.queue.filter((queued) => queued.mutationId !== action.mutationId),
        }
      }))
    } catch (error) {
      if (error instanceof ChildOfflineError && (error.status === 401 || error.status === 403)) {
        await forgetChildDevice()
        throw error
      }
      if (error instanceof ChildOfflineError && error.kind === 'conflict') {
        state = requireState(await updateChildState((current) => ({ ...requireState(current), conflict: true })))
        return { snapshot: visibleSnapshot(state), pending: state.queue.length, conflict: true, online: true }
      }
      if (error instanceof ChildOfflineError && error.kind === 'network') {
        return { snapshot: visibleSnapshot(state), pending: state.queue.length, conflict: false, online: false }
      }
      throw error
    }
  }

  try {
    const snapshot = await refreshChildSnapshot()
    const latest = await readChildState()
    return {
      snapshot,
      pending: latest?.queue.length ?? 0,
      conflict: latest?.conflict ?? false,
      online: true,
    }
  } catch (error) {
    if (error instanceof ChildOfflineError && error.kind === 'network') {
      return { snapshot: visibleSnapshot(state), pending: 0, conflict: false, online: false }
    }
    throw error
  }
}

export function syncChild(): Promise<ChildSyncResult> {
  if (!activeSync) {
    activeSync = (async () => {
      let result = await syncChildNow()
      // An action can be queued while the last server refresh is in flight.
      // Drain that action before reporting the device as synchronized.
      while (result.online && !result.conflict && result.pending > 0) {
        result = await syncChildNow()
      }
      return result
    })().finally(() => { activeSync = null })
  }
  return activeSync
}

export async function resolveChildConflictWithServer(): Promise<ChildSnapshot> {
  const state = requireState(await readChildState())
  const response = await callChildFunction<unknown>({ action: 'get_missions', device_token: state.deviceToken })
  if (!isSnapshot(response)) throw new ChildOfflineError('La liste des missions est incomplète.', 'server')
  const saved = await updateChildState((current) => {
    const latest = requireState(current)
    if (latest.deviceToken !== state.deviceToken) throw new ChildOfflineError('Cet appareil a changé de famille.', 'conflict')
    return { ...latest, snapshot: response, queue: [], conflict: false }
  })
  const snapshot = visibleSnapshot(saved)
  if (!snapshot) throw new ChildOfflineError('La liste des missions est indisponible.', 'server')
  return snapshot
}

export async function forgetChildDevice(): Promise<void> {
  await updateChildState(() => null)
}
