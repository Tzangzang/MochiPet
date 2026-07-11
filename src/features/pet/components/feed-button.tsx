"use client"

import { Button } from "@/components/ui/button"
import { formatCountdown } from "../lib/feed-presenter"

export function FeedButton({
  canFeed,
  pending,
  cooldownMs,
  onFeed,
}: {
  canFeed: boolean
  pending: boolean
  cooldownMs: number | null
  onFeed: () => void
}) {
  const inCooldown = cooldownMs !== null && cooldownMs > 0
  const disabled = pending || inCooldown || !canFeed

  let label = "Cho bé ăn"
  if (pending) label = "Đang chuẩn bị bữa ăn…"
  else if (inCooldown && cooldownMs !== null) label = `Có thể cho ăn sau ${formatCountdown(cooldownMs)}`
  else if (!canFeed) label = "Chưa thể cho ăn"

  return (
    <Button
      type="button"
      className="w-full"
      onClick={onFeed}
      disabled={disabled}
      aria-busy={pending}
    >
      {label}
    </Button>
  )
}
