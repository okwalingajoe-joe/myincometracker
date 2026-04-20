import Link from "next/link"
import { redirect } from "next/navigation"

import { AccountMenu } from "@/components/account-menu"
import { LogoMark } from "@/components/brand/logo"
import { SyncStatus } from "@/components/sync-status"
import { createClient } from "@/lib/supabase/server"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, is_owner")
    .eq("id", user.id)
    .maybeSingle()

  const firstName = profile?.first_name?.trim() || (user.email?.split("@")[0] ?? "there")
  const lastName = profile?.last_name?.trim() || ""
  const initials =
    `${(profile?.first_name?.[0] ?? user.email?.[0] ?? "?")}${profile?.last_name?.[0] ?? ""}`
      .toUpperCase()
      .slice(0, 2)

  return (
    <div className="relative flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 border-b border-white/30 bg-white/40 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/app" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <LogoMark className="h-5 w-5" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-xs text-muted-foreground">Hello,</span>
              <span className="text-sm font-semibold tracking-tight">{firstName}</span>
            </div>
          </Link>

          <SyncStatus />

          <AccountMenu
            firstName={firstName}
            lastName={lastName}
            initials={initials}
            isOwner={Boolean(profile?.is_owner)}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20 pt-6 sm:px-6">{children}</main>
    </div>
  )
}
