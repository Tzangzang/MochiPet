import { HUNGER_PRESENTATION, HUNGER_TONE, formatLastFed } from "../lib/feed-presenter"
import type { HungerState } from "../types"

export function HungerStatus({
  hungerState,
  lastFedAt,
  referenceIso,
  nextFeedLabel,
}: {
  hungerState: HungerState
  lastFedAt: string
  referenceIso: string
  nextFeedLabel: string | null
}) {
  const presentation = HUNGER_PRESENTATION[hungerState]
  return (
    <div className="space-y-1">
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${HUNGER_TONE[hungerState]}`}
      >
        {presentation.label}
      </span>
      <p className="text-sm text-muted-foreground">{presentation.description}</p>
      <p className="text-xs text-muted-foreground">
        Lần cho ăn gần nhất: {formatLastFed(lastFedAt, referenceIso)}
      </p>
      {nextFeedLabel ? (
        <p className="text-xs text-muted-foreground">{nextFeedLabel}</p>
      ) : null}
    </div>
  )
}
