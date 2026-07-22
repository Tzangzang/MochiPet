"use client"

import Image from "next/image"
import { useState } from "react"

import { MochiArtwork } from "./mochi-artwork"
import { getPetArtwork } from "../lib/pet-artwork"
import type { PetVisualState } from "../types"

export function PetArtworkRenderer({
  petId,
  state,
}: {
  petId: string | null
  state: PetVisualState
}) {
  const artwork = getPetArtwork(petId)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const failed = artwork !== null && failedSrc === artwork.src

  if (!artwork || failed) {
    return <MochiArtwork state={state} />
  }

  const className =
    state === "dead"
      ? "home-room-pet-artwork home-room-artwork-dead"
      : "home-room-pet-artwork"

  return (
    <div className={className}>
      <Image
        src={artwork.src}
        alt=""
        fill
        sizes="(max-width: 640px) 220px, 280px"
        draggable={false}
        onError={() => setFailedSrc(artwork.src)}
        className="select-none object-contain"
      />
    </div>
  )
}
