import { pointToPercent } from "../animation/pet-animation-config"
import type {
  PetAnimationConfig,
  PetFxKind,
  PetMotionProfile,
} from "../animation/types"

type FxLayer = "behind" | "front" | "ground" | "reaction"

const SPARKLE_OFFSETS = [
  { dx: -0.14, dy: -0.1 },
  { dx: 0.14, dy: -0.14 },
  { dx: 0.0, dy: -0.22 },
  { dx: -0.06, dy: -0.02 },
  { dx: 0.09, dy: -0.05 },
]

const HEART_OFFSETS = [
  { dx: -0.1, dy: -0.12 },
  { dx: 0.12, dy: -0.16 },
  { dx: 0.02, dy: -0.24 },
]

const FOOD_OFFSETS = [
  { dx: -0.08, dy: 0.02 },
  { dx: 0.08, dy: 0.0 },
  { dx: 0.0, dy: 0.06 },
]

const ZZZ_OFFSETS = [
  { dx: 0.07, dy: -0.01 },
  { dx: 0.13, dy: -0.08 },
  { dx: 0.19, dy: -0.15 },
]

function particleStyle(
  origin: { x: number; y: number },
  offset: { dx: number; dy: number },
  index: number,
) {
  const pos = pointToPercent({ x: origin.x + offset.dx, y: origin.y + offset.dy })
  return {
    left: pos.left,
    top: pos.top,
    animationDelay: `${index * 90}ms`,
  }
}

function ParticleGroup({
  kind,
  origin,
  offsets,
}: {
  kind: PetFxKind
  origin: { x: number; y: number }
  offsets: ReadonlyArray<{ dx: number; dy: number }>
}) {
  return (
    <>
      {offsets.map((offset, index) => (
        <span
          key={`${kind}-${index}`}
          className={`pet-particle pet-particle-${kind}`}
          style={particleStyle(origin, offset, index)}
        >
          {kind === "zzz" ? "z" : null}
        </span>
      ))}
    </>
  )
}

export function PetFx({
  layer,
  config,
  profile,
}: {
  layer: FxLayer
  config: PetAnimationConfig
  profile: PetMotionProfile
}) {
  if (layer === "behind") {
    if (config.tailIntensity === "none" || !profile.supportsTailCue || !profile.tail) return null
    const pos = pointToPercent(profile.tail.base)
    return (
      <span
        className={`pet-tail-cue pet-tail-${config.tailIntensity} pet-tail-${profile.tail.direction}`}
        style={{ left: pos.left, top: pos.top }}
        aria-hidden="true"
      />
    )
  }

  if (layer === "front") {
    const showPaw = config.pawEffect !== "none" && profile.supportsPawCue
    const showLines = config.motionLines
    if (!showPaw && !showLines) return null
    const front = profile.frontRight ?? profile.frontLeft ?? profile.belly
    const frontPos = pointToPercent(front)
    return (
      <div className="pet-front-fx" aria-hidden="true">
        {showPaw ? (
          <span
            className={`pet-paw pet-paw-${config.pawEffect}`}
            style={{ left: frontPos.left, top: frontPos.top }}
          />
        ) : null}
        {showLines ? (
          <span className="pet-motion-lines" style={{ left: frontPos.left, top: frontPos.top }}>
            <span className="pet-motion-line" />
            <span className="pet-motion-line" />
            <span className="pet-motion-line" />
          </span>
        ) : null}
      </div>
    )
  }

  if (layer === "ground") {
    if (!config.fx.includes("dust") || !profile.supportsGroundDust) return null
    const pos = pointToPercent(profile.feet)
    return (
      <span className="pet-dust" style={{ left: pos.left, top: pos.top }} aria-hidden="true">
        <span className="pet-dust-puff" />
        <span className="pet-dust-puff" />
        <span className="pet-dust-puff" />
      </span>
    )
  }

  const head = profile.head
  return (
    <div className="pet-reaction-fx" aria-hidden="true">
      {config.fx.includes("sparkle") ? (
        <ParticleGroup kind="sparkle" origin={head} offsets={SPARKLE_OFFSETS} />
      ) : null}
      {config.fx.includes("heart") ? (
        <ParticleGroup kind="heart" origin={head} offsets={HEART_OFFSETS} />
      ) : null}
      {config.fx.includes("food") ? (
        <ParticleGroup kind="food" origin={profile.belly} offsets={FOOD_OFFSETS} />
      ) : null}
      {config.fx.includes("zzz") ? (
        <ParticleGroup kind="zzz" origin={head} offsets={ZZZ_OFFSETS} />
      ) : null}
    </div>
  )
}
