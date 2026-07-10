import { NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/services/supabase/server"
import { getSafeNextPath } from "@/features/auth/safe-redirect"

/**
 * Google OAuth callback (PKCE code exchange).
 * - Chỉ chấp nhận `next` là internal relative path (chống open redirect).
 * - Không log `code` hay token.
 * - Xử lý forwarded host cho môi trường production theo pattern chính thức.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = getSafeNextPath(searchParams.get("next"))

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
