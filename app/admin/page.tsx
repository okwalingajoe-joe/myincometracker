import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createClient } from "@/lib/supabase/server"

function formatDate(d: string) {
  return new Date(d).toLocaleString("en-UG", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  if (!user) redirect("/auth/login?next=/admin")

  // Check owner flag
  const { data: me } = await supabase
    .from("profiles")
    .select("is_owner, first_name")
    .eq("id", user.id)
    .maybeSingle()

  if (!me?.is_owner) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="glass-strong w-full rounded-3xl p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Owner access only</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This page is reserved for the app owner. If that&apos;s you, run this one-line SQL command in the{" "}
            <span className="font-medium">scripts</span> folder (or the Supabase SQL editor) while logged in as yourself:
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-foreground/5 px-4 py-3 text-left text-xs">
{`update public.profiles
set is_owner = true
where id = '${user.id}';`}
          </pre>
          <p className="mt-3 text-xs text-muted-foreground">
            Your user id has been filled in automatically. Run it once, then refresh this page.
          </p>
          <Button asChild className="mt-6 h-11 w-full rounded-xl">
            <Link href="/app">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to tracker
            </Link>
          </Button>
        </div>
      </main>
    )
  }

  // Load all profiles (RLS allows it because is_owner() is true)
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, created_at, is_owner")
    .order("created_at", { ascending: false })

  const total = profiles?.length ?? 0
  const thisWeek =
    profiles?.filter((p) => {
      const d = new Date(p.created_at).getTime()
      return Date.now() - d < 7 * 24 * 60 * 60 * 1000
    }).length ?? 0

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col px-5 pb-16 pt-6 sm:px-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white/50 backdrop-blur-xl">
            <Link href="/app" aria-label="Back to tracker">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Owner dashboard</h1>
            <p className="text-sm text-muted-foreground">Every account created in MyIncomeTracker.</p>
          </div>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="glass rounded-2xl p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Total signups</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-primary">{total}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Past 7 days</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight">{thisWeek}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Owner
          </p>
          <p className="mt-1.5 truncate text-base font-medium">{me.first_name || user.email}</p>
        </div>
      </section>

      <section className="glass-strong mt-6 overflow-hidden rounded-3xl">
        {error ? (
          <p className="p-6 text-sm text-destructive">{error.message}</p>
        ) : !profiles || profiles.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No signups yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/40 hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Signed up</TableHead>
                  <TableHead className="text-right">Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => (
                  <TableRow key={p.id} className="border-white/40">
                    <TableCell className="font-medium">
                      {p.first_name || ""} {p.last_name || ""}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.email}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(p.created_at)}</TableCell>
                    <TableCell className="text-right">
                      {p.is_owner ? (
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          Owner
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">User</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </main>
  )
}
