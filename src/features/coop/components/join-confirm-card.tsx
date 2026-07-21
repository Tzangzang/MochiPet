"use client"

import { Button } from "@/components/ui/button"
import { formatExpiry, PREVIEW_MESSAGE } from "../lib"
import type { InvitationPreview } from "../types"

export function JoinConfirmCard({
  preview,
  accepting,
  errorText,
  onAccept,
  onSkip,
}: {
  preview: InvitationPreview
  accepting: boolean
  errorText: string | null
  onAccept: () => void
  onSkip: () => void
}) {
  if (preview.status !== "valid") {
    return (
      <div className="space-y-3 rounded-2xl border p-4">
        <p className="text-sm text-muted-foreground" role="alert">
          {PREVIEW_MESSAGE[preview.status] ?? "Lời mời không khả dụng."}
        </p>
        <Button type="button" variant="outline" className="w-full" onClick={onSkip}>
          Đóng
        </Button>
      </div>
    )
  }

  const alreadyIn = preview.viewer_is_caregiver === true
  const petFull = preview.pet_has_co_parent === true && !alreadyIn
  const blockedText = alreadyIn
    ? "Bạn đã là người chăm sóc bé này."
    : petFull
      ? "Bé đã có đủ người cùng nuôi."
      : preview.viewer_is_owner
        ? "Bạn là chủ nuôi của bé này."
        : null

  return (
    <div className="space-y-3 rounded-2xl border p-4">
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">
          Cùng nuôi {preview.pet_name ?? "Mochi"}
        </p>
        {preview.owner_display_name ? (
          <p className="text-sm text-muted-foreground">
            Lời mời từ {preview.owner_display_name}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">Lời mời {formatExpiry(preview.expires_at)}</p>
      </div>

      {blockedText ? (
        <p className="text-sm text-muted-foreground" role="alert">
          {blockedText}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          className="w-full"
          onClick={onAccept}
          disabled={accepting || Boolean(blockedText)}
          aria-busy={accepting}
        >
          {accepting ? "Đang tham gia…" : `Cùng nuôi ${preview.pet_name ?? "Mochi"}`}
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={onSkip} disabled={accepting}>
          Bỏ qua
        </Button>
      </div>

      {errorText ? (
        <p className="text-sm text-destructive" role="alert">
          {errorText}
        </p>
      ) : null}
    </div>
  )
}
