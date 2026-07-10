import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createSupabaseServerClient } from "@/services/supabase/server"
import { signOutAction } from "@/features/auth/actions"

export const metadata: Metadata = {
  title: "Bảng điều khiển · MochiPet",
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()

  // Xác minh authentication bằng getClaims (không dùng getSession để authorize).
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  const userId = typeof claims?.sub === "string" ? claims.sub : null
  if (!claims || !userId) {
    redirect("/login")
  }

  const email = typeof claims.email === "string" ? claims.email : null

  // Đọc profile của chính user (RLS bảo vệ). Chỉ select field cần thiết.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, timezone, onboarding_completed")
    .eq("id", userId)
    .maybeSingle()

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Đăng nhập thành công</CardTitle>
            <CardDescription>
              Xác thực MochiPet hoạt động. (Đây là trang tạm thời, chưa phải Pet
              Core.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Tên hiển thị</dt>
                <dd className="font-medium">
                  {profile?.display_name ?? "—"}
                </dd>
              </div>
              {email ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium">{email}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Múi giờ</dt>
                <dd className="font-medium">{profile?.timezone ?? "UTC"}</dd>
              </div>
            </dl>

            <Separator />

            <form action={signOutAction}>
              <Button type="submit" variant="outline" className="w-full">
                Đăng xuất
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
