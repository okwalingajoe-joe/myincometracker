/**
 * lib/db.ts
 * Local IndexedDB layer for MyIncomeTracker.
 * Every record has a `synced` flag. Entries are written here first,
 * then pushed to Supabase when the device comes online.
 */

const DB_NAME = "myincometracker"
const DB_VERSION = 1

// ─── Store names (mirror Supabase table names) ───────────────────────────────
export type StoreName =
  | "daily_income"
  | "giving"
  | "income_streams"
  | "assets"
  | "liabilities"
  | "investments"

// ─── Base type every record carries ──────────────────────────────────────────
export interface LocalRecord {
  id: string          // UUID generated on device
  user_id: string
  synced: boolean     // false = needs push to Supabase
  deleted: boolean    // soft-delete flag so we can sync deletions
  created_at: string
}

// ─── Open (or create) the database ───────────────────────────────────────────
let _db: IDBDatabase | null = null

export function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db)

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result

      const stores: StoreName[] = [
        "daily_income",
        "giving",
        "income_streams",
        "assets",
        "liabilities",
        "investments",
      ]

      for (const name of stores) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: "id" })
          store.createIndex("synced", "synced", { unique: false })
          store.createIndex("user_id", "user_id", { unique: false })
        }
      }
    }

    req.onsuccess = (e) => {
      _db = (e.target as IDBOpenDBRequest).result
      resolve(_db)
    }

    req.onerror = () => reject(req.error)
  })
}

// ─── Generic helpers ──────────────────────────────────────────────────────────

export async function dbGetAll<T extends LocalRecord>(
  store: StoreName
): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly")
    const req = tx.objectStore(store).getAll()
    req.onsuccess = () => resolve((req.result as T[]).filter((r) => !r.deleted))
    req.onerror = () => reject(req.error)
  })
}

export async function dbGet<T extends LocalRecord>(
  store: StoreName,
  id: string
): Promise<T | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly")
    const req = tx.objectStore(store).get(id)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(req.error)
  })
}

export async function dbPut<T extends LocalRecord>(
  store: StoreName,
  record: T
): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite")
    tx.objectStore(store).put(record)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function dbDelete(store: StoreName, id: string): Promise<void> {
  const db = await openDB()
  // Soft-delete: mark as deleted + unsynced so sync can remove from Supabase
  const existing = await dbGet(store, id)
  if (!existing) return
  return dbPut(store, { ...existing, deleted: true, synced: false })
}

export async function dbGetUnsynced<T extends LocalRecord>(
  store: StoreName
): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly")
    const index = tx.objectStore(store).index("synced")
    const req = index.getAll(IDBKeyRange.only(false))
    req.onsuccess = () => resolve(req.result as T[])
    req.onerror = () => reject(req.error)
  })
}

export async function dbMarkSynced(
  store: StoreName,
  ids: string[]
): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite")
    const objStore = tx.objectStore(store)
    for (const id of ids) {
      const getReq = objStore.get(id)
      getReq.onsuccess = () => {
        if (getReq.result) {
          objStore.put({ ...getReq.result, synced: true })
        }
      }
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// Hard-delete a record from local DB (used after confirmed remote deletion)
export async function dbHardDelete(
  store: StoreName,
  id: string
): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite")
    tx.objectStore(store).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// Count unsynced records across all stores (for sync badge)
export async function dbUnsyncedCount(): Promise<number> {
  const stores: StoreName[] = [
    "daily_income",
    "giving",
    "income_streams",
    "assets",
    "liabilities",
    "investments",
  ]
  const counts = await Promise.all(
    stores.map((s) => dbGetUnsynced(s).then((r) => r.length))
  )
  return counts.reduce((a, b) => a + b, 0)
}
