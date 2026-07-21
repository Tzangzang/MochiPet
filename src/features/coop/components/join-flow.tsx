"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { usePreviewInvitation, useAcceptInvitation } from "../hooks"
import { ACCEPT_MESSAGE } from "../lib"
import { JoinConfirmCard } from "./join-confirm-card"
import type { InvitationPreview } from "../types"

export function JoinFlow({ token }: { token: string }) {
  const router = useRouter()
  const previewMutation = usePreviewInvitation()
  const acceptMutation = useAcceptInvitation()
  const [preview, setPreview] = useState<InvitationPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    previewMutation.mutate(
      { token },
      {
        onSuccess: (result) => setPreview(result),
        onError: (err) => setError(err.message),
      },
    )
  }, [token, previewMutation])

  const goDashboard = useCallback(() => {
    router.replace("/dashboard")
    router.refresh()
  }, [router])

  const handleAccept = useCallback(() => {
    if (acceptMutation.isPending) return
    setError(null)
    acceptMutation.mutate(
      { token },
      {
        onSuccess: (result) => {
          if (result.outcome === "accepted") {
            goDashboard()
          } else {
            setError(ACCEPT_MESSAGE[result.outcome] ?? "Không thể tham gia. Vui lòng thử lại.")
          }
        },
        onError: (err) => setError(err.message),
      },
    )
  }, [acceptMutation, token, goDashboard])

  if (error && !preview) {
    return (
      <div className="space-y-3 rounded-2xl border p-4">
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
        <Button type="button" variant="outline" className="w-full" onClick={goDashboard}>
          Về trang chính
        </Button>
      </div>
    )
  }

  if (!preview) {
    return (
      <div className="h-24 w-full animate-pulse rounded-2xl bg-muted" aria-hidden="true" />
    )
  }

  return (
    <JoinConfirmCard
      preview={preview}
      accepting={acceptMutation.isPending}
      errorText={error}
      onAccept={handleAccept}
      onSkip={goDashboard}
    />
  )
}
