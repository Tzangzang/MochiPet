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

function NestFront() {
  return (
    <svg viewBox="0 0 220 86" className="egg-nest-svg" aria-hidden="true" focusable="false">
      <ellipse className="nest-pad" cx="110" cy="34" rx="96" ry="30" />
      <path
        className="nest-body"
        d="M10 38 Q12 70 42 78 Q110 90 178 78 Q208 70 210 38 Q206 54 110 60 Q14 54 10 38 Z"
      />
      <path className="nest-rim" d="M14 34 Q110 6 206 34 Q206 52 110 58 Q14 52 14 34 Z" />
      <path
        className="nest-straw"
        d="M44 40 Q72 50 100 42 M120 44 Q150 52 178 40 M74 56 Q110 64 146 56"
      />
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
        aria-label="Trứng bí ẩn đang được ấp trong ổ năng lượng"
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
        <div className="egg-motion">
          <EggShape />
        </div>
        <div className="egg-nest-front" aria-hidden="true">
          <NestFront />
        </div>
        <div className="egg-nest-shadow" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div
      className="egg-stage egg-stage-unhatched"
      role="img"
      aria-label="Trứng bí ẩn chưa bắt đầu ấp"
    >
      <div className="egg-motion">
        <EggShape />
      </div>
      <div className="egg-ground-shadow" aria-hidden="true" />
    </div>
  )
}
