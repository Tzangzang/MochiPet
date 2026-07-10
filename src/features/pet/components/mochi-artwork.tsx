import type { PetVisualState } from "../types"

const HAPPY_STATES = new Set<PetVisualState>(["hover_happy", "scratch_happy"])

function Eyes({ happy, dead }: { happy: boolean; dead: boolean }) {
  if (dead) {
    return (
      <g className="mochi-eyes">
        <path d="M96 118 l16 16 M112 118 l-16 16" className="mochi-eye-x" />
        <path d="M144 118 l16 16 M160 118 l-16 16" className="mochi-eye-x" />
      </g>
    )
  }
  if (happy) {
    return (
      <g className="mochi-eyes">
        <path d="M92 124 q12 -16 24 0" className="mochi-eye-happy" />
        <path d="M124 124 q12 -16 24 0" className="mochi-eye-happy" />
      </g>
    )
  }
  return (
    <g className="mochi-eyes">
      <circle cx="104" cy="122" r="9" className="mochi-eye" />
      <circle cx="136" cy="122" r="9" className="mochi-eye" />
      <circle cx="107" cy="119" r="3" className="mochi-eye-shine" />
      <circle cx="139" cy="119" r="3" className="mochi-eye-shine" />
    </g>
  )
}

function Mouth({ state }: { state: PetVisualState }) {
  if (state === "dead") return <path d="M108 152 q12 -10 24 0" className="mochi-mouth" />
  if (state === "scratch_happy") return <path d="M104 148 q16 22 32 0 z" className="mochi-mouth-open" />
  if (state === "hover_happy") return <path d="M106 148 q14 16 28 0" className="mochi-mouth" />
  return <path d="M112 150 q8 8 16 0" className="mochi-mouth" />
}

export function MochiArtwork({ state }: { state: PetVisualState }) {
  const happy = HAPPY_STATES.has(state)
  const dead = state === "dead"
  const scratching = state === "scratch_happy"
  const rootClass = [
    "mochi",
    happy ? "mochi-happy" : "",
    scratching ? "mochi-scratch" : "",
    dead ? "mochi-dead" : "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <svg
      viewBox="0 0 240 240"
      className={`h-48 w-48 ${rootClass}`}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="120" cy="214" rx="62" ry="13" className="mochi-shadow" />
      <g className="mochi-tail">
        <path d="M172 152 q42 -8 46 26 q-28 10 -46 -12 z" className="mochi-tail-shape" />
      </g>
      <g className="mochi-body">
        <path className="mochi-ear" d="M86 62 q-14 -34 10 -46 q18 20 12 46 z" />
        <path className="mochi-ear" d="M154 62 q14 -34 -10 -46 q-18 20 -12 46 z" />
        <ellipse cx="120" cy="134" rx="72" ry="66" className="mochi-body-shape" />
        <ellipse cx="88" cy="152" rx="12" ry="10" className="mochi-paw" />
        <ellipse cx="152" cy="152" rx="12" ry="10" className="mochi-paw" />
        <g className="mochi-cheeks" opacity={happy ? 1 : 0.65}>
          <circle cx="84" cy="140" r="10" className="mochi-cheek" />
          <circle cx="156" cy="140" r="10" className="mochi-cheek" />
        </g>
        <Eyes happy={happy} dead={dead} />
        <Mouth state={state} />
      </g>
      {happy ? (
        <g className="mochi-sparkle">
          <path
            d="M40 68 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 z"
            className="mochi-heart"
          />
          <path
            d="M198 62 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 z"
            className="mochi-heart"
          />
        </g>
      ) : null}
    </svg>
  )
}
