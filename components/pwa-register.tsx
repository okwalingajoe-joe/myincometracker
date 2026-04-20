"use client"

/**
 * components/pwa-register.tsx
 * Registers the service worker on mount and wires up background sync messaging.
 * Drop this into the root layout once so it runs on every page.
 */

import { useEffect } from "react"
import { syncAll } from "@/lib/sync"

export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    // Register service worker
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[PWA] Service worker registered", reg.scope)

        // Register background sync tag whenever we come online
        window.addEventListener("online", async () => {
          try {
            await reg.sync.register("sync-income-data")
          } catch {
            // Background Sync API not supported — fall back to direct sync
            await syncAll()
          }
        })
      })
      .catch((err) => console.warn("[PWA] SW registration failed:", err))

    // Listen for sync requests FROM the service worker
    navigator.serviceWorker.addEventListener("message", async (event) => {
      if (event.data?.type === "SW_SYNC_REQUESTED") {
        await syncAll()
      }
    })
  }, [])

  return null
}
