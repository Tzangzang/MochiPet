"use client"

import { useCallback, useState } from "react"

import { ErrorNotice } from "./error-notice"
import { FeedButton } from "./feed-button"
import { HungerStatus } from "./hunger-status"
import { useFeedCooldown } from "../hooks/use-feed-cooldown"
import { useFeedPet } from "../hooks/use-feed-pet"
import { HUNGER_PRESENTATION } from "../lib/feed-presenter"
import type { CurrentPet, FeedOutcome } from "../types"

const OUTCOME_MESSAGE: Record<FeedOutcome, string> = {
  fed: "Bé đã ăn ngon lành!",
  cooldown: "Bé vừa được cho ăn, hãy đợi một chút nhé.",
  dead: "Bé không thể ăn được nữa.",
}

type Notice = { tone: "success" | "info"; text: string }

export function PetFeedPanel({
  pet,
  onFed,
}: {
  pet: CurrentPet
  onFed: () => void
}) {
  const feed = pet.feed
  const mutation = useFeedPet()
  const [notice, setNotice] = useState<Notice | null>(null)
  const [errorText, setErrorText] = useState<string | null>(null)

  const isDead = pet.status === "dead" || feed?.hunger_state === "dead"
  const cooldownMs = useFeedCooldown({
    active: !isDead && !!feed && !feed.can_feed,
    serverNow: feed?.server_now ?? null,
    nextFeedAt: feed?.next_feed_at ?? null,
  })

  const handleFeed = useCallback(() => {
    if (mutation.isPending || !feed || isDead) return
    setErrorText(null)
    setNotice(null)
    mutation.mutate(pet.id, {
      onSuccess: (result) => {
        const text = OUTCOME_MESSAGE[result.outcome] ?? "Đã cập nhật trạng thái của bé."
        if (result.outcome === "fed") {
          setNotice({ tone: "success", text })
          onFed()
        } else {
          setNotice({ tone: "info", text })
        }
      },
      onError: (error) => {
        setErrorText(error.message)
      },
    })
  }, [mutation, feed, isDead, pet.id, onFed])

  if (isDead) {
    const presentation = HUNGER_PRESENTATION.dead
    return (
      <section aria-label="Trạng thái chăm sóc của bé" className="space-y-3 rounded-2xl border p-4">
        <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
          {presentation.label}
        </span>
        <p className="text-sm text-muted-foreground">{presentation.description}</p>
        <p className="text-sm font-medium text-muted-foreground" aria-live="polite">
          Không thể cho ăn
        </p>
      </section>
    )
  }

  if (!feed) {
    return (
      <section aria-label="Trạng thái chăm sóc của bé" className="space-y-3 rounded-2xl border p-4">
        <p className="text-sm text-muted-foreground">Đang tải trạng thái của bé…</p>
      </section>
    )
  }

  return (
    <section aria-label="Trạng thái chăm sóc của bé" className="space-y-3 rounded-2xl border p-4">
      <HungerStatus
        hungerState={feed.hunger_state}
        lastFedAt={pet.last_fed_at}
        referenceIso={feed.server_now}
        nextFeedLabel={feed.can_feed ? "Bé đã sẵn sàng cho bữa tiếp theo." : "Đang nghỉ giữa các bữa ăn."}
      />
      <FeedButton
        canFeed={feed.can_feed}
        pending={mutation.isPending}
        cooldownMs={cooldownMs}
        onFeed={handleFeed}
      />
      <div aria-live="polite" className="min-h-5">
        {notice ? (
          <p
            className={
              notice.tone === "success"
                ? "text-sm font-medium text-emerald-600 dark:text-emerald-400"
                : "text-sm text-muted-foreground"
            }
          >
            {notice.text}
          </p>
        ) : null}
      </div>
      {errorText ? <ErrorNotice message={errorText} /> : null}
    </section>
  )
}
