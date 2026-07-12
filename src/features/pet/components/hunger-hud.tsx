import { HUNGER_PRESENTATION, HUNGER_TONE, formatLastFed } from "../lib/feed-presenter"
import type { HungerState } from "../types"

export function HungerHud({
  hungerState,
  lastFedAt,
  referenceIso,
}: {
  hungerState: HungerState
  lastFedAt: string
  referenceIso: string
}) {
  const presentation = HUNGER_PRESENTATION[hungerState]
  return (
    <div className="home-room-hud home-room-hud-hunger">
      <span className={`home-room-hud-badge ${HUNGER_TONE[hungerState]}`}>
        {presentation.label}
      </span>
      <p className="home-room-hud-meta">Cho ăn: {formatLastFed(lastFedAt, referenceIso)}</p>
    </div>
  )
}
