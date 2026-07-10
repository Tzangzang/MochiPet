import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { getClientEnv } from "@/config/env"

/**
 * Refresh session cookie + kiểm soát truy cập cho từng request (Next.js 16 Proxy).
 *
 * - Dùng pattern chính thức của @supabase/ssr: đọc/ghi cookie qua request/response.
 * - Dùng `getClaims()` (xác minh JWT) để quyết định authentication — KHÔNG dùng
 *   `getSession()` cho quyết định authorization phía server.
 * - `/dashboard` và route con yêu cầu đăng nhập.
 * - User đã đăng nhập vào /login hoặc /signup -> chuyển tới /dashboard.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request })

  const env = getClientEnv()

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          supabaseResponse = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // QUAN TRỌNG: không chèn logic giữa createServerClient và getClaims.
  const { data } = await supabase.auth.getClaims()
  const isAuthenticated = Boolean(data?.claims)

  const { pathname } = request.nextUrl
  const isAuthPage = pathname === "/login" || pathname === "/signup"
  const isProtected =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/")

  // Giữ cookie đã refresh khi redirect.
  const redirectTo = (targetPath: string): NextResponse => {
    const url = request.nextUrl.clone()
    url.pathname = targetPath
    url.search = ""
    const redirectResponse = NextResponse.redirect(url)
    for (const cookie of supabaseResponse.cookies.getAll()) {
      redirectResponse.cookies.set(cookie)
    }
    return redirectResponse
  }

  if (!isAuthenticated && isProtected) {
    return redirectTo("/login")
  }

  if (isAuthenticated && isAuthPage) {
    return redirectTo("/dashboard")
  }

  return supabaseResponse
}
