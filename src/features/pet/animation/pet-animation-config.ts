import type {
  PetAnimationConfig,
  PetAnimationState,
  PetMotionProfile,
} from "./types"

export const PET_ANIMATION_CONFIG: Record<PetAnimationState, PetAnimationConfig> = {
  idle: {
    bodyAnimation: "idle",
    eyeExpression: "idle",
    transformOriginAnchor: "belly",
    tailIntensity: "soft",
    pawEffect: "none",
    motionLines: false,
    fx: [],
    transitionLocked: false,
    interaction: false,
  },
  petting: {
    bodyAnimation: "petting",
    eyeExpression: "happy",
    transformOriginAnchor: "feet",
    tailIntensity: "fast",
    pawEffect: "cue",
    motionLines: false,
    fx: ["sparkle"],
    transitionLocked: false,
    interaction: true,
  },
  scratch: {
    bodyAnimation: "scratch",
    eyeExpression: "happy",
    transformOriginAnchor: "feet",
    tailIntensity: "fast",
    pawEffect: "swipe",
    motionLines: true,
    fx: ["dust"],
    transitionLocked: false,
    interaction: true,
  },
  feeding: {
    bodyAnimation: "feeding",
    eyeExpression: "feeding",
    transformOriginAnchor: "feet",
    tailIntensity: "fast",
    pawEffect: "cue",
    motionLines: true,
    fx: ["sparkle", "food"],
    transitionLocked: false,
    interaction: true,
  },
  happy: {
    bodyAnimation: "happy",
    eyeExpression: "happy",
    transformOriginAnchor: "feet",
    tailIntensity: "fast",
    pawEffect: "step",
    motionLines: true,
    fx: ["sparkle"],
    transitionLocked: false,
    interaction: true,
  },
  loved: {
    bodyAnimation: "loved",
    eyeExpression: "loved",
    transformOriginAnchor: "belly",
    tailIntensity: "soft",
    pawEffect: "cue",
    motionLines: false,
    fx: ["heart"],
    transitionLocked: false,
    interaction: true,
  },
  sleeping: {
    bodyAnimation: "sleeping",
    eyeExpression: "sleeping",
    transformOriginAnchor: "belly",
    tailIntensity: "none",
    pawEffect: "none",
    motionLines: false,
    fx: ["zzz"],
    transitionLocked: false,
    interaction: false,
  },
  hungry: {
    bodyAnimation: "hungry",
    eyeExpression: "hungry",
    transformOriginAnchor: "belly",
    tailIntensity: "none",
    pawEffect: "none",
    motionLines: false,
    fx: [],
    transitionLocked: false,
    interaction: false,
  },
  weak: {
    bodyAnimation: "weak",
    eyeExpression: "weak",
    transformOriginAnchor: "belly",
    tailIntensity: "none",
    pawEffect: "none",
    motionLines: false,
    fx: [],
    transitionLocked: false,
    interaction: false,
  },
  dead: {
    bodyAnimation: "dead",
    eyeExpression: "dead",
    transformOriginAnchor: "belly",
    tailIntensity: "none",
    pawEffect: "none",
    motionLines: false,
    fx: [],
    transitionLocked: true,
    interaction: false,
  },
}

export function resolvePetAnimationState(input: {
  isDead: boolean
  isSleeping: boolean
  feeding: boolean
  loved: boolean
  scratch: boolean
  petting: boolean
  happy: boolean
  weak: boolean
  hungry: boolean
}): PetAnimationState {
  if (input.isDead) return "dead"
  if (input.isSleeping) return "sleeping"
  if (input.feeding) return "feeding"
  if (input.loved) return "loved"
  if (input.scratch) return "scratch"
  if (input.petting) return "petting"
  if (input.happy) return "happy"
  if (input.weak) return "weak"
  if (input.hungry) return "hungry"
  return "idle"
}

export function anchorToOrigin(
  profile: PetMotionProfile,
  anchor: PetAnimationConfig["transformOriginAnchor"],
): string {
  const point =
    anchor === "feet"
      ? profile.feet
      : anchor === "head"
        ? profile.head
        : anchor === "center"
          ? { x: 0.5, y: 0.5 }
          : profile.belly
  return `${(point.x * 100).toFixed(1)}% ${(point.y * 100).toFixed(1)}%`
}

export function pointToPercent(point: { x: number; y: number }): {
  left: string
  top: string
} {
  return { left: `${(point.x * 100).toFixed(1)}%`, top: `${(point.y * 100).toFixed(1)}%` }
}
