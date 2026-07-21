"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signInSchema, type SignInInput } from "../schemas"
import { signInWithPasswordAction } from "../actions"
import { getSafeNextPath } from "../safe-redirect"
import { GoogleSignInButton } from "./google-sign-in-button"
import { InviteCodeInput } from "@/features/coop/components/invite-code-input"
import { JoinConfirmCard } from "@/features/coop/components/join-confirm-card"
import { usePreviewInvitation, useAcceptInvitation } from "@/features/coop/hooks"
import { ACCEPT_MESSAGE, isCompleteCode } from "@/features/coop/lib"
import type { InvitationPreview } from "@/features/coop/types"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = getSafeNextPath(searchParams.get("next"), "/dashboard")
  const [formError, setFormError] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [preview, setPreview] = useState<InvitationPreview | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const previewMutation = usePreviewInvitation()
  const acceptMutation = useAcceptInvitation()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: SignInInput) {
    setFormError(null)
    const result = await signInWithPasswordAction(values)
    if (result && !result.success) {
      if (result.fieldErrors) {
        for (const [key, messages] of Object.entries(result.fieldErrors)) {
          if (messages[0]) setError(key as keyof SignInInput, { message: messages[0] })
        }
      }
      if (result.formError) setFormError(result.formError)
    }
  }

  const goNext = useCallback(() => {
    router.replace(nextPath)
    router.refresh()
  }, [router, nextPath])

  const handleSignedIn = useCallback(() => {
    if (isCompleteCode(code)) {
      setJoinError(null)
      previewMutation.mutate(
        { code },
        {
          onSuccess: (result) => setPreview(result),
          onError: () => goNext(),
        },
      )
      return
    }
    goNext()
  }, [code, previewMutation, goNext])

  const handleAccept = useCallback(() => {
    if (acceptMutation.isPending) return
    setJoinError(null)
    acceptMutation.mutate(
      { code },
      {
        onSuccess: (result) => {
          if (result.outcome === "accepted") {
            router.replace("/dashboard")
            router.refresh()
          } else {
            setJoinError(ACCEPT_MESSAGE[result.outcome] ?? "Không thể tham gia. Vui lòng thử lại.")
          }
        },
        onError: (err) => setJoinError(err.message),
      },
    )
  }, [acceptMutation, code, router])

  const handleSkip = useCallback(() => {
    setPreview(null)
    setCode("")
    router.replace("/dashboard")
    router.refresh()
  }, [router])

  if (preview) {
    return (
      <JoinConfirmCard
        preview={preview}
        accepting={acceptMutation.isPending}
        errorText={joinError}
        onAccept={handleAccept}
        onSkip={handleSkip}
      />
    )
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          ) : null}
        </div>

        {formError ? (
          <p className="text-sm text-destructive" role="alert">
            {formError}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>

      <div className="space-y-2">
        <Label htmlFor="coparent-code">Bạn có mã cùng nuôi?</Label>
        <InviteCodeInput id="coparent-code" value={code} onChange={setCode} />
        <p className="text-xs text-muted-foreground">
          Nhập mã rồi đăng nhập bằng Google để cùng nuôi Mochi.
        </p>
      </div>

      <GoogleSignInButton onSignedIn={handleSignedIn} />

      <p className="text-center text-xs leading-5 text-muted-foreground">
        Bằng việc tiếp tục, bạn đồng ý với{" "}
        <Link
          href="/terms"
          className="rounded underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Điều khoản dịch vụ
        </Link>{" "}
        và{" "}
        <Link
          href="/privacy"
          className="rounded underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Chính sách quyền riêng tư
        </Link>{" "}
        của MochiPet.
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link href="/signup" className="underline underline-offset-4">
          Đăng ký
        </Link>
      </p>
    </div>
  )
}
