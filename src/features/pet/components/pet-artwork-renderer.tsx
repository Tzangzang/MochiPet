"use client"

import Image from "next/image"
import { useState } from "react"

import { MochiArtwork } from "./mochi-artwork"
import { getPetArtwork } from "../lib/pet-artwork"
import type { PetVisualState } from "../types"

const CATALOG_PREFIX = "/pets/catalog/"

export function PetArtworkRenderer({
  petId,
  variantImagePath,
  state,
}: {
  petId: string | null
  variantImagePath: string | null
  state: PetVisualState
}) {
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set())

  const candidates: string[] = []
  if (variantImagePath && variantImagePath.startsWith(CATALOG_PREFIX)) {
    candidates.push(variantImagePath)
  }
  const deterministic = getPetArtwork(petId)
  if (deterministic) candidates.push(deterministic.src)

  const active = candidates.find((src) => !failed.has(src)) ?? null

  if (!active) {
    return <MochiArtwork state={state} />
  }

  const className =
    state === "dead"
      ? "home-room-pet-artwork home-room-artwork-dead"
      : "home-room-pet-artwork"

  return (
    <div className={className}>
      <Image
        key={active}
        src={active}
        alt=""
        fill
        sizes="(max-width: 640px) 220px, 280px"
        draggable={false}
        onError={() => setFailed((prev) => new Set(prev).add(active))}
        className="select-none object-contain"
      />
    </div>
  )
}
