"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { usePetGesture } from "../hooks/use-pet-gesture"
import { INITIAL_PET_LEVEL } from "../lib/constants"
import { MochiArtwork } from "./mochi-artwork"
import { PetFeedPanel } from "./pet-feed-panel"
import type { CurrentPet, PetVisualState } from "../types"

const SCRATCH_DURATION_MS = 900
const CELEBRATE_DURATION_MS = 1500

function roleLabel(role: string): string {
  return role === "owner" ? "Chủ nuôi" : "Đồng nuôi"
}

export function PetView({ pet }: { pet: CurrentPet }) {
  const businessState: PetVisualState = pet.status === "dead" ? "dead" : "normal"
  const interactive = businessState !== "dead"
  const [hover, setHover] = useState(false)
  const [scratch, setScratch] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const scratchTimer = useRef<number | null>(null)
  const celebrateTimer = useRef<number | null>(null)

  const triggerScratch = useCallback(() => {
    if (!interactive) return
    setScratch(true)
    if (scratchTimer.current) window.clearTimeout(scratchTimer.current)
    scratchTimer.current = window.setTimeout(() => setScratch(false), SCRATCH_DURATION_MS)
  }, [interactive])

  const handleFed = useCallback(() => {
    if (!interactive) return
    setCelebrate(true)
    if (celebrateTimer.current) window.clearTimeout(celebrateTimer.current)
    celebrateTimer.current = window.setTimeout(() => setCelebrate(false), CELEBRATE_DURATION_MS)
  }, [interactive])

  useEffect(() => {
    return () => {
      if (scratchTimer.current) window.clearTimeout(scratchTimer.current)
      if (celebrateTimer.current) window.clearTimeout(celebrateTimer.current)
    }
  }, [])

  const gesture = usePetGesture(triggerScratch, interactive)

  let visual: PetVisualState = businessState
  if (interactive) {
    if (scratch || celebrate) visual = "scratch_happy"
    else if (hover) visual = "hover_happy"
  }

  const speciesName = pet.species?.display_name ?? "Mochi"
  const petLabel = `${pet.name}, ${speciesName}, cấp ${INITIAL_PET_LEVEL}`

  const handlePointerEnter = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" && interactive) setHover(true)
  }
  const handlePointerLeave = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse") setHover(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{pet.name}</CardTitle>
        <CardDescription>
          {speciesName} · Cấp {INITIAL_PET_LEVEL} · {roleLabel(pet.caregiver_role)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="relative mx-auto flex max-w-xs touch-pan-y select-none items-center justify-center"
          role="img"
          aria-label={petLabel}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          {...(interactive ? gesture : {})}
        >
          <MochiArtwork state={visual} />
          {celebrate ? (
            <span
              aria-hidden="true"
              className="mochi-feed-pop pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
            >
              Ngon quá!
            </span>
          ) : null}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          {interactive
            ? "Di chuột hoặc nhấn giữ và vuốt ngang qua lại để chơi cùng Mochi."
            : "Mochi đang rất mệt và cần được chăm sóc."}
        </p>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={triggerScratch}
          disabled={!interactive}
        >
          Vuốt ve Mochi
        </Button>
        <PetFeedPanel pet={pet} onFed={handleFed} />
      </CardContent>
    </Card>
  )
}
