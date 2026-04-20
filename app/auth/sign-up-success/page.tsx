import Link from "next/link"
import { MailCheck } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="glass-strong rounded-3xl p-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <MailCheck className="h-7 w-7" aria-hidden />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">Check your email</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        We just sent you a confirmation link. Click it to activate your account, then come back and log in to start
        tracking.
      </p>
      <Button asChild className="mt-6 h-11 w-full rounded-xl">
        <Link href="/auth/login">Back to log in</Link>
      </Button>
    </div>
  )
}
