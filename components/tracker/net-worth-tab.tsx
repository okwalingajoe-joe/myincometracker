"use client"

import { Loader2, Minus, Plus, Trash2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatUGX, formatUGXShort } from "@/lib/currency"
import { createClient } from "@/lib/supabase/client"
import { dbGetAll, dbPut, dbDelete, type LocalRecord } from "@/lib/db"
import { syncAll } from "@/lib/sync"
import { IdealNetWorth } from "./ideal-net-worth"
import { StatTile, TrackerShell } from "./tracker-shell"

type Row = LocalRecord & { name: string; value: number }

function SideList({
  kind, title, icon: Icon, rows, loading, onAdd, onRemove, submitting,
}: {
  kind: "asset" | "liability"
  title: string
  icon: React.ComponentType<{ className?: string }>
  rows: Row[]
  loading: boolean
  onAdd: (name: string, value: number) => Promise<void>
  onRemove: (id: string) => void
  submitting: boolean
}) {
  const [name, setName] = useState("")
  const [value, setValue] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error("Name is required")
    const v = Number.parseFloat(value || "0")
    if (!Number.isFinite(v) || v < 0) return toast.error("Enter a valid value")
    await onAdd(name.trim(), v)
    setName(""); setValue("")
  }

  const total = rows.reduce((s, r) => s + Number(r.value), 0)

  return (
    <div className="glass-strong rounded-3xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4" aria-hidden /> {title}</h3>
        <span className="text-sm font-semibold tabular-nums">{formatUGX(total)}</span>
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)}
          placeholder={kind === "asset" ? "e.g. Land in Mukono" : "e.g. SACCO loan"}
          className="h-10 rounded-xl bg-background/70" required />
        <Input type="number" min={0} step="any" value={value} onChange={(e) => setValue(e.target.value)}
          placeholder="UGX" className="h-10 w-28 rounded-xl bg-background/70" required />
        <Button type="submit" size="icon" disabled={submitting} className="h-10 w-10 shrink-0 rounded-xl shadow-md" aria-label={`Add ${kind}`}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </form>
      {loading ? (
        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Nothing here yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-white/40">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 py-2.5">
              <span className="min-w-0 flex-1 truncate text-sm">
                {r.name}
                {!r.synced && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 align-middle" title="Pending sync" />}
              </span>
              <span className="shrink-0 text-sm font-medium tabular-nums">{formatUGX(r.value)}</span>
              <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(r.id)}
                className="h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:text-destructive" aria-label={`Delete ${r.name}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function NetWorthTab() {
  const supabase = useMemo(() => createClient(), [])
  const [assets, setAssets] = useState<Row[]>([])
  const [liabilities, setLiabilities] = useState<Row[]>([])
  const [loadingA, setLoadingA] = useState(true)
  const [loadingL, setLoadingL] = useState(true)
  const [subA, setSubA] = useState(false)
  const [subL, setSubL] = useState(false)

  const load = useCallback(async () => {
    setLoadingA(true); setLoadingL(true)

    // Load from local DB first
    const [localAssets, localLiab] = await Promise.all([
      dbGetAll<Row>("assets"),
      dbGetAll<Row>("liabilities"),
    ])
    localAssets.sort((a, b) => b.created_at.localeCompare(a.created_at))
    localLiab.sort((a, b) => b.created_at.localeCompare(a.created_at))
    setAssets(localAssets); setLiabilities(localLiab)
    setLoadingA(false); setLoadingL(false)

    // Merge from Supabase if online
    if (navigator.onLine) {
      const [a, l] = await Promise.all([
        supabase.from("assets").select("*").order("created_at", { ascending: false }),
        supabase.from("liabilities").select("*").order("created_at", { ascending: false }),
      ])
      if (!a.error && a.data) {
        for (const row of a.data) {
          const existing = localAssets.find((r) => r.id === row.id)
          if (!existing || existing.synced) await dbPut("assets", { ...row, synced: true, deleted: false })
        }
        const merged = await dbGetAll<Row>("assets")
        merged.sort((a, b) => b.created_at.localeCompare(a.created_at))
        setAssets(merged)
      }
      if (!l.error && l.data) {
        for (const row of l.data) {
          const existing = localLiab.find((r) => r.id === row.id)
          if (!existing || existing.synced) await dbPut("liabilities", { ...row, synced: true, deleted: false })
        }
        const merged = await dbGetAll<Row>("liabilities")
        merged.sort((a, b) => b.created_at.localeCompare(a.created_at))
        setLiabilities(merged)
      }
    }
  }, [supabase])

  useEffect(() => { load() }, [load])

  const assetTotal = assets.reduce((s, r) => s + Number(r.value), 0)
  const liabTotal = liabilities.reduce((s, r) => s + Number(r.value), 0)
  const netWorth = assetTotal - liabTotal

  async function addItem(store: "assets" | "liabilities", name: string, value: number, setSub: (v: boolean) => void, setRows: React.Dispatch<React.SetStateAction<Row[]>>) {
    setSub(true)
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { setSub(false); return toast.error("Not logged in") }

    const record: Row = {
      id: crypto.randomUUID(), user_id: userData.user.id, name, value,
      synced: false, deleted: false, created_at: new Date().toISOString(),
    }
    await dbPut(store, record)
    setRows((prev) => [record, ...prev])
    toast.success(navigator.onLine ? `${store === "assets" ? "Asset" : "Liability"} added` : "Saved offline — syncs when online")
    setSub(false)

    if (navigator.onLine) {
      await syncAll()
      setRows((prev) => prev.map((r) => r.id === record.id ? { ...r, synced: true } : r))
    }
  }

  async function removeItem(store: "assets" | "liabilities", id: string, setRows: React.Dispatch<React.SetStateAction<Row[]>>) {
    await dbDelete(store, id)
    setRows((prev) => prev.filter((r) => r.id !== id))
    if (navigator.onLine) await syncAll()
    else toast.info("Deletion queued — syncs when online")
  }

  return (
    <TrackerShell title="Net worth" subtitle="Assets minus liabilities, updated instantly.">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatTile label="Assets" value={formatUGXShort(assetTotal)} accent="primary" />
        <StatTile label="Liabilities" value={formatUGXShort(liabTotal)} accent="destructive" />
        <StatTile label="Net worth" value={formatUGXShort(netWorth)} accent={netWorth >= 0 ? "primary" : "destructive"} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <SideList kind="asset" title="Assets" icon={Plus} rows={assets} loading={loadingA}
          onAdd={(n, v) => addItem("assets", n, v, setSubA, setAssets)}
          onRemove={(id) => removeItem("assets", id, setAssets)} submitting={subA} />
        <SideList kind="liability" title="Liabilities" icon={Minus} rows={liabilities} loading={loadingL}
          onAdd={(n, v) => addItem("liabilities", n, v, setSubL, setLiabilities)}
          onRemove={(id) => removeItem("liabilities", id, setLiabilities)} submitting={subL} />
      </div>

      <IdealNetWorth actualNetWorth={netWorth} />
    </TrackerShell>
  )
}
