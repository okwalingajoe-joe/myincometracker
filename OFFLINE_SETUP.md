# MyIncomeTracker — Offline-First Setup Guide

## What was added

This update transforms MyIncomeTracker into a fully **offline-first PWA**.

### New files
| File | Purpose |
|---|---|
| `lib/db.ts` | IndexedDB layer — all reads/writes go here first |
| `lib/sync.ts` | Sync engine — pushes unsynced records to Supabase |
| `hooks/use-online.ts` | Live online/offline + unsynced count hook |
| `components/sync-status.tsx` | Status pill in the header (Synced / Offline / Pending) |
| `components/pwa-register.tsx` | Registers the service worker on app load |
| `public/sw.js` | Service worker — caches app shell, handles background sync |
| `public/manifest.json` | PWA manifest — makes the app installable on Android |
| `public/icons/icon-192.png` | App icon (replace with your real icon) |
| `public/icons/icon-512.png` | App icon (replace with your real icon) |
| `scripts/003_offline_sync_notes.sql` | Optional DB indexes for faster queries |

### Modified files
| File | Change |
|---|---|
| `components/tracker/daily-income-tab.tsx` | Offline-first reads/writes via IndexedDB |
| `components/tracker/giving-tab.tsx` | Same |
| `components/tracker/streams-tab.tsx` | Same |
| `components/tracker/net-worth-tab.tsx` | Same |
| `components/tracker/investments-tab.tsx` | Same |
| `app/app/layout.tsx` | Added `<SyncStatus />` to header |
| `app/layout.tsx` | Added PWA manifest, icons metadata, `<PWARegister />` |

---

## How the offline sync works

1. User logs an entry → saved to **IndexedDB** instantly (works offline)
2. Each record gets a `synced: false` flag and a device-generated UUID
3. When device comes **online** → `syncAll()` runs automatically
4. `syncAll()` upserts all `synced: false` records to Supabase
5. On success → records are marked `synced: true` locally
6. Deletions are soft-deleted locally (`deleted: true`) then synced as hard deletes on Supabase

The small **amber dot** (●) on a list item means it's pending sync.

---

## Setup steps

### 1. Install dependencies
No new npm packages needed — only browser-native IndexedDB is used.

```bash
npm install
# or
pnpm install
```

### 2. Run the optional SQL migration
In your Supabase SQL editor, run:
```
scripts/003_offline_sync_notes.sql
```
This adds performance indexes. It's optional but recommended.

### 3. Replace the app icons
The current icons are placeholders (orange circle with "M").
Replace them with your real icons at:
- `public/icons/icon-192.png` (192×192 px)
- `public/icons/icon-512.png` (512×512 px)

Use [maskable.app](https://maskable.app) to make them work as Android adaptive icons.

### 4. Deploy to Vercel
```bash
npm run build
# Push to GitHub → Vercel auto-deploys
```

### 5. Install on Android
1. Open the app URL in Chrome on Android
2. Chrome will show an **"Add to Home Screen"** banner
3. Tap it → app installs like a native app
4. Works fully offline from that point

---

## Icon replacement tip

Your app's brand color is **#F26522** (orange). For a quick icon:
1. Go to [https://maskable.app/editor](https://maskable.app/editor)
2. Set background to `#F26522`
3. Add your "MIT" or "M" logo in white
4. Export at 192px and 512px
5. Replace the files in `public/icons/`
