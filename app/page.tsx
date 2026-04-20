import { redirect } from "next/navigation"

import { Onboarding } from "@/components/onboarding/onboarding"
import { createClient } from "@/lib/supabase/server"

export default async function Home() {
  // If the user is already signed in, skip onboarding and jump to the app.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect("/app")

  return <Onboarding />
}
