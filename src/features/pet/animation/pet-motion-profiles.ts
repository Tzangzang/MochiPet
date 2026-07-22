import type {
  PetAnchorPoint,
  PetFaceAnchor,
  PetMotionProfile,
  PetMotionStyle,
  PetTailAnchor,
} from "./types"

type StyleDefaults = Pick<
  PetMotionProfile,
  | "supportsBlink"
  | "supportsPawCue"
  | "supportsTailCue"
  | "supportsGroundDust"
  | "supportsFloatingMotion"
  | "supportsAquaticMotion"
  | "supportsPlantSway"
  | "baselineFlip"
  | "breathingScale"
>

const STYLE_DEFAULTS: Record<PetMotionStyle, StyleDefaults> = {
  quadruped: {
    supportsBlink: true,
    supportsPawCue: true,
    supportsTailCue: true,
    supportsGroundDust: true,
    supportsFloatingMotion: false,
    supportsAquaticMotion: false,
    supportsPlantSway: false,
    baselineFlip: false,
    breathingScale: 1.02,
  },
  biped: {
    supportsBlink: true,
    supportsPawCue: true,
    supportsTailCue: false,
    supportsGroundDust: true,
    supportsFloatingMotion: false,
    supportsAquaticMotion: false,
    supportsPlantSway: false,
    baselineFlip: false,
    breathingScale: 1.022,
  },
  round: {
    supportsBlink: true,
    supportsPawCue: false,
    supportsTailCue: false,
    supportsGroundDust: true,
    supportsFloatingMotion: false,
    supportsAquaticMotion: false,
    supportsPlantSway: false,
    baselineFlip: false,
    breathingScale: 1.035,
  },
  aquatic: {
    supportsBlink: true,
    supportsPawCue: false,
    supportsTailCue: true,
    supportsGroundDust: false,
    supportsFloatingMotion: false,
    supportsAquaticMotion: true,
    supportsPlantSway: false,
    baselineFlip: false,
    breathingScale: 1.02,
  },
  floating: {
    supportsBlink: true,
    supportsPawCue: false,
    supportsTailCue: false,
    supportsGroundDust: false,
    supportsFloatingMotion: true,
    supportsAquaticMotion: false,
    supportsPlantSway: false,
    baselineFlip: false,
    breathingScale: 1.018,
  },
  winged: {
    supportsBlink: true,
    supportsPawCue: true,
    supportsTailCue: true,
    supportsGroundDust: true,
    supportsFloatingMotion: true,
    supportsAquaticMotion: false,
    supportsPlantSway: false,
    baselineFlip: false,
    breathingScale: 1.02,
  },
  plant: {
    supportsBlink: true,
    supportsPawCue: false,
    supportsTailCue: false,
    supportsGroundDust: true,
    supportsFloatingMotion: false,
    supportsAquaticMotion: false,
    supportsPlantSway: true,
    baselineFlip: false,
    breathingScale: 1.028,
  },
}

type Entry = {
  code: string
  motionStyle: PetMotionStyle
  head: PetAnchorPoint
  belly: PetAnchorPoint
  feet: PetAnchorPoint
  face: PetFaceAnchor | null
  frontLeft?: PetAnchorPoint | null
  frontRight?: PetAnchorPoint | null
  backLeft?: PetAnchorPoint | null
  backRight?: PetAnchorPoint | null
  tail?: PetTailAnchor | null
  overrides?: Partial<StyleDefaults>
}

function face(x: number, y: number, width: number, rotation = 0): PetFaceAnchor {
  return { center: { x, y }, width, rotation }
}

function tail(
  x: number,
  y: number,
  direction: PetTailAnchor["direction"],
  length = 0.2,
  rotation = 0,
): PetTailAnchor {
  return { base: { x, y }, direction, length, rotation }
}

