"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"

import { usePetGesture } from "../hooks/use-pet-gesture"
import { useFeedPet } from "../hooks/use-feed-pet"
import { useFeedCooldown } from "../hooks/use-feed-cooldown"
import { useCleanWaste } from "../hooks/use-clean-waste"
import { usePetSleep } from "../hooks/use-pet-sleep"
import { INITIAL_PET_LEVEL } from "../lib/constants"
import { formatCountdown } from "../lib/feed-presenter"
import { SPEECH, LIFECYCLE_SPEECH, hungerRequestText } from "../lib/home-room-presenter"
import type { BubbleTone } from "../lib/home-room-presenter"
import { PetArtworkRenderer } from "./pet-artwork-renderer"
import { RoomScene } from "./room-scene"
import { PetHud } from "./pet-hud"
import { HungerHud } from "./hunger-hud"
import { SpeechBubble } from "./speech-bubble"
import { ActionDock } from "./action-dock"
import type { ActionTile } from "./action-dock"
import { WasteItem } from "./waste-item"
import type { CurrentPet, HungerState, PetVisualState } from "../types"

const SCRATCH_MS = 900
const TAP_MS = 700
const PET_MS = 900
const FEED_MS = 1500
const BUBBLE_MS = 1900

function roleLabel(role: string): string {
  return role === "owner" ? "Chủ nuôi" : "Đồng nuôi"
}

function FeedIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 11 h16 a8 8 0 0 1 -16 0 Z" />
      <path d="M12 11 V4 M9 6 c0 2 6 2 6 0" />
    </svg>
  )
}

function PetIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M12 20 C7 16 4 13 4 9.5 A3.5 3.5 0 0 1 12 7 A3.5 3.5 0 0 1 20 9.5 C20 13 17 16 12 20 Z" />
    </svg>
  )
}

function SleepIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 14 A8 8 0 1 1 10 4 A6.5 6.5 0 0 0 20 14 Z" />
    </svg>
  )
}

function SchoolIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M3 8 L12 4 L21 8 L12 12 Z" />
      <path d="M7 10 V15 C7 16 17 16 17 15 V10" />
    </svg>
  )
}

function resolveVisual(state: {
  isDead: boolean
  isSleeping: boolean
  hunger: HungerState
  feedPending: boolean
  feedHappy: boolean
  scratch: boolean
  petted: boolean
  tap: boolean
  hover: boolean
}): PetVisualState {
  if (state.isDead) return "dead"
  if (state.isSleeping) return "normal"
  if (state.hunger === "critical") return "critical"
  if (state.feedPending) return "normal"
  if (state.feedHappy) return "scratch_happy"
  if (state.scratch) return "scratch_happy"
  if (state.petted) return "hover_happy"
  if (state.tap) return "hover_happy"
  if (state.hover) return "hover_happy"
  if (state.hunger === "weak") return "weak"
  if (state.hunger === "hungry" || state.hunger === "very_hungry") return state.hunger
  return "normal"
}

