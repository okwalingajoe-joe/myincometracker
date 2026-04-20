"use client"

/**
 * components/sync-status.tsx
 * Small pill shown in the app header.
 * Green wifi = online + synced
 * Yellow cloud = online + pending records
 * Red wifi-off = offline
 * Spinning = actively syncing
 */

import { Cloud, CloudOff, Loader2, Wifi, WifiOff } from "lucide-react"
import { useOnline } from "@/hooks/use-online"
import { cn } from "@/lib/utils"

export function SyncStatus() {
  const { online, unsyncedCount, syncing, triggerSync } = useOnline()

  if (syncing) {
    return (
      <button
        disabled
        className="flex items-center gap-1.5 rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400"
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        Syncing…
      </button>
    )
  }

  if (!online) {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400">
        <WifiOff className="h-3 w-3" />
        Offline
        {unsyncedCount > 0 && (
          <span className="ml-0.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
            {unsyncedCount}
          </span>
        )}
      </span>
    )
  }

  if (unsyncedCount > 0) {
    return (
      <button
        onClick={triggerSync}
        className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 transition-colors"
        title="Tap to sync now"
      >
        <Cloud className="h-3 w-3" />
        {unsyncedCount} pending
      </button>
    )
  }

  return (
    <span className="flex items-center gap-1.5 rounded-full bg-green-500/15 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400">
      <Wifi className="h-3 w-3" />
      Synced
    </span>
  )
}
