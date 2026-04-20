// Formats any number as Ugandan Shillings.
// Example: formatUGX(1234567) -> "UGX 1,234,567"

const formatter = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
})

export function formatUGX(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number.parseFloat(value) : value ?? 0
  if (!Number.isFinite(n)) return "UGX 0"
  return formatter.format(n)
}

// Short form e.g. 1.2M, 850K — nice for tight dashboard tiles.
export function formatUGXShort(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number.parseFloat(value) : value ?? 0
  if (!Number.isFinite(n)) return "UGX 0"
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `UGX ${(n / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `UGX ${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `UGX ${(n / 1_000).toFixed(1)}K`
  return `UGX ${Math.round(n)}`
}

export const CURRENCY_SYMBOL = "UGX"
