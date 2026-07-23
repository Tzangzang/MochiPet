import { pointToPercent } from "../animation/pet-animation-config"
import type { PetEyeExpressionState, PetFaceAnchor } from "../animation/types"

const BLUSH_EXPRESSIONS: ReadonlySet<PetEyeExpressionState> = new Set([
  "happy",
  "loved",
  "feeding",
])

export function PetFaceExpression({
  face,
  expression,
  active,
}: {
  face: PetFaceAnchor | null
  expression: PetEyeExpressionState
  active: boolean
}) {
  if (!face || !active) return null
  if (!face.cheekLeft || !face.cheekRight) return null
  if (!BLUSH_EXPRESSIONS.has(expression)) return null

  const left = pointToPercent(face.cheekLeft)
  const right = pointToPercent(face.cheekRight)
  const size = `${(Math.max(face.width, 0.16) * 0.42 * 100).toFixed(1)}%`

  return (
    <div className="pet-blush" aria-hidden="true">
      <span className="pet-blush-dot" style={{ left: left.left, top: left.top, width: size, height: size }} />
      <span className="pet-blush-dot" style={{ left: right.left, top: right.top, width: size, height: size }} />
    </div>
  )
}