export function HomeRoom({ pet }: { pet: CurrentPet }) {
  const feed = pet.feed
  const lifecycle = pet.lifecycle
  const isDead = pet.status === "dead" || feed?.hunger_state === "dead"
  const isSleeping = lifecycle?.is_sleeping ?? false
  const isRefusing = lifecycle?.is_refusing_food ?? false
  const interactive = !isDead
  const canInteract = interactive && !isSleeping

  const [hover, setHover] = useState(false)
  const [scratch, setScratch] = useState(false)
  const [tap, setTap] = useState(false)
  const [petted, setPetted] = useState(false)
  const [feedHappy, setFeedHappy] = useState(false)
  const [bubble, setBubble] = useState<{ text: string; tone: BubbleTone } | null>(null)
  const [cleaningId, setCleaningId] = useState<string | null>(null)

  const scratchTimer = useRef<number | null>(null)
  const tapTimer = useRef<number | null>(null)
  const petTimer = useRef<number | null>(null)
  const feedTimer = useRef<number | null>(null)
  const bubbleTimer = useRef<number | null>(null)
  const didScratchRef = useRef(false)

  const mutation = useFeedPet()
  const cleanMutation = useCleanWaste()
  const sleepMutation = usePetSleep()

  const cooldownMs = useFeedCooldown({
    active: interactive && !!feed && !feed.can_feed,
    serverNow: feed?.server_now ?? null,
    nextFeedAt: feed?.next_feed_at ?? null,
  })

  const showBubble = useCallback((text: string, tone: BubbleTone) => {
    setBubble({ text, tone })
    if (bubbleTimer.current) window.clearTimeout(bubbleTimer.current)
    bubbleTimer.current = window.setTimeout(() => setBubble(null), BUBBLE_MS)
  }, [])

  const activateScratch = useCallback(() => {
    if (!canInteract) return
    didScratchRef.current = true
    setScratch(true)
    if (scratchTimer.current) window.clearTimeout(scratchTimer.current)
    scratchTimer.current = window.setTimeout(() => setScratch(false), SCRATCH_MS)
    showBubble(SPEECH.scratch, "neutral")
  }, [canInteract, showBubble])

  const handleTap = useCallback(() => {
    if (!canInteract || didScratchRef.current) return
    setTap(true)
    if (tapTimer.current) window.clearTimeout(tapTimer.current)
    tapTimer.current = window.setTimeout(() => setTap(false), TAP_MS)
    showBubble(SPEECH.tap, "neutral")
  }, [canInteract, showBubble])

  const handlePet = useCallback(() => {
    if (!canInteract) return
    setPetted(true)
    if (petTimer.current) window.clearTimeout(petTimer.current)
    petTimer.current = window.setTimeout(() => setPetted(false), PET_MS)
    showBubble(SPEECH.petting, "neutral")
  }, [canInteract, showBubble])

  const triggerFeedHappy = useCallback(() => {
    setFeedHappy(true)
    if (feedTimer.current) window.clearTimeout(feedTimer.current)
    feedTimer.current = window.setTimeout(() => setFeedHappy(false), FEED_MS)
  }, [])

  const handleFeed = useCallback(() => {
    if (mutation.isPending || !feed || isDead || isSleeping) return
    mutation.mutate(pet.id, {
      onSuccess: (result) => {
        if (result.outcome === "fed") {
          triggerFeedHappy()
          showBubble(SPEECH.feedHappy, "success")
        } else if (result.outcome === "cooldown") {
          showBubble(SPEECH.cooldown, "info")
        } else if (result.outcome === "refusing_food") {
          showBubble(LIFECYCLE_SPEECH.refusing, "info")
        } else if (result.outcome === "needs_timezone") {
          showBubble("Đang chuẩn bị phòng, thử lại chút nữa nhé.", "info")
        }
      },
      onError: (error) => {
        showBubble(error.message, "error")
      },
    })
  }, [mutation, feed, isDead, isSleeping, pet.id, triggerFeedHappy, showBubble])

  const handleClean = useCallback(
    (wasteId: string) => {
      if (cleanMutation.isPending || isDead) return
      setCleaningId(wasteId)
      cleanMutation.mutate(
        { petId: pet.id, wasteId },
        {
          onSuccess: (result) => {
            if (result.outcome === "cleaned") showBubble(LIFECYCLE_SPEECH.cleaned, "success")
          },
          onError: (error) => {
            showBubble(error.message, "error")
          },
          onSettled: () => setCleaningId(null),
        },
      )
    },
    [cleanMutation, isDead, pet.id, showBubble],
  )

  const handleSleepToggle = useCallback(() => {
    if (sleepMutation.isPending || isDead) return
    sleepMutation.mutate(
      { petId: pet.id, action: isSleeping ? "wake" : "start" },
      {
        onError: (error) => showBubble(error.message, "error"),
      },
    )
  }, [sleepMutation, isDead, isSleeping, pet.id, showBubble])

  useEffect(() => {
    return () => {
      if (scratchTimer.current) window.clearTimeout(scratchTimer.current)
      if (tapTimer.current) window.clearTimeout(tapTimer.current)
      if (petTimer.current) window.clearTimeout(petTimer.current)
      if (feedTimer.current) window.clearTimeout(feedTimer.current)
      if (bubbleTimer.current) window.clearTimeout(bubbleTimer.current)
    }
  }, [])

  const gesture = usePetGesture(activateScratch, canInteract)

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    didScratchRef.current = false
    gesture.onPointerDown(event)
  }
  const handleClick = () => {
    if (didScratchRef.current) return
    handleTap()
  }
  const handlePointerEnter = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" && canInteract) setHover(true)
  }
  const handlePointerLeave = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse") setHover(false)
  }

  const interactionProps = canInteract
    ? {
        ...gesture,
        onPointerDown: handlePointerDown,
        onClick: handleClick,
        onPointerEnter: handlePointerEnter,
        onPointerLeave: handlePointerLeave,
      }
    : {}

  const feedPending = mutation.isPending
  const hunger: HungerState = feed?.hunger_state ?? "normal"
  const visual = resolveVisual({ isDead, isSleeping, hunger, feedPending, feedHappy, scratch, petted, tap, hover })
  const pop = canInteract && (tap || petted || feedHappy)

  const speciesName = pet.species?.display_name ?? "Mochi"
  const petLabel = `${pet.name}, ${speciesName}, cấp ${INITIAL_PET_LEVEL}`

  let bubbleText: string | null = bubble?.text ?? null
  let bubbleTone: BubbleTone = bubble?.tone ?? "neutral"
  if (!bubble) {
    if (isDead) {
      bubbleText = null
    } else if (isSleeping) {
      bubbleText = LIFECYCLE_SPEECH.sleeping
      bubbleTone = "neutral"
    } else if (isRefusing) {
      bubbleText = LIFECYCLE_SPEECH.refusing
      bubbleTone = "info"
    } else {
      const request = hungerRequestText(hunger)
      if (request) bubbleText = request
    }
  }

  const feedInCooldown = cooldownMs !== null && cooldownMs > 0
  let feedLabel = "Cho ăn"
  if (feedPending) feedLabel = "Đang cho ăn…"
  else if (feedInCooldown && cooldownMs !== null) feedLabel = `Ăn sau ${formatCountdown(cooldownMs)}`

  const actions: ActionTile[] = [
    {
      id: "feed",
      label: feedLabel,
      accessibleLabel: "Cho bé ăn",
      icon: <FeedIcon />,
      disabled: isDead || isSleeping || feedPending || !feed || !feed.can_feed,
      pending: feedPending,
      badge: null,
      onAction: handleFeed,
    },
    {
      id: "pet",
      label: "Vuốt ve",
      accessibleLabel: "Vuốt ve bé",
      icon: <PetIcon />,
      disabled: !canInteract,
      pending: false,
      badge: null,
      onAction: handlePet,
    },
    {
      id: "sleep",
      label: sleepMutation.isPending ? "Đang xử lý…" : isSleeping ? "Đánh thức" : "Đi ngủ",
      accessibleLabel: isSleeping ? "Đánh thức bé" : "Cho bé đi ngủ",
      icon: <SleepIcon />,
      disabled: isDead || sleepMutation.isPending,
      pending: sleepMutation.isPending,
      badge: null,
      onAction: handleSleepToggle,
    },
    {
      id: "school",
      label: "Đi học",
      accessibleLabel: "Đi học, sắp mở",
      icon: <SchoolIcon />,
      disabled: true,
      pending: false,
      badge: "Sắp mở",
    },
  ]

  const wasteList = isDead ? [] : lifecycle?.waste ?? []

  return (
    <RoomScene dimmed={!interactive} label={`Phòng của ${pet.name}`}>
      <PetHud
        name={pet.name}
        species={speciesName}
        level={INITIAL_PET_LEVEL}
        role={roleLabel(pet.caregiver_role)}
        mealCount={lifecycle ? lifecycle.meal_count_today : null}
        mealsRequired={lifecycle ? lifecycle.meals_required : null}
        health={lifecycle ? lifecycle.health : null}
        hygiene={lifecycle ? lifecycle.hygiene : null}
      />
      <HungerHud
        hungerState={hunger}
        lastFedAt={pet.last_fed_at}
        referenceIso={feed?.server_now ?? pet.last_fed_at}
      />
      <div className="home-room-waste-layer">
        {wasteList.map((waste) => (
          <WasteItem
            key={waste.id}
            waste={waste}
            disabled={cleanMutation.isPending}
            pending={cleaningId === waste.id}
            onClean={handleClean}
          />
        ))}
      </div>
      <div className="home-room-stage">
        <SpeechBubble text={bubbleText} tone={bubbleTone} />
        <div
          className={pop ? "home-room-pet home-room-pet-pop" : "home-room-pet"}
          role="img"
          aria-label={petLabel}
          {...interactionProps}
        >
          <PetArtworkRenderer petId={pet.id} variantImagePath={pet.variant?.image_path ?? null} state={visual} />
        </div>
      </div>
      {canInteract ? (
        <p className="home-room-hint">Vuốt ngang trên bé để chơi</p>
      ) : null}
      <ActionDock actions={actions} />
    </RoomScene>
  )
}