const ENTRIES: Entry[] = [
  {
    code: "01_cat",
    motionStyle: "quadruped",
    head: { x: 0.527, y: 0.287 },
    belly: { x: 0.56, y: 0.6 },
    feet: { x: 0.608, y: 0.942 },
    face: null,
    frontLeft: { x: 0.518, y: 0.912 },
    frontRight: { x: 0.698, y: 0.912 },
    tail: tail(0.3, 0.76, "left"),
  },
  {
    code: "02_dog",
    motionStyle: "quadruped",
    head: { x: 0.497, y: 0.309 },
    belly: { x: 0.49, y: 0.58 },
    feet: { x: 0.463, y: 0.93 },
    face: face(0.497, 0.513, 0.499),
    frontLeft: { x: 0.373, y: 0.9 },
    frontRight: { x: 0.553, y: 0.9 },
    tail: tail(0.79, 0.63, "right"),
  },
  {
    code: "03_rabbit",
    motionStyle: "quadruped",
    head: { x: 0.349, y: 0.195 },
    belly: { x: 0.412, y: 0.583 },
    feet: { x: 0.41, y: 0.977 },
    face: face(0.349, 0.583, 0.476),
    frontLeft: { x: 0.32, y: 0.947 },
    frontRight: { x: 0.5, y: 0.947 },
    tail: tail(0.78, 0.78, "right", 0.12),
  },
  {
    code: "04_hamster",
    motionStyle: "round",
    head: { x: 0.565, y: 0.176 },
    belly: { x: 0.542, y: 0.469 },
    feet: { x: 0.547, y: 0.79 },
    face: face(0.565, 0.325, 0.45),
    tail: null,
  },
  {
    code: "05_guinea_pig",
    motionStyle: "round",
    head: { x: 0.469, y: 0.19 },
    belly: { x: 0.478, y: 0.469 },
    feet: { x: 0.475, y: 0.797 },
    face: null,
    tail: null,
  },
  {
    code: "06_ferret",
    motionStyle: "quadruped",
    head: { x: 0.461, y: 0.264 },
    belly: { x: 0.465, y: 0.496 },
    feet: { x: 0.374, y: 0.778 },
    face: null,
    frontLeft: { x: 0.284, y: 0.748 },
    frontRight: { x: 0.464, y: 0.748 },
    tail: tail(0.73, 0.56, "right"),
  },
  {
    code: "07_red_panda",
    motionStyle: "quadruped",
    head: { x: 0.482, y: 0.255 },
    belly: { x: 0.505, y: 0.566 },
    feet: { x: 0.515, y: 0.907 },
    face: null,
    frontLeft: { x: 0.425, y: 0.877 },
    frontRight: { x: 0.605, y: 0.877 },
    tail: tail(0.28, 0.73, "left"),
  },
  {
    code: "08_fox",
    motionStyle: "quadruped",
    head: { x: 0.378, y: 0.228 },
    belly: { x: 0.483, y: 0.554 },
    feet: { x: 0.471, y: 0.911 },
    face: face(0.378, 0.502, 0.418),
    frontLeft: { x: 0.381, y: 0.881 },
    frontRight: { x: 0.561, y: 0.881 },
    tail: tail(0.73, 0.6, "right"),
  },
  {
    code: "09_raccoon",
    motionStyle: "quadruped",
    head: { x: 0.428, y: 0.283 },
    belly: { x: 0.402, y: 0.588 },
    feet: { x: 0.377, y: 0.911 },
    face: null,
    frontLeft: { x: 0.287, y: 0.881 },
    frontRight: { x: 0.467, y: 0.881 },
    tail: tail(0.76, 0.61, "right"),
  },
  {
    code: "10_hedgehog",
    motionStyle: "round",
    head: { x: 0.514, y: 0.169 },
    belly: { x: 0.52, y: 0.454 },
    feet: { x: 0.52, y: 0.766 },
    face: null,
    tail: null,
    overrides: { supportsBlink: false },
  },
  {
    code: "11_squirrel",
    motionStyle: "quadruped",
    head: { x: 0.366, y: 0.126 },
    belly: { x: 0.488, y: 0.425 },
    feet: { x: 0.451, y: 0.774 },
    face: face(0.366, 0.345, 0.445),
    frontLeft: { x: 0.361, y: 0.744 },
    frontRight: { x: 0.541, y: 0.744 },
    tail: tail(0.72, 0.68, "right"),
  },
  {
    code: "12_capybara",
    motionStyle: "quadruped",
    head: { x: 0.439, y: 0.164 },
    belly: { x: 0.432, y: 0.464 },
    feet: { x: 0.461, y: 0.778 },
    face: null,
    frontLeft: { x: 0.371, y: 0.748 },
    frontRight: { x: 0.551, y: 0.748 },
    tail: null,
    overrides: { supportsBlink: false, supportsTailCue: false },
  },
  {
    code: "13_panda",
    motionStyle: "biped",
    head: { x: 0.547, y: 0.242 },
    belly: { x: 0.547, y: 0.547 },
    feet: { x: 0.545, y: 0.911 },
    face: null,
    frontLeft: { x: 0.455, y: 0.881 },
    frontRight: { x: 0.635, y: 0.881 },
    tail: null,
  },
  {
    code: "14_koala",
    motionStyle: "biped",
    head: { x: 0.486, y: 0.233 },
    belly: { x: 0.508, y: 0.547 },
    feet: { x: 0.509, y: 0.926 },
    face: null,
    frontLeft: { x: 0.419, y: 0.896 },
    frontRight: { x: 0.599, y: 0.896 },
    tail: null,
    overrides: { supportsBlink: false },
  },
  {
    code: "15_sloth",
    motionStyle: "biped",
    head: { x: 0.424, y: 0.259 },
    belly: { x: 0.433, y: 0.582 },
    feet: { x: 0.425, y: 0.852 },
    face: face(0.424, 0.436, 0.411),
    frontLeft: { x: 0.335, y: 0.822 },
    frontRight: { x: 0.515, y: 0.822 },
    tail: null,
  },
  {
    code: "16_alpaca",
    motionStyle: "quadruped",
    head: { x: 0.487, y: 0.1 },
    belly: { x: 0.575, y: 0.433 },
    feet: { x: 0.597, y: 0.821 },
    face: face(0.487, 0.264, 0.381),
    frontLeft: { x: 0.507, y: 0.791 },
    frontRight: { x: 0.687, y: 0.791 },
    tail: tail(0.8, 0.6, "right", 0.12),
  },
  {
    code: "17_otter",
    motionStyle: "quadruped",
    head: { x: 0.553, y: 0.144 },
    belly: { x: 0.52, y: 0.472 },
    feet: { x: 0.524, y: 0.813 },
    face: null,
    frontLeft: { x: 0.434, y: 0.783 },
    frontRight: { x: 0.614, y: 0.783 },
    tail: tail(0.74, 0.72, "right"),
  },
  {
    code: "18_penguin",
    motionStyle: "biped",
    head: { x: 0.409, y: 0.204 },
    belly: { x: 0.435, y: 0.477 },
    feet: { x: 0.429, y: 0.766 },
    face: face(0.409, 0.335, 0.422),
    frontLeft: { x: 0.339, y: 0.736 },
    frontRight: { x: 0.519, y: 0.736 },
    tail: null,
  },
  {
    code: "19_axolotl",
    motionStyle: "aquatic",
    head: { x: 0.549, y: 0.279 },
    belly: { x: 0.55, y: 0.584 },
    feet: { x: 0.555, y: 0.907 },
    face: null,
    tail: tail(0.22, 0.7, "left"),
  },
  {
    code: "20_seal",
    motionStyle: "aquatic",
    head: { x: 0.463, y: 0.306 },
    belly: { x: 0.452, y: 0.596 },
    feet: { x: 0.398, y: 0.899 },
    face: null,
    tail: tail(0.78, 0.68, "right"),
    overrides: { supportsBlink: false },
  },
  {
    code: "21_sea_turtle",
    motionStyle: "aquatic",
    head: { x: 0.445, y: 0.304 },
    belly: { x: 0.4, y: 0.606 },
    feet: { x: 0.46, y: 0.915 },
    face: null,
    tail: tail(0.8, 0.64, "right", 0.12),
  },
  {
    code: "22_pufferfish",
    motionStyle: "aquatic",
    head: { x: 0.586, y: 0.165 },
    belly: { x: 0.529, y: 0.44 },
    feet: { x: 0.539, y: 0.755 },
    face: face(0.586, 0.394, 0.564),
    tail: tail(0.83, 0.55, "right", 0.12),
  },
  {
    code: "23_octopus",
    motionStyle: "aquatic",
    head: { x: 0.496, y: 0.147 },
    belly: { x: 0.496, y: 0.442 },
    feet: { x: 0.488, y: 0.755 },
    face: null,
    tail: null,
    overrides: { supportsTailCue: false },
  },
  {
    code: "24_dolphin",
    motionStyle: "aquatic",
    head: { x: 0.482, y: 0.192 },
    belly: { x: 0.433, y: 0.448 },
    feet: { x: 0.46, y: 0.7 },
    face: null,
    tail: tail(0.82, 0.66, "right"),
  },
  {
    code: "25_baby_dragon",
    motionStyle: "winged",
    head: { x: 0.502, y: 0.216 },
    belly: { x: 0.574, y: 0.554 },
    feet: { x: 0.575, y: 0.922 },
    face: face(0.502, 0.443, 0.493),
    frontLeft: { x: 0.485, y: 0.892 },
    frontRight: { x: 0.665, y: 0.892 },
    tail: tail(0.8, 0.74, "right"),
  },
  {
    code: "26_unicorn",
    motionStyle: "quadruped",
    head: { x: 0.553, y: 0.23 },
    belly: { x: 0.526, y: 0.565 },
    feet: { x: 0.521, y: 0.926 },
    face: null,
    frontLeft: { x: 0.431, y: 0.896 },
    frontRight: { x: 0.611, y: 0.896 },
    tail: tail(0.8, 0.62, "right"),
  },
  {
    code: "27_phoenix",
    motionStyle: "winged",
    head: { x: 0.415, y: 0.213 },
    belly: { x: 0.486, y: 0.563 },
    feet: { x: 0.528, y: 0.872 },
    face: face(0.415, 0.498, 0.41),
    frontLeft: { x: 0.438, y: 0.842 },
    frontRight: { x: 0.618, y: 0.842 },
    tail: tail(0.78, 0.74, "right"),
  },
  {
    code: "28_cloud_spirit",
    motionStyle: "floating",
    head: { x: 0.571, y: 0.129 },
    belly: { x: 0.558, y: 0.417 },
    feet: { x: 0.508, y: 0.856 },
    face: face(0.571, 0.409, 0.475),
    tail: null,
  },
  {
    code: "29_moon_spirit",
    motionStyle: "floating",
    head: { x: 0.477, y: 0.125 },
    belly: { x: 0.485, y: 0.451 },
    feet: { x: 0.489, y: 0.856 },
    face: null,
    tail: tail(0.75, 0.73, "right"),
  },
  {
    code: "30_sprout_spirit",
    motionStyle: "plant",
    head: { x: 0.35, y: 0.121 },
    belly: { x: 0.393, y: 0.436 },
    feet: { x: 0.384, y: 0.852 },
    face: face(0.35, 0.467, 0.449),
    tail: null,
  },
]

function build(entry: Entry): PetMotionProfile {
  const defaults = STYLE_DEFAULTS[entry.motionStyle]
  return {
    code: entry.code,
    motionStyle: entry.motionStyle,
    head: entry.head,
    belly: entry.belly,
    feet: entry.feet,
    face: entry.face,
    frontLeft: entry.frontLeft ?? null,
    frontRight: entry.frontRight ?? null,
    backLeft: entry.backLeft ?? null,
    backRight: entry.backRight ?? null,
    tail: entry.tail ?? null,
    ...defaults,
    ...entry.overrides,
  }
}

export const PET_MOTION_PROFILES: readonly PetMotionProfile[] = ENTRIES.map(build)

const PROFILE_BY_CODE = new Map(PET_MOTION_PROFILES.map((p) => [p.code, p]))

export function getPetMotionProfile(code: string | null | undefined): PetMotionProfile | null {
  if (!code) return null
  return PROFILE_BY_CODE.get(code) ?? null
}
