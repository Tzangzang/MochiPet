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
      : expression === "hungry" || expression === "weak"
        ? "droop"
        : (expression === "idle" || expression === "blink") && supportsBlink
          ? "blink"
          : "none"

  if (mode === "none") return null

  const left = pointToPercent(face.eyeLeft)
  const right = pointToPercent(face.eyeRight)
  const lidWidth = `${(Math.max(face.width, 0.12) * 0.34 * 100).toFixed(1)}%`

  return (
    <div className={`pet-eyelids pet-eyelids-${mode}`} aria-hidden="true">
      <span className="pet-eyelid" style={{ left: left.left, top: left.top, width: lidWidth }} />
      <span className="pet-eyelid" style={{ left: right.left, top: right.top, width: lidWidth }} />
    </div>
  )
}
