/**
 * Heal6 Offline Edge Storage & Auto-Synchronization Manager.
 * Uses client-side IndexedDB to reliably store offline patient assessments and
 * automatically dispatches them to the FastAPI cloud backend upon network restoration.
 */

const DB_NAME = 'Heal6EdgeDB'
const DB_VERSION = 1
const STORE_NAME = 'pending_assessments'

/**
 * Opens or initializes the IndexedDB database.
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('sync_status', 'sync_status', { unique: false })
        store.createIndex('created_at', 'created_at', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = (event) => reject(event.target.error)
  })
}

/**
 * Saves an edge-inferred clinical assessment locally in IndexedDB.
 */
export async function saveOfflineAssessment(assessmentData, imageFileOrBlob = null) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    const record = {
      id: assessmentData.id || `EDGE-${Date.now()}`,
      sync_status: 'PENDING_SYNC',
      created_at: new Date().toISOString(),
      assessment: assessmentData,
      imageBlob: imageFileOrBlob
    }

    const request = store.put(record)
    request.onsuccess = () => {
      console.log(`💾 [Heal6 Storage] Offline assessment saved to IndexedDB: ${record.id}`)
      resolve(record)
    }
    request.onerror = (e) => reject(e.target.error)
  })
}

/**
 * Retrieves all pending unsynced assessments.
 */
export async function getPendingAssessments() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const all = request.result || []
      const pending = all.filter(r => r.sync_status === 'PENDING_SYNC')
      resolve(pending)
    }
    request.onerror = (e) => reject(e.target.error)
  })
}

/**
 * Returns count of pending offline records awaiting cloud sync.
 */
export async function getPendingSyncCount() {
  const pending = await getPendingAssessments()
  return pending.length
}

/**
 * Marks a record as successfully synchronized with cloud database.
 */
export async function markAssessmentSynced(id, cloudResponse = null) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const getReq = store.get(id)

    getReq.onsuccess = () => {
      const record = getReq.result
      if (record) {
        record.sync_status = 'SYNCED'
        record.synced_at = new Date().toISOString()
        record.cloudResponse = cloudResponse
        store.put(record)
      }
      resolve(true)
    }
    getReq.onerror = (e) => reject(e.target.error)
  })
}

/**
 * Synchronizes all pending offline assessments to the FastAPI backend.
 */
export async function syncPendingAssessmentsToCloud(apiUploadFn) {
  const pending = await getPendingAssessments()
  if (pending.length === 0) return { count: 0, synced: 0 }

  console.log(`🔄 [Heal6 Sync] Attempting to synchronize ${pending.length} offline assessments to cloud...`)
  let syncedCount = 0

  for (const record of pending) {
    try {
      const a = record.assessment
      const res = await apiUploadFn({
        imageFile: record.imageBlob,
        isHindfoot: a.radarData?.[0]?.value > 0,
        hasIschemia: a.radarData?.[1]?.value > 0,
        hasNeuropathy: a.radarData?.[2]?.value > 0,
        isDeep: a.radarData?.[5]?.value > 0,
        patientName: a.patientName,
        patientAge: a.patientAge,
        patientGender: a.patientGender,
        diabetesType: a.diabetesType,
        patientId: a.id,
        locationLabel: a.locationLabel
      })

      if (res && res.success) {
        await markAssessmentSynced(record.id, res.data)
        syncedCount++
        console.log(`✅ [Heal6 Sync] Successfully synced offline record ${record.id} to cloud.`)
      }
    } catch (err) {
      console.warn(`⚠️ [Heal6 Sync] Failed to sync record ${record.id}:`, err)
    }
  }

  return { count: pending.length, synced: syncedCount }
}

/**
 * Registers automatic background synchronization when the browser reconnects to internet.
 */
export function registerAutoSync(apiUploadFn, onSyncComplete = null) {
  window.addEventListener('online', async () => {
    console.log('🌐 [Heal6 Network] Online connection restored! Triggering cloud synchronization...')
    const result = await syncPendingAssessmentsToCloud(apiUploadFn)
    if (onSyncComplete) onSyncComplete(result)
  })
}
