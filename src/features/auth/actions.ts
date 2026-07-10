"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { createSupabaseServerClient } from "@/services/supabase/server"
import { signInSchema, signUpSchema, timezoneSchema } from "./schemas"

/**
 * Kết quả chuẩn hóa của server action (discriminated union).
 * Thành công thường redirect (không trả về); trả về khi cần hiển thị lỗi hoặc
 * trạng thái (vd yêu cầu xác nhận email).
 */
export type AuthActionState =
  | { success: true; message?: string }
  | {
      success: false
      formError?: string
      fieldErrors?: Record<string, string[]>
      message?: string
    }

function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]
    if (typeof key === "string") {
      ;(out[key] ??= []).push(issue.message)
    }
  }
  return out
}

/** Xây origin an toàn từ request headers — không hard-code production domain. */
function getOrigin(h: Headers): string {
  const origin = h.get("origin")
  if (origin) return origin
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto = h.get("x-forwarded-proto") ?? "http"
  return `${proto}://${host}`
}

export async function signInWithPasswordAction(
  input: unknown,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, fieldErrors: toFieldErrors(parsed.error) }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    // Không phân biệt sai email hay sai password để tránh lộ thông tin.
    return { success: false, formError: "Email hoặc mật khẩu không đúng." }
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function signUpWithPasswordAction(
  input: unknown,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, fieldErrors: toFieldErrors(parsed.error) }
  }

  // timezone gửi kèm từ browser; parse riêng với fallback 'UTC'.
  const rawTimezone =
    input && typeof input === "object" && "timezone" in input
      ? (input as Record<string, unknown>).timezone
      : undefined
  const timezone = timezoneSchema.parse(
    typeof rawTimezone === "string" ? rawTimezone : "UTC",
  )

  const origin = getOrigin(await headers())

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.displayName,
        timezone,
      },
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent("/dashboard")}`,
    },
  })

  if (error) {
    // Thông báo chung, không tiết lộ email đã tồn tại hay chưa.
    return {
      success: false,
      formError: "Không thể tạo tài khoản. Vui lòng thử lại.",
    }
  }

  // Nếu có session ngay (email confirmation tắt) -> vào dashboard.
  if (data.session) {
    revalidatePath("/", "layout")
    redirect("/dashboard")
  }

  // Ngược lại: yêu cầu xác nhận email.
  return { success: true, message: "signup-check-email" }
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient()

  // Chỉ signOut khi thực sự có phiên hợp lệ (getClaims xác minh JWT).
  const { data } = await supabase.auth.getClaims()
  if (data?.claims) {
    await supabase.auth.signOut()
  }

  revalidatePath("/", "layout")
  redirect("/login?message=signed-out")
}
