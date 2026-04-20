import { cn } from "@/lib/utils"

// Simple wrapper used by every tab for a consistent look.
export function TrackerShell({
  title,
  subtitle,
  children,
  className,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </header>
      {children}
    </div>
  )
}

export function StatTile({
  label,
  value,
  hint,
  accent = "primary",
}: {
  label: string
  value: string
  hint?: string
  accent?: "primary" | "accent" | "muted" | "destructive"
}) {
  const accentMap: Record<string, string> = {
    primary: "text-primary",
    accent: "text-accent-foreground",
    muted: "text-muted-foreground",
    destructive: "text-destructive",
  }
  return (
    <div className="glass flex min-w-0 flex-col rounded-2xl p-3 sm:p-4">
      <p className="truncate text-[10px] uppercase tracking-widest text-muted-foreground sm:text-xs">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 truncate text-base font-semibold tabular-nums tracking-tight sm:text-xl",
          accentMap[accent],
        )}
        title={value}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 truncate text-[10px] text-muted-foreground sm:text-xs">{hint}</p> : null}
    </div>
  )
}
