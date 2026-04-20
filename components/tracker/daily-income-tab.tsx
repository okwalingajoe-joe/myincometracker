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

type IncomeRow = LocalRecord & {
  entry_date: string
  source: string
  source_detail: string | null
  amount: number
  payment_method: string
}

const SOURCES = ["Salary","Wage","Commission","Transport allowance","Business","Freelance","Gift","Refund","Other"]
const METHODS = ["Mobile Money","Cash","Bank","Card"]

export function DailyIncomeTab() {
  const supabase = useMemo(() => createClient(), [])
  const [rows, setRows] = useState<IncomeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const [entryDate, setEntryDate] = useState(today)
  const [source, setSource] = useState(SOURCES[0])
  const [detail, setDetail] = useState("")
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState(METHODS[0])

  const load = useCallback(async () => {
    setLoading(true)
    // 1. Load from local DB immediately (works offline)
    const local = await dbGetAll<IncomeRow>("daily_income")
    local.sort((a, b) => b.entry_date.localeCompare(a.entry_date) || b.created_at.localeCompare(a.created_at))
    setRows(local.slice(0, 50))
    setLoading(false)

    // 2. If online, pull from Supabase to catch other-device records
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from("daily_income").select("*")
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50)
      if (!error && data) {
        for (const row of data) {
          const existing = local.find((r) => r.id === row.id)
          if (!existing || existing.synced) {
            await dbPut("daily_income", { ...row, synced: true, deleted: false })
          }
        }
        const merged = await dbGetAll<IncomeRow>("daily_income")
        merged.sort((a, b) => b.entry_date.localeCompare(a.entry_date) || b.created_at.localeCompare(a.created_at))
        setRows(merged.slice(0, 50))
      }
    }
  }, [supabase])

  useEffect(() => { load() }, [load])

  const todayTotal = rows.filter((r) => r.entry_date === today).reduce((s, r) => s + Number(r.amount), 0)
  const monthTotal = rows.filter((r) => r.entry_date.slice(0, 7) === today.slice(0, 7)).reduce((s, r) => s + Number(r.amount), 0)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = Number.parseFloat(amount)
    if (!Number.isFinite(amt) || amt < 0) { toast.error("Enter a valid amount"); return }
    setSubmitting(true)
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { toast.error("You are not logged in"); setSubmitting(false); return }

    const record: IncomeRow = {
      id: crypto.randomUUID(), user_id: userData.user.id,
      entry_date: entryDate, source, source_detail: detail || null,
      amount: amt, payment_method: method,
      synced: false, deleted: false, created_at: new Date().toISOString(),
    }

    await dbPut("daily_income", record)
    setRows((prev) => [record, ...prev].slice(0, 50))
    toast.success(navigator.onLine ? "Income recorded" : "Saved offline — syncs when online")
    setAmount(""); setDetail(""); setSubmitting(false)

    if (navigator.onLine) {
      await syncAll()
      setRows((prev) => prev.map((r) => r.id === record.id ? { ...r, synced: true } : r))
    }
  }

  async function remove(id: string) {
    await dbDelete("daily_income", id)
    setRows((prev) => prev.filter((r) => r.id !== id))
    if (navigator.onLine) await syncAll()
    else toast.info("Deletion queued — syncs when online")
  }

  return (
    <TrackerShell title="Daily income" subtitle="Every shilling, the moment it arrives.">
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Today" value={formatUGX(todayTotal)} />
        <StatTile label="This month" value={formatUGX(monthTotal)} accent="primary" />
      </div>

      <form onSubmit={onSubmit} className="glass-strong flex flex-col gap-4 rounded-3xl p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="di-date">Date</Label>
            <Input id="di-date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="h-11 rounded-xl bg-background/70" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="di-amount">Amount (UGX)</Label>
            <Input id="di-amount" type="number" inputMode="numeric" min={0} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="h-11 rounded-xl bg-background/70" required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="h-11 rounded-xl bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Payment method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="h-11 rounded-xl bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>{METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="di-detail">Detail (optional)</Label>
          <Input id="di-detail" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="e.g. April salary from ABC Ltd" className="h-11 rounded-xl bg-background/70" />
        </div>
        <Button type="submit" disabled={submitting} className="h-11 rounded-xl shadow-lg shadow-primary/30">
          {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : <><Plus className="mr-1.5 h-4 w-4" /> Add income</>}
        </Button>
      </form>

      <section className="glass rounded-3xl">
        <div className="flex items-center justify-between border-b border-white/40 px-5 py-3">
          <h3 className="text-sm font-semibold">Recent entries</h3>
          <span className="text-xs text-muted-foreground">{rows.length} shown</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>
        ) : rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">No entries yet. Add your first income above.</p>
        ) : (
          <ul className="divide-y divide-white/40">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {r.source}
                    {r.source_detail ? <span className="text-muted-foreground"> — {r.source_detail}</span> : null}
                    {!r.synced && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 align-middle" title="Pending sync" />}
                  </p>
                  <p className="text-xs text-muted-foreground">{r.entry_date} · {r.payment_method}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold">{formatUGX(r.amount)}</span>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(r.id)} className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-destructive" aria-label={`Delete ${r.source}`}>
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
