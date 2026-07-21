"use client"

import { useRef } from "react"
import type { KeyboardEvent as ReactKeyboardEvent } from "react"

import { wastePosition } from "../lib/home-room-presenter"
import type { WasteEntity } from "../types"

const DOUBLE_MS = 350

export function WasteItem({
  waste,
  disabled,
  pending,
  onClean,
}: {
  waste: WasteEntity
  disabled: boolean
  pending: boolean
  onClean: (id: string) => void
}) {
  const lastTap = useRef(0)
  const pos = wastePosition(waste.pos_seed)

  const trigger = () => {
    if (!disabled) onClean(waste.id)
  }
  const handlePointerUp = () => {
    const now = Date.now()
    if (now - lastTap.current < DOUBLE_MS) {
      lastTap.current = 0
      trigger()
    } else {
      lastTap.current = now
    }
  }
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      trigger()
    }
  }

  return (
    <button
      type="button"
      className="home-room-waste"
      style={{ left: `${pos.leftPct}%`, bottom: `${pos.bottomRem}rem` }}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-busy={pending}
      aria-label="Dọn chất thải, nhấn đúp hoặc Enter"
    >
      <svg viewBox="0 0 32 24" className="home-room-waste-svg" aria-hidden="true" focusable="false">
        <ellipse cx="16" cy="21" rx="12" ry="3" className="home-room-waste-shadow" />
        <path d="M6 18 q-2 -7 6 -8 q1 -6 6 -4 q6 -1 6 5 q4 1 2 7 z" className="home-room-waste-body" />
        <circle cx="12" cy="13" r="1.4" className="home-room-waste-dot" />
        <circle cx="19" cy="15" r="1.4" className="home-room-waste-dot" />
      </svg>
    </button>
  )
}
