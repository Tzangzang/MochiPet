import { createBrowserClient } from "@supabase/ssr"

import { getClientEnv } from "@/config/env"

/**
 * Browser (client-side) Supabase client.
 *
 * Chỉ dùng biến PUBLIC (URL + Publishable Key) — không bao giờ dùng service
 * role / secret key ở phía browser. Không hard-code URL hay key: mọi giá trị
 * lấy qua `getClientEnv()` (validate bằng Zod, đọc lazy).
 */

type BrowserClient = ReturnType<typeof createBrowserClient>

// Giữ một instance duy nhất cho mỗi browser session để không tạo lại client
// không cần thiết giữa các lần render / import.
let browserClient: BrowserClient | undefined

export function getSupabaseBrowserClient(): BrowserClient {
  if (browserClient) return browserClient

  const env = getClientEnv()

  browserClient = createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  )

  return browserClient
}
