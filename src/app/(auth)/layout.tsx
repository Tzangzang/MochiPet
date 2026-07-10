import type { ReactNode } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/services/supabase/server"

/**
 * Layout cho route group auth. Nếu user đã đăng nhập hợp lệ (getClaims xác minh
 * JWT) thì chuyển thẳng tới /dashboard.
 */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getClaims()
  if (data?.claims) {
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <Link
        href="/"
        className="text-2xl font-semibold tracking-tight text-foreground"
      >
        MochiPet
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  )
}
