import {
  HUNGER_PRESENTATION,
  HUNGER_TONE,
  formatCountdown,
  formatLastFed,
} from "../lib/feed-presenter"
import type { HungerState } from "../types"

export function HungerHud({
  hungerState,
  lastFedAt,
  referenceIso,
  cooldownMs,
}: {
  hungerState: HungerState
  lastFedAt: string
  referenceIso: string
  cooldownMs: number | null
}) {
  const presentation = HUNGER_PRESENTATION[hungerState]
  const inCooldown = cooldownMs !== null && cooldownMs > 0
  return (
    <div className="home-room-hud home-room-hud-hunger">
      <span className={`home-room-hud-badge ${HUNGER_TONE[hungerState]}`}>
        {presentation.label}
      </span>
      <p className="home-room-hud-meta">Cho ăn: {formatLastFed(lastFedAt, referenceIso)}</p>
      {inCooldown && cooldownMs !== null ? (
        <p className="home-room-hud-meta">Ăn sau {formatCountdown(cooldownMs)}</p>
      ) : null}
    </div>
  )
}
