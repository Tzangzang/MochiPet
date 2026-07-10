"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/services/supabase/client"

/**
 * Nút đăng nhập Google (OAuth). Chỉ dùng scope đăng nhập cơ bản do provider
 * cung cấp — KHÔNG yêu cầu Gmail/Drive/Calendar hay scope nhạy cảm.
 * Không log OAuth URL/token, không lưu provider_token.
 *
 * Google OAuth có thể chưa hoạt động cho tới khi provider được bật trong
 * Supabase Dashboard; lỗi đó được xử lý và hiển thị rõ ràng.
 */
export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setError(null)
    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      })

      if (oauthError) {
        setError("Không thể đăng nhập với Google. Vui lòng thử lại sau.")
        setLoading(false)
      }
      // Thành công: trình duyệt điều hướng sang Google, không cần reset state.
    } catch {
      setError("Không thể đăng nhập với Google. Vui lòng thử lại sau.")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? "Đang chuyển hướng..." : "Tiếp tục với Google"}
      </Button>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
