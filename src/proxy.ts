import { type NextRequest } from "next/server"

import { updateSession } from "@/services/supabase/proxy"

// Next.js 16 dùng `proxy.ts` (thay cho `middleware.ts`).
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Bỏ qua các đường dẫn không cần auth:
     * - _next/static, _next/image (build assets)
     * - favicon.ico
     * - file ảnh/font tĩnh phổ biến
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)$).*)",
  ],
}
