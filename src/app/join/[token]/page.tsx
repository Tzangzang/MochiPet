import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/services/supabase/server"
import { JoinFlow } from "@/features/coop/components/join-flow"

export const metadata: Metadata = {
  title: "Cùng nuôi Mochi · MochiPet",
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) {
    redirect(`/login?next=/join/${encodeURIComponent(token)}`)
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-center text-2xl font-semibold tracking-tight text-foreground">MochiPet</h1>
      <JoinFlow token={token} />
    </main>
  )
}
