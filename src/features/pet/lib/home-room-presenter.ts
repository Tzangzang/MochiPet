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
