import { pointToPercent } from "../animation/pet-animation-config"
import type { PetEyeExpressionState, PetFaceAnchor } from "../animation/types"

export function PetEyeExpression({
  face,
  expression,
  supportsBlink,
  active,
}: {
  face: PetFaceAnchor | null
  expression: PetEyeExpressionState
  supportsBlink: boolean
  active: boolean
}) {
  if (!face || !active) return null

  const mode =
    expression === "sleeping" || expression === "dead"
      ? "closed"
      : (expression === "idle" || expression === "blink") && supportsBlink
        ? "blink"
        : "none"

  if (mode === "none") return null

  const center = pointToPercent(face.center)
  const eyeGap = face.width * 0.24
  const left = pointToPercent({ x: face.center.x - eyeGap, y: face.center.y })
  const right = pointToPercent({ x: face.center.x + eyeGap, y: face.center.y })
  const lidWidth = `${(face.width * 0.2 * 100).toFixed(1)}%`

  return (
    <div
      className={`pet-eyelids pet-eyelids-${mode}`}
      style={{ transform: `rotate(${face.rotation}deg)`, transformOrigin: `${center.left} ${center.top}` }}
      aria-hidden="true"
    >
      <span className="pet-eyelid" style={{ left: left.left, top: left.top, width: lidWidth }} />
      <span className="pet-eyelid" style={{ left: right.left, top: right.top, width: lidWidth }} />
    </div>
  )
}
