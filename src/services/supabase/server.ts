import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { getClientEnv } from "@/config/env"

/**
 * Server-side Supabase client cho Next.js App Router (Server Component,
 * Route Handler, Server Action).
 *
 * - Tạo client theo TỪNG server request (đọc cookie của request hiện tại).
 * - Chỉ dùng Publishable Key cho session người dùng — không service role / secret.
 * - `cookies()` ở Next.js 16 là async, nên hàm này là async và await nó.
 * - Việc ghi cookie có thể bị chặn khi gọi từ Server Component (chỉ đọc). Khi
 *   đó bắt lỗi và bỏ qua an toàn theo pattern chính thức (session sẽ được
 *   refresh ở middleware — sẽ thêm ở bước sau, không thuộc lượt này).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  const env = getClientEnv()

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Được gọi từ Server Component không cho phép ghi cookie.
            // Bỏ qua an toàn — không làm app crash.
          }
        },
      },
    },
  )
}
