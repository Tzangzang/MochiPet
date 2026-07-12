import type { HungerState } from "../types"

export type HungerPresentation = {
  label: string
  description: string
}

export const HUNGER_PRESENTATION: Record<HungerState, HungerPresentation> = {
  normal: { label: "No bụng", description: "Bé đang no và vui vẻ." },
  hungry: { label: "Bắt đầu đói", description: "Bé đang mong chờ một bữa ăn." },
  very_hungry: { label: "Rất đói", description: "Đã đến lúc cho bé ăn rồi." },
  weak: { label: "Mệt vì đói", description: "Bé cần được cho ăn sớm." },
  critical: { label: "Đang rất yếu", description: "Bé đang cần được chăm sóc ngay." },
  dead: { label: "Đã rời đi", description: "Bé không còn có thể tiếp tục hành trình." },
}

export const HUNGER_TONE: Record<HungerState, string> = {
  normal: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-100",
  hungry: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-100",
  very_hungry: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-100",
  weak: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-100",
  critical: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-100",
  dead: "bg-muted text-muted-foreground",
}

export function formatCountdown(remainingMs: number): string {
  const total = Math.max(0, Math.ceil(remainingMs / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const mm = String(minutes).padStart(2, "0")
  const ss = String(seconds).padStart(2, "0")
  if (hours >= 1) return `${String(hours).padStart(2, "0")}:${mm}:${ss}`
  return `${mm}:${ss}`
}

export function formatLastFed(lastFedAt: string, referenceIso: string): string {
  const fed = Date.parse(lastFedAt)
  const reference = Date.parse(referenceIso)
  if (Number.isNaN(fed) || Number.isNaN(reference)) return "chưa rõ"
  const diffMinutes = Math.floor(Math.max(0, reference - fed) / 60000)
  if (diffMinutes < 1) return "vừa xong"
  if (diffMinutes < 60) return `${diffMinutes} phút trước`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`
  return `${Math.floor(diffHours / 24)} ngày trước`
}
