import { cn } from "@/lib/utils"

/**
 * The custom MyIncomeTracker mark: a coin ring with an ascending trend line
 * and a small dot at the peak. Reads as "money + growth" at any size.
 * Colors are inherited via `currentColor`, so the parent controls the tint.
 */
export function LogoMark({
  className,
  title = "MyIncomeTracker logo",
}: {
  className?: string
  title?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      className={cn("h-6 w-6", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9.25" />
      <path d="M7.25 14.5 L10.25 11.25 L12.75 13 L16.5 8.75" />
      <circle cx="16.5" cy="8.75" r="1.35" fill="currentColor" stroke="none" />
    </svg>
  )
}

/**
 * Full brand lockup: the green rounded tile with the mark + the wordmark.
 */
export function LogoLockup({
  className,
  size = "md",
  wordmark = true,
}: {
  className?: string
  size?: "sm" | "md" | "lg"
  wordmark?: boolean
}) {
  const sizes = {
    sm: { tile: "h-8 w-8", icon: "h-4 w-4", text: "text-sm" },
    md: { tile: "h-9 w-9", icon: "h-5 w-5", text: "text-base" },
    lg: { tile: "h-14 w-14", icon: "h-8 w-8", text: "text-lg" },
  }[size]

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "grid place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30",
          sizes.tile,
        )}
      >
        <LogoMark className={sizes.icon} />
      </span>
      {wordmark ? (
        <span className={cn("font-semibold tracking-tight", sizes.text)}>MyIncomeTracker</span>
      ) : null}
    </span>
  )
}
