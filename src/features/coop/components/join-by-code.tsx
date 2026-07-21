"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { usePreviewInvitation, useAcceptInvitation } from "../hooks"
import { ACCEPT_MESSAGE, isCompleteCode } from "../lib"
import { InviteCodeInput } from "./invite-code-input"
import { JoinConfirmCard } from "./join-confirm-card"
import type { InvitationPreview } from "../types"

export function JoinByCode() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [preview, setPreview] = useState<InvitationPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const previewMutation = usePreviewInvitation()
  const acceptMutation = useAcceptInvitation()

  const handleCheck = useCallback(() => {
    if (!isCompleteCode(code) || previewMutation.isPending) return
    setError(null)
    previewMutation.mutate(
      { code },
      {
        onSuccess: (result) => setPreview(result),
        onError: (err) => setError(err.message),
      },
    )
  }, [code, previewMutation])

  const handleAccept = useCallback(() => {
    if (acceptMutation.isPending) return
    setError(null)
    acceptMutation.mutate(
      { code },
      {
        onSuccess: (result) => {
          if (result.outcome === "accepted") {
            router.replace("/dashboard")
            router.refresh()
          } else {
            setError(ACCEPT_MESSAGE[result.outcome] ?? "Không thể tham gia. Vui lòng thử lại.")
          }
        },
        onError: (err) => setError(err.message),
      },
    )
  }, [acceptMutation, code, router])

  const handleSkip = useCallback(() => {
    setPreview(null)
    setCode("")
    setError(null)
  }, [])

  if (preview) {
    return (
      <JoinConfirmCard
        preview={preview}
        accepting={acceptMutation.isPending}
        errorText={error}
        onAccept={handleAccept}
        onSkip={handleSkip}
      />
    )
  }

  return (
    <div className="space-y-3">
      <label htmlFor="join-code" className="text-sm font-medium text-foreground">
        Nhập mã cùng nuôi
      </label>
      <InviteCodeInput id="join-code" value={code} onChange={setCode} disabled={previewMutation.isPending} />
      <Button
        type="button"
        className="w-full"
        onClick={handleCheck}
        disabled={!isCompleteCode(code) || previewMutation.isPending}
        aria-busy={previewMutation.isPending}
      >
        {previewMutation.isPending ? "Đang kiểm tra…" : "Kiểm tra mã"}
      </Button>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
