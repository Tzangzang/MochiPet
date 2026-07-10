"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signUpSchema, type SignUpInput } from "../schemas"
import { signUpWithPasswordAction } from "../actions"
import { GoogleSignInButton } from "./google-sign-in-button"

/** Lấy timezone của browser; fallback 'UTC' nếu không hợp lệ. */
function getBrowserTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return tz && tz.length > 0 && tz.length <= 100 ? tz : "UTC"
  } catch {
    return "UTC"
  }
}

export function SignupForm() {
  const [formError, setFormError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: SignUpInput) {
    setFormError(null)
    setInfo(null)
    const result = await signUpWithPasswordAction({
      ...values,
      timezone: getBrowserTimezone(),
    })
    // Thành công + có session -> action đã redirect (không tới đây).
    if (result && !result.success) {
      if (result.fieldErrors) {
        for (const [key, messages] of Object.entries(result.fieldErrors)) {
          if (messages[0]) setError(key as keyof SignUpInput, { message: messages[0] })
        }
      }
      if (result.formError) setFormError(result.formError)
    } else if (result && result.success && result.message === "signup-check-email") {
      setInfo("Kiểm tra email để xác nhận tài khoản.")
      reset()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="displayName">Tên hiển thị</Label>
        <Input
          id="displayName"
          type="text"
          autoComplete="name"
          aria-invalid={Boolean(errors.displayName)}
          {...register("displayName")}
        />
        {errors.displayName ? (
          <p className="text-sm text-destructive">{errors.displayName.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Nhập lại mật khẩu</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword ? (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        ) : null}
      </div>

      {formError ? (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}
      {info ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
          {info}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Đang tạo tài khoản..." : "Đăng ký"}
      </Button>

      <GoogleSignInButton />

      <p className="text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link href="/login" className="underline underline-offset-4">
          Đăng nhập
        </Link>
      </p>
    </form>
  )
}
