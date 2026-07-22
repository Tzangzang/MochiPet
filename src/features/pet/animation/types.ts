export type PetAnimationState =
  | "idle"
  | "petting"
  | "scratch"
  | "feeding"
  | "happy"
  | "loved"
  | "sleeping"
  | "hungry"
  | "weak"
  | "dead"

export type PetEyeExpressionState =
  | "none"
  | "idle"
  | "blink"
  | "happy"
  | "loved"
  | "feeding"
  | "sleeping"
  | "hungry"
  | "weak"
  | "dead"

export type PetFxKind = "sparkle" | "heart" | "dust" | "zzz" | "food"

export type PetAnimationConfig = {
  bodyAnimation: string
  eyeExpression: PetEyeExpressionState
  transformOriginAnchor: "belly" | "feet" | "head" | "center"
  tailIntensity: "none" | "soft" | "fast"
  pawEffect: "none" | "cue" | "swipe" | "step"
  motionLines: boolean
  fx: PetFxKind[]
  transitionLocked: boolean
  interaction: boolean
}

export type PetAnchorPoint = {
  x: number
  y: number
}

export type PetFaceAnchor = {
  center: PetAnchorPoint
  width: number
  rotation: number
}

export type PetTailAnchor = {
  base: PetAnchorPoint
  direction: "left" | "right" | "up" | "down"
  length: number
  rotation: number
}

export type PetMotionStyle =
  | "quadruped"
  | "biped"
  | "floating"
  | "aquatic"
  | "winged"
  | "plant"
  | "round"

export type PetMotionProfile = {
  code: string
  motionStyle: PetMotionStyle
  head: PetAnchorPoint
  belly: PetAnchorPoint
  feet: PetAnchorPoint
  face: PetFaceAnchor | null
  frontLeft: PetAnchorPoint | null
  frontRight: PetAnchorPoint | null
  backLeft: PetAnchorPoint | null
  backRight: PetAnchorPoint | null
  tail: PetTailAnchor | null
  supportsBlink: boolean
  supportsPawCue: boolean
  supportsTailCue: boolean
  supportsGroundDust: boolean
  supportsFloatingMotion: boolean
  supportsAquaticMotion: boolean
  supportsPlantSway: boolean
  baselineFlip: boolean
  breathingScale: number
}
