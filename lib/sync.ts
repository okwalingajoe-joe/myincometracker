/**
 * lib/sync.ts
 * Sync engine for MyIncomeTracker.
 * Reads unsynced records from IndexedDB and pushes them to Supabase.
 * Handles both upserts (new/edited) and deletes (soft-deleted records).
 */

import { createClient } from "@/lib/supabase/client"
import {
  dbGetUnsynced,
  dbMarkSynced,
  dbHardDelete,
  type StoreName,
} from "@/lib/db"

// All stores that need syncing
const STORES: StoreName[] = [
  "daily_income",
  "giving",
  "income_streams",
  "assets",
  "liabilities",
  "investments",
]

let _syncing = false

export async function syncAll(): Promise<{ synced: number; errors: number }> {
  if (_syncing) return { synced: 0, errors: 0 }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { synced: 0, errors: 0 }
  }

  _syncing = true
  const supabase = createClient()
  let synced = 0
  let errors = 0

  try {
    for (const store of STORES) {
      const unsynced = await dbGetUnsynced(store)
      if (unsynced.length === 0) continue

      // Separate deletes from upserts
      const toDelete = unsynced.filter((r) => r.deleted)
      const toUpsert = unsynced.filter((r) => !r.deleted)

      // ── Upsert new/updated records ────────────────────────────────────────
      if (toUpsert.length > 0) {
        // Strip local-only fields before sending to Supabase
        const payload = toUpsert.map(({ synced: _s, deleted: _d, ...rest }) => rest)

        const { error } = await supabase
          .from(store)
          .upsert(payload, { onConflict: "id" })

        if (error) {
          console.error(`[sync] upsert error on ${store}:`, error.message)
          errors++
        } else {
          await dbMarkSynced(store, toUpsert.map((r) => r.id))
          synced += toUpsert.length
        }
      }

      // ── Delete records that were removed offline ──────────────────────────
      if (toDelete.length > 0) {
        const ids = toDelete.map((r) => r.id)

        const { error } = await supabase
          .from(store)
          .delete()
          .in("id", ids)

        if (error) {
          console.error(`[sync] delete error on ${store}:`, error.message)
          errors++
        } else {
          // Hard-delete from local DB since Supabase confirmed removal
          for (const id of ids) {
            await dbHardDelete(store, id)
          }
          synced += toDelete.length
        }
      }
    }
  } finally {
    _syncing = false
  }

  return { synced, errors }
}

// Call once on app boot — wires up online listener
export function initSync(onSyncComplete?: (result: { synced: number; errors: number }) => void) {
  if (typeof window === "undefined") return

  const run = async () => {
    const result = await syncAll()
    if (result.synced > 0 || result.errors > 0) {
      onSyncComplete?.(result)
    }
  }

  // Sync immediately if online
  if (navigator.onLine) run()

  // Sync whenever connection is restored
  window.addEventListener("online", run)

  // Also try syncing periodically when online (every 60s)
  setInterval(() => {
    if (navigator.onLine) run()
  }, 60_000)
}
