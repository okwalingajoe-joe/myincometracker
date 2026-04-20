import Link from "next/link"
import { AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  return (
    <div className="glass-strong rounded-3xl p-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertCircle className="h-7 w-7" aria-hidden />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {params.error ?? "We couldn't finish that action. Please try again."}
      </p>
      <Button asChild className="mt-6 h-11 w-full rounded-xl">
        <Link href="/auth/login">Back to log in</Link>
      </Button>
    </div>
  )
}
