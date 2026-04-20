"use client"

import { Sparkles } from "lucide-react"
import { useEffect, useState } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatUGX } from "@/lib/currency"

const STORAGE_KEY = "mit:ideal-net-worth"

type Stored = { age: string; income: string }

export function IdealNetWorth({ actualNetWorth }: { actualNetWorth: number }) {
  const [age, setAge] = useState("")
  const [income, setIncome] = useState("")
  const [hydrated, setHydrated] = useState(false)

  // Load saved values (persisted on the device).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Stored
        setAge(parsed.age ?? "")
        setIncome(parsed.income ?? "")
      }
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [])

  // Persist on change.
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ age, income }))
    } catch {
      // ignore
    }
  }, [age, income, hydrated])

  const ageNum = Number.parseFloat(age)
  const incomeNum = Number.parseFloat(income)
  const valid =
    Number.isFinite(ageNum) && ageNum > 0 && Number.isFinite(incomeNum) && incomeNum > 0

  // Stanley-Danko "expected net worth" formula.
  const ideal = valid ? (ageNum * incomeNum) / 10 : 0
  const gap = ideal - actualNetWorth
  const ratio = ideal > 0 ? Math.max(0, Math.min(1, actualNetWorth / ideal)) : 0
  const pct = Math.round(ratio * 100)

  let status = ""
  let tone: "primary" | "warn" | "destructive" = "primary"
  if (valid) {
    if (ratio >= 2) {
      status = "Prodigious wealth builder — well above target."
      tone = "primary"
    } else if (ratio >= 1) {
      status = "On track. You are at or above your ideal."
      tone = "primary"
    } else if (ratio >= 0.5) {
      status = "Average accumulator — room to grow."
      tone = "warn"
    } else {
      status = "Below target. Small consistent steps compound."
      tone = "destructive"
    }
  }

  const barColor =
    tone === "primary"
      ? "bg-primary"
      : tone === "warn"
        ? "bg-accent"
        : "bg-destructive"

  return (
    <section className="glass-strong rounded-3xl p-5">
      <header className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h3 className="text-sm font-semibold">Ideal net worth</h3>
          <p className="text-xs text-muted-foreground">
            Based on age × annual income ÷ 10 (Stanley-Danko formula).
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="inw-age">Your age</Label>
          <Input
            id="inw-age"
            type="number"
            min={1}
            max={120}
            inputMode="numeric"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="e.g. 28"
            className="h-11 rounded-xl bg-background/70"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="inw-income">Annual pre-tax income (UGX)</Label>
          <Input
            id="inw-income"
            type="number"
            min={0}
            step="any"
            inputMode="numeric"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            placeholder="e.g. 18,000,000"
            className="h-11 rounded-xl bg-background/70"
          />
        </div>
      </div>

      {valid ? (
        <div className="mt-5 flex flex-col gap-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Ideal target
              </p>
              <p className="text-2xl font-semibold tabular-nums text-foreground text-balance">
                {formatUGX(ideal)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                You are at
              </p>
              <p className="text-lg font-semibold tabular-nums">{pct}%</p>
            </div>
          </div>

          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progress toward ideal net worth"
          >
            <div
              className={`h-full rounded-full ${barColor} transition-[width]`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">
              {gap > 0 ? "Gap to target:" : "Above target by:"}
            </span>
            <span
              className={`font-semibold tabular-nums ${gap > 0 ? "text-destructive" : "text-primary"}`}
            >
              {formatUGX(Math.abs(gap))}
            </span>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">{status}</p>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">
          Enter your age and annual income to see your ideal target.
        </p>
      )}
    </section>
  )
}
