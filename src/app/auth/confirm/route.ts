import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/services/supabase/server"
import { getSafeNextPath } from "@/features/auth/safe-redirect"

/**
 * Email confirmation (SSR) qua token_hash + verifyOtp.
 * - Chỉ chấp nhận `type` nằm trong tập EmailOtpType được Supabase hỗ trợ.
 * - `next` chỉ được là internal relative path.
 * - Không log `token_hash`.
 *
 * LƯU Ý: Supabase Email Template phải được cấu hình để trỏ tới route này với
 * dạng: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard
 */
const VALID_OTP_TYPES: readonly EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]

function isValidOtpType(value: string | null): value is EmailOtpType {
  return value !== null && (VALID_OTP_TYPES as readonly string[]).includes(value)
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const next = getSafeNextPath(searchParams.get("next"))

  if (tokenHash && isValidOtpType(type)) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
