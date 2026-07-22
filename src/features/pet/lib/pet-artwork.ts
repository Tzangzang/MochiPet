import { PET_ARTWORK_CATALOG, type PetArtwork } from "./pet-artwork-catalog"

function hashString(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function getPetArtwork(petId: string | null | undefined): PetArtwork | null {
  if (!petId || PET_ARTWORK_CATALOG.length === 0) return null
  const index = hashString(petId) % PET_ARTWORK_CATALOG.length
  return PET_ARTWORK_CATALOG[index] ?? null
}
