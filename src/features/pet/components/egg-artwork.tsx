type EggVariant = "unhatched" | "incubating"

function EggShape() {
  return (
    <svg viewBox="0 0 160 200" className="egg-shape" aria-hidden="true" focusable="false">
      <path
        className="egg-shell"
        d="M80 18 C40 18 26 92 26 128 C26 168 50 190 80 190 C110 190 134 168 134 128 C134 92 120 18 80 18 Z"
      />
      <circle className="egg-spot" cx="60" cy="120" r="9" />
      <circle className="egg-spot" cx="98" cy="96" r="7" />
      <circle className="egg-spot" cx="96" cy="146" r="10" />
      <path className="egg-highlight" d="M58 60 q-14 22 -6 48" />
    </svg>
  )
}

function BasketBack() {
  return (
    <svg viewBox="0 0 200 100" className="egg-basket-svg" aria-hidden="true" focusable="false">
      <path className="basket-handle" d="M40 96 Q100 4 160 96" />
    </svg>
  )
}

function BasketFront() {
  return (
    <svg viewBox="0 0 200 130" className="egg-basket-svg" aria-hidden="true" focusable="false">
      <path className="basket-pad" d="M28 26 Q100 6 172 26 Q150 44 100 44 Q50 44 28 26 Z" />
      <path
        className="basket-body"
        d="M26 28 Q30 96 46 116 Q70 126 100 126 Q130 126 154 116 Q170 96 174 28 Q150 52 100 52 Q50 52 26 28 Z"
      />
      <path className="basket-rim" d="M20 26 Q100 2 180 26 Q180 44 100 52 Q20 44 20 26 Z" />
      <path className="basket-weave" d="M46 60 Q100 74 154 60 M42 84 Q100 100 158 84" />
    </svg>
  )
}

export function EggArtwork({
  variant = "unhatched",
  nearHatch = false,
}: {
  variant?: EggVariant
  nearHatch?: boolean
}) {
  if (variant === "incubating") {
    return (
      <div
        className={`egg-stage egg-stage-incubating ${nearHatch ? "egg-stage-near" : ""}`}
        role="img"
        aria-label="Trứng Starter Mochi đang được ấp trong rổ năng lượng"
      >
        <div className="egg-energy" aria-hidden="true">
          <span className="egg-aura" />
          <span className="egg-glow" />
          <span className="egg-ring egg-ring-1" />
          <span className="egg-ring egg-ring-2" />
          <span className="egg-sparkle egg-sparkle-1" />
          <span className="egg-sparkle egg-sparkle-2" />
          <span className="egg-sparkle egg-sparkle-3" />
          <span className="egg-sparkle egg-sparkle-4" />
        </div>
        <div className="egg-basket-back" aria-hidden="true">
          <BasketBack />
        </div>
        <div className="egg-motion">
          <EggShape />
        </div>
        <div className="egg-basket-front" aria-hidden="true">
          <BasketFront />
        </div>
        <div className="egg-basket-shadow" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div
      className="egg-stage egg-stage-unhatched"
      role="img"
      aria-label="Trứng Starter Mochi chưa bắt đầu ấp"
    >
      <div className="egg-motion">
        <EggShape />
      </div>
      <div className="egg-ground-shadow" aria-hidden="true" />
    </div>
  )
}
