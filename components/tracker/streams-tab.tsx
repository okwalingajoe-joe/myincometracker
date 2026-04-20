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
import { formatUGX, formatUGXShort } from "@/lib/currency"
import { createClient } from "@/lib/supabase/client"
import { dbGetAll, dbPut, dbDelete, type LocalRecord } from "@/lib/db"
import { syncAll } from "@/lib/sync"
import { StatTile, TrackerShell } from "./tracker-shell"

type StreamRow = LocalRecord & {
  month: number
  year: number
  name: string
  category: string
  expected: number
  received: number
  comment: string | null
}

const CATEGORIES = ["Job","Business","Rental","Investment","Side hustle","Other"]
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

export function StreamsTab() {
  const supabase = useMemo(() => createClient(), [])
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [rows, setRows] = useState<StreamRow[]>([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState("")
  const [category, setCategory] = useState(CATEGORIES[0])
  const [expected, setExpected] = useState("")
  const [received, setReceived] = useState("")
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const local = await dbGetAll<StreamRow>("income_streams")
    const filtered = local.filter((r) => r.month === month && r.year === year)
    filtered.sort((a, b) => a.created_at.localeCompare(b.created_at))
    setRows(filtered)
    setLoading(false)

    if (navigator.onLine) {
      const { data, error } = await supabase.from("income_streams").select("*")
        .eq("month", month).eq("year", year).order("created_at", { ascending: true })
      if (!error && data) {
        for (const row of data) {
          const existing = local.find((r) => r.id === row.id)
          if (!existing || existing.synced) await dbPut("income_streams", { ...row, synced: true, deleted: false })
        }
        const merged = await dbGetAll<StreamRow>("income_streams")
        const mergedFiltered = merged.filter((r) => r.month === month && r.year === year)
        mergedFiltered.sort((a, b) => a.created_at.localeCompare(b.created_at))
        setRows(mergedFiltered)
      }
    }
  }, [month, year, supabase])

  useEffect(() => { load() }, [load])

  const totalExpected = rows.reduce((s, r) => s + Number(r.expected), 0)
  const totalReceived = rows.reduce((s, r) => s + Number(r.received), 0)
  const gap = totalExpected - totalReceived

  async function addStream(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error("Name is required")
    const exp = Number.parseFloat(expected || "0")
    const rec = Number.parseFloat(received || "0")
    if (!Number.isFinite(exp) || exp < 0 || !Number.isFinite(rec) || rec < 0) return toast.error("Enter valid amounts")
    setSubmitting(true)
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { toast.error("Not logged in"); setSubmitting(false); return }

    const record: StreamRow = {
      id: crypto.randomUUID(), user_id: userData.user.id,
      month, year, name: name.trim(), category,
      expected: exp, received: rec, comment: comment || null,
      synced: false, deleted: false, created_at: new Date().toISOString(),
    }

    await dbPut("income_streams", record)
    setRows((prev) => [...prev, record])
    toast.success(navigator.onLine ? "Stream added" : "Saved offline — syncs when online")
    setName(""); setExpected(""); setReceived(""); setComment(""); setSubmitting(false)

    if (navigator.onLine) {
      await syncAll()
      setRows((prev) => prev.map((r) => r.id === record.id ? { ...r, synced: true } : r))
    }
  }

  async function updateReceived(id: string, value: string) {
    const rec = Number.parseFloat(value || "0")
    if (!Number.isFinite(rec) || rec < 0) return
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, received: rec, synced: false } : r))
    const existing = await (await import("@/lib/db")).dbGet<StreamRow>("income_streams", id)
    if (existing) {
      await dbPut("income_streams", { ...existing, received: rec, synced: false })
      if (navigator.onLine) await syncAll()
    }
  }

  async function remove(id: string) {
    await dbDelete("income_streams", id)
    setRows((prev) => prev.filter((r) => r.id !== id))
    if (navigator.onLine) await syncAll()
    else toast.info("Deletion queued — syncs when online")
  }

  const years = [year - 1, year, year + 1]

  return (
    <TrackerShell title="Income streams" subtitle="Plan expected income, log what actually landed.">
      <div className="flex items-center gap-2">
        <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
          <SelectTrigger className="h-10 w-[120px] rounded-full bg-white/60 backdrop-blur-xl"><SelectValue /></SelectTrigger>
          <SelectContent>{MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="h-10 w-[100px] rounded-full bg-white/60 backdrop-blur-xl"><SelectValue /></SelectTrigger>
          <SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatTile label="Expected" value={formatUGXShort(totalExpected)} />
        <StatTile label="Received" value={formatUGXShort(totalReceived)} accent="primary" />
        <StatTile label="Gap" value={formatUGXShort(gap)} accent={gap > 0 ? "destructive" : "muted"} hint={gap > 0 ? "To come" : "On target"} />
      </div>

      <form onSubmit={addStream} className="glass-strong flex flex-col gap-4 rounded-3xl p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s-name">Stream name</Label>
            <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rental – Ntinda" className="h-11 rounded-xl bg-background/70" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-11 rounded-xl bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s-exp">Expected (UGX)</Label>
            <Input id="s-exp" type="number" min={0} step="any" value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="0" className="h-11 rounded-xl bg-background/70" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s-rec">Received so far (UGX)</Label>
            <Input id="s-rec" type="number" min={0} step="any" value={received} onChange={(e) => setReceived(e.target.value)} placeholder="0" className="h-11 rounded-xl bg-background/70" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="s-comment">Comment (optional)</Label>
          <Input id="s-comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Any note to your future self" className="h-11 rounded-xl bg-background/70" />
        </div>
        <Button type="submit" disabled={submitting} className="h-11 rounded-xl shadow-lg shadow-primary/30">
          {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : <><Plus className="mr-1.5 h-4 w-4" /> Add stream</>}
        </Button>
      </form>

      <section className="glass rounded-3xl">
        <div className="flex items-center justify-between border-b border-white/40 px-5 py-3">
          <h3 className="text-sm font-semibold">{MONTHS[month - 1]} {year}</h3>
          <span className="text-xs text-muted-foreground">{rows.length} streams</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>
        ) : rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">No streams for this month yet.</p>
        ) : (
          <ul className="divide-y divide-white/40">
            {rows.map((r) => {
              const pct = Number(r.expected) > 0 ? Math.min(100, (Number(r.received) / Number(r.expected)) * 100) : 0
              return (
                <li key={r.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {r.name}
                        {!r.synced && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 align-middle" title="Pending sync" />}
                      </p>
                      <p className="text-xs text-muted-foreground">{r.category}{r.comment ? ` · ${r.comment}` : ""}</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(r.id)} className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-destructive" aria-label={`Delete ${r.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
                      <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{Math.round(pct)}%</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-background/60 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Expected</p>
                      <p className="text-sm font-medium">{formatUGX(r.expected)}</p>
                    </div>
                    <label className="flex flex-col gap-0.5 rounded-xl bg-background/60 px-3 py-2">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Received</span>
                      <Input type="number" min={0} step="any" defaultValue={Number(r.received)}
                        onBlur={(e) => { if (Number(e.target.value) !== Number(r.received)) updateReceived(r.id, e.target.value) }}
                        className="h-6 w-full rounded-md border-none bg-transparent p-0 text-sm font-medium shadow-none focus-visible:ring-0" />
                    </label>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </TrackerShell>
  )
}
