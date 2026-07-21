import type { HungerState } from "../types"

export type BubbleTone = "neutral" | "success" | "info" | "error"

export const SPEECH = {
  tap: "Mochi đây!",
  petting: "Thích quá!",
  scratch: "Nhột quá!",
  feedHappy: "Ngon quá!",
  cooldown: "Mình vẫn đang no mà!",
} as const

const HUNGER_REQUEST: Record<HungerState, string | null> = {
  normal: null,
  hungry: "Mình bắt đầu đói rồi.",
  very_hungry: "Cho mình ăn nhé!",
  weak: "Mình cần một bữa ăn sớm.",
  critical: "Mình đang rất yếu…",
  dead: null,
}

export function hungerRequestText(state: HungerState): string | null {
  return HUNGER_REQUEST[state]
}

export const LIFECYCLE_SPEECH = {
  cleaned: "Dọn sạch rồi!",
  dirty: "Bẩn quá!",
  refusing: "Mình không muốn ăn…",
  sleeping: "Zzz…",
} as const

export function wastePosition(seed: number): { leftPct: number; bottomRem: number } {
  const safe = Number.isFinite(seed) ? Math.abs(Math.trunc(seed)) : 0
  const a = safe % 1000
  const b = Math.floor(safe / 1000) % 1000
  return {
    leftPct: 12 + (a / 999) * 74,
    bottomRem: 5.4 + (b / 999) * 1.6,
  }
}

export function formatSleepHours(seconds: number): string {
  const total = Math.max(0, Math.round(seconds / 60))
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return `${hours}g${String(minutes).padStart(2, "0")}`
}
