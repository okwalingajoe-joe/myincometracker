/**
 * hooks/use-online.ts
 * Returns live online/offline status and unsynced record count.
 */
"use client"

import { useEffect, useState } from "react"
import { dbUnsyncedCount } from "@/lib/db"
import { syncAll } from "@/lib/sync"

export function useOnline() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  )
  const [unsyncedCount, setUnsyncedCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  // Refresh unsynced count
  const refreshCount = async () => {
    const count = await dbUnsyncedCount()
    setUnsyncedCount(count)
  }

  // Trigger a manual sync
  const triggerSync = async () => {
    if (!online || syncing) return
    setSyncing(true)
    await syncAll()
    await refreshCount()
    setSyncing(false)
  }

  useEffect(() => {
    const onOnline = async () => {
      setOnline(true)
      setSyncing(true)
      await syncAll()
      await refreshCount()
      setSyncing(false)
    }
    const onOffline = () => setOnline(false)

    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)

    // Initial count
    refreshCount()

    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
    }
  }, [])

  return { online, unsyncedCount, syncing, refreshCount, triggerSync }
}
