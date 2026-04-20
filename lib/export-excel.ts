import * as XLSX from "xlsx"

import { createClient } from "@/lib/supabase/client"

type SheetDef = {
  name: string
  header: string[]
  rows: (string | number)[][]
}

function fmtDate(v: string | null | undefined) {
  if (!v) return ""
  try {
    return new Date(v).toISOString().slice(0, 10)
  } catch {
    return v
  }
}

export async function exportAllDataToExcel(firstName: string) {
  const supabase = createClient()
  const { data: userRes } = await supabase.auth.getUser()
  const user = userRes?.user
  if (!user) throw new Error("Not signed in")

  // Fetch every tracker in parallel; RLS scopes rows to the signed-in user.
  const [daily, giving, streams, assets, liabilities, investments] = await Promise.all([
    supabase
      .from("daily_income")
      .select("entry_date, source, source_detail, amount, payment_method, created_at")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false }),
    supabase
      .from("giving")
      .select("entry_date, category, category_detail, amount, payment_method, created_at")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false }),
    supabase
      .from("income_streams")
      .select("year, month, name, category, expected, received, comment, created_at")
      .eq("user_id", user.id)
      .order("year", { ascending: false })
      .order("month", { ascending: false }),
    supabase
      .from("assets")
      .select("name, value, created_at")
      .eq("user_id", user.id)
      .order("value", { ascending: false }),
    supabase
      .from("liabilities")
      .select("name, value, created_at")
      .eq("user_id", user.id)
      .order("value", { ascending: false }),
    supabase
      .from("investments")
      .select("name, type, amount, notes, created_at")
      .eq("user_id", user.id)
      .order("amount", { ascending: false }),
  ])

  const sheets: SheetDef[] = [
    {
      name: "Daily Income",
      header: ["Date", "Source", "Detail", "Amount (UGX)", "Payment method", "Recorded at"],
      rows: (daily.data ?? []).map((r) => [
        fmtDate(r.entry_date),
        r.source ?? "",
        r.source_detail ?? "",
        Number(r.amount ?? 0),
        r.payment_method ?? "",
        fmtDate(r.created_at),
      ]),
    },
    {
      name: "Giving",
      header: ["Date", "Category", "Detail", "Amount (UGX)", "Payment method", "Recorded at"],
      rows: (giving.data ?? []).map((r) => [
        fmtDate(r.entry_date),
        r.category ?? "",
        r.category_detail ?? "",
        Number(r.amount ?? 0),
        r.payment_method ?? "",
        fmtDate(r.created_at),
      ]),
    },
    {
      name: "Income Streams",
      header: [
        "Year",
        "Month",
        "Name",
        "Category",
        "Expected (UGX)",
        "Received (UGX)",
        "Comment",
      ],
      rows: (streams.data ?? []).map((r) => [
        Number(r.year ?? 0),
        Number(r.month ?? 0),
        r.name ?? "",
        r.category ?? "",
        Number(r.expected ?? 0),
        Number(r.received ?? 0),
        r.comment ?? "",
      ]),
    },
    {
      name: "Assets",
      header: ["Name", "Value (UGX)", "Added"],
      rows: (assets.data ?? []).map((r) => [
        r.name ?? "",
        Number(r.value ?? 0),
        fmtDate(r.created_at),
      ]),
    },
    {
      name: "Liabilities",
      header: ["Name", "Value (UGX)", "Added"],
      rows: (liabilities.data ?? []).map((r) => [
        r.name ?? "",
        Number(r.value ?? 0),
        fmtDate(r.created_at),
      ]),
    },
    {
      name: "Investments",
      header: ["Name", "Type", "Amount (UGX)", "Notes", "Added"],
      rows: (investments.data ?? []).map((r) => [
        r.name ?? "",
        r.type ?? "",
        Number(r.amount ?? 0),
        r.notes ?? "",
        fmtDate(r.created_at),
      ]),
    },
  ]

  const totalAssets = (assets.data ?? []).reduce((s, r) => s + Number(r.value ?? 0), 0)
  const totalLiab = (liabilities.data ?? []).reduce((s, r) => s + Number(r.value ?? 0), 0)
  const totalIncome = (daily.data ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0)
  const totalGiving = (giving.data ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0)
  const totalInvest = (investments.data ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0)

  const summary: SheetDef = {
    name: "Summary",
    header: ["Metric", "Value (UGX)"],
    rows: [
      ["Total daily income recorded", totalIncome],
      ["Total giving recorded", totalGiving],
      ["Total assets", totalAssets],
      ["Total liabilities", totalLiab],
      ["Net worth (assets - liabilities)", totalAssets - totalLiab],
      ["Total invested", totalInvest],
      ["Exported on", new Date().toISOString().slice(0, 10)],
    ],
  }

  const wb = XLSX.utils.book_new()
  for (const s of [summary, ...sheets]) {
    const ws = XLSX.utils.aoa_to_sheet([s.header, ...s.rows])
    // Best-effort column widths
    const cols = s.header.map((_, i) => {
      const maxLen = Math.max(
        s.header[i]?.toString().length ?? 10,
        ...s.rows.map((row) => row[i]?.toString().length ?? 0),
      )
      return { wch: Math.min(Math.max(maxLen + 2, 12), 40) }
    })
    ;(ws as XLSX.WorkSheet)["!cols"] = cols
    XLSX.utils.book_append_sheet(wb, ws, s.name)
  }

  const stamp = new Date().toISOString().slice(0, 10)
  const safe = (firstName || "my").replace(/[^a-z0-9]/gi, "").toLowerCase() || "my"
  XLSX.writeFile(wb, `${safe}-income-tracker-${stamp}.xlsx`)
}
