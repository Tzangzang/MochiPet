import type { PetAnimationState } from "../animation/types"

export function PetShadow({ state }: { state: PetAnimationState }) {
  return (
    <span
      className={`pet-shadow pet-shadow-${state}`}
      aria-hidden="true"
    />
  )
}
