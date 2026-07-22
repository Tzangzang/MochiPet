import type { CSSProperties } from "react"
import { PET_ANIMATION_CONFIG, anchorToOrigin } from "../animation/pet-animation-config"
import type { PetAnimationState, PetMotionProfile } from "../animation/types"
import type { PetVisualState } from "../types"
import { PetArtworkRenderer } from "./pet-artwork-renderer"
import { PetEyeExpression } from "./pet-eye-expression"
import { PetFx } from "./pet-fx"
import { PetShadow } from "./pet-shadow"

export function PetAnimatedStage({
  petId,
  variantImagePath,
  visual,
  state,
  sequence,
  profile,
}: {
  petId: string
  variantImagePath: string | null
  visual: PetVisualState
  state: PetAnimationState
  sequence: number
  profile: PetMotionProfile | null
}) {
  const config = PET_ANIMATION_CONFIG[state]
  const origin = profile ? anchorToOrigin(profile, config.transformOriginAnchor) : "50% 55%"
  const motionStyle = profile?.motionStyle ?? "quadruped"

  const bodyStyle: CSSProperties = {
    transformOrigin: origin,
    ["--pet-breathe" as string]: String(profile?.breathingScale ?? 1.02),
  }

  return (
    <div className="pet-stage">
      <PetShadow state={state} />
      <div className="pet-effects-behind" aria-hidden="true">
        {profile ? <PetFx layer="behind" config={config} profile={profile} /> : null}
      </div>
      <div
        key={sequence}
        className={`pet-body pet-anim-${state} pet-motion-${motionStyle}`}
        style={bodyStyle}
      >
        <PetArtworkRenderer petId={petId} variantImagePath={variantImagePath} state={visual} />
        <PetEyeExpression
          face={profile?.face ?? null}
          expression={config.eyeExpression}
          supportsBlink={profile?.supportsBlink ?? false}
          active={!!profile}
        />
        <div className="pet-effects-front" aria-hidden="true">
          {profile ? <PetFx layer="front" config={config} profile={profile} /> : null}
        </div>
      </div>
      <div className="pet-effects-ground" aria-hidden="true">
        {profile ? <PetFx layer="ground" config={config} profile={profile} /> : null}
      </div>
      <div key={`reaction-${sequence}`} className="pet-effects-reaction" aria-hidden="true">
        {profile ? <PetFx layer="reaction" config={config} profile={profile} /> : null}
      </div>
    </div>
  )
}
