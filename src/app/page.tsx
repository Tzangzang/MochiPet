import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/services/supabase/server"

export default async function Home() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getClaims()
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null
  if (userId) {
    redirect("/dashboard")
  }
  redirect("/login")
}
