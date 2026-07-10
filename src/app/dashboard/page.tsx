import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { createSupabaseServerClient } from "@/services/supabase/server"
import { signOutAction } from "@/features/auth/actions"
import { PetCorePanel } from "@/features/pet/components/pet-core-panel"

export const metadata: Metadata = {
  title: "Bảng điều khiển · MochiPet",
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()

  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  const userId = typeof claims?.sub === "string" ? claims.sub : null
  if (!claims || !userId) {
    redirect("/login")
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          MochiPet
        </h1>
        <form action={signOutAction}>
          <Button type="submit" variant="outline" size="sm">
            Đăng xuất
          </Button>
        </form>
      </header>
      <PetCorePanel />
    </main>
  )
}
