import type { ChildSnapshot, QueuedChildAction } from './childOfflineService'

export type StoredChildState = {
  deviceToken: string
  snapshot: ChildSnapshot | null
  queue: QueuedChildAction[]
  conflict: boolean
}

const DATABASE_NAME = 'packquest-child'
const STORE_NAME = 'private-state'
const STATE_KEY = 'current-device'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Le stockage local est indisponible sur cet appareil.'))
      return
    }

    const request = indexedDB.open(DATABASE_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Impossible d’ouvrir le stockage local.'))
  })
}

export async function readChildState(): Promise<StoredChildState | null> {
  const database = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly')
      const request = transaction.objectStore(STORE_NAME).get(STATE_KEY)
      request.onsuccess = () => resolve((request.result as StoredChildState | undefined) ?? null)
      request.onerror = () => reject(request.error ?? new Error('Impossible de lire le stockage local.'))
    })
  } finally {
    database.close()
  }
}

export async function updateChildState(
  update: (state: StoredChildState | null) => StoredChildState | null,
): Promise<StoredChildState | null> {
  const database = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(STATE_KEY)
      let nextState: StoredChildState | null = null

      request.onsuccess = () => {
        try {
          nextState = update((request.result as StoredChildState | undefined) ?? null)
          if (nextState) store.put(nextState, STATE_KEY)
          else store.delete(STATE_KEY)
        } catch (error) {
          transaction.abort()
          reject(error)
        }
      }
      request.onerror = () => reject(request.error ?? new Error('Impossible de lire le stockage local.'))
      transaction.oncomplete = () => resolve(nextState)
      transaction.onerror = () => reject(transaction.error ?? new Error('Impossible d’enregistrer les modifications.'))
      transaction.onabort = () => reject(transaction.error ?? new Error('Enregistrement interrompu.'))
    })
  } finally {
    database.close()
  }
}
