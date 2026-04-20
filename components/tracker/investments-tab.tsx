"use client"

import { Loader2, Plus, Trash2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { formatUGX } from "@/lib/currency"
import { createClient } from "@/lib/supabase/client"
import { dbGetAll, dbPut, dbDelete, type LocalRecord } from "@/lib/db"
import { syncAll } from "@/lib/sync"
import { StatTile, TrackerShell } from "./tracker-shell"

type InvestmentRow = LocalRecord & {
  name: string
  type: string
  amount: number
  notes: string | null
}

const TYPES = ["Real Estate","Stocks","SACCO","Bonds","Crypto","Business","Other"]

export function InvestmentsTab() {
  const supabase = useMemo(() => createClient(), [])
  const [rows, setRows] = useState<InvestmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [name, setName] = useState("")
  const [type, setType] = useState(TYPES[0])
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    const local = await dbGetAll<InvestmentRow>("investments")
    local.sort((a, b) => b.created_at.localeCompare(a.created_at))
    setRows(local)
    setLoading(false)

    if (navigator.onLine) {
      const { data, error } = await supabase.from("investments").select("*").order("created_at", { ascending: false })
      if (!error && data) {
        for (const row of data) {
          const existing = local.find((r) => r.id === row.id)
          if (!existing || existing.synced) await dbPut("investments", { ...row, synced: true, deleted: false })
        }
        const merged = await dbGetAll<InvestmentRow>("investments")
        merged.sort((a, b) => b.created_at.localeCompare(a.created_at))
        setRows(merged)
      }
    }
  }, [supabase])

  useEffect(() => { load() }, [load])

  const total = rows.reduce((s, r) => s + Number(r.amount), 0)
  const byType = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.type] = (acc[r.type] ?? 0) + Number(r.amount)
    return acc
  }, {})

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error("Name is required")
    const amt = Number.parseFloat(amount || "0")
    if (!Number.isFinite(amt) || amt < 0) return toast.error("Enter a valid amount")
    setSubmitting(true)
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { toast.error("Not logged in"); setSubmitting(false); return }

    const record: InvestmentRow = {
      id: crypto.randomUUID(), user_id: userData.user.id,
      name: name.trim(), type, amount: amt, notes: notes || null,
      synced: false, deleted: false, created_at: new Date().toISOString(),
    }

    await dbPut("investments", record)
    setRows((prev) => [record, ...prev])
    toast.success(navigator.onLine ? "Investment added" : "Saved offline — syncs when online")
    setName(""); setAmount(""); setNotes(""); setSubmitting(false)

    if (navigator.onLine) {
      await syncAll()
      setRows((prev) => prev.map((r) => r.id === record.id ? { ...r, synced: true } : r))
    }
  }

  async function remove(id: string) {
    await dbDelete("investments", id)
    setRows((prev) => prev.filter((r) => r.id !== id))
    if (navigator.onLine) await syncAll()
    else toast.info("Deletion queued — syncs when online")
  }

  return (
    <TrackerShell title="Investments" subtitle="Seeds planted for tomorrow.">
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Total invested" value={formatUGX(total)} accent="primary" />
        <StatTile label="Holdings" value={String(rows.length)} hint="individual investments" />
      </div>

      {Object.keys(byType).length > 0 && (
        <div className="glass rounded-2xl p-4">
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Breakdown</p>
          <ul className="flex flex-col gap-2">
            {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([t, v]) => {
              const pct = total > 0 ? (v / total) * 100 : 0
              return (
                <li key={t}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{t}</span>
                    <span className="tabular-nums text-muted-foreground">{formatUGX(v)} · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <form onSubmit={onSubmit} className="glass-strong flex flex-col gap-4 rounded-3xl p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="i-name">Name</Label>
            <Input id="i-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Plot in Wakiso" className="h-11 rounded-xl bg-background/70" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-11 rounded-xl bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="i-amount">Amount invested (UGX)</Label>
          <Input id="i-amount" type="number" min={0} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="h-11 rounded-xl bg-background/70" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="i-notes">Notes (optional)</Label>
          <Input id="i-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything worth remembering" className="h-11 rounded-xl bg-background/70" />
        </div>
        <Button type="submit" disabled={submitting} className="h-11 rounded-xl shadow-lg shadow-primary/30">
          {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : <><Plus className="mr-1.5 h-4 w-4" /> Add investment</>}
        </Button>
      </form>

      <section className="glass rounded-3xl">
        <div className="flex items-center justify-between border-b border-white/40 px-5 py-3">
          <h3 className="text-sm font-semibold">All investments</h3>
          <span className="text-xs text-muted-foreground">{rows.length} items</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>
        ) : rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">No investments yet. Start small — a SACCO deposit counts.</p>
        ) : (
          <ul className="divide-y divide-white/40">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {r.name}
                    {!r.synced && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 align-middle" title="Pending sync" />}
                  </p>
                  <p className="text-xs text-muted-foreground">{r.type}{r.notes ? ` · ${r.notes}` : ""}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold">{formatUGX(r.amount)}</span>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(r.id)} className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-destructive" aria-label={`Delete ${r.name}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </TrackerShell>
  )
}
