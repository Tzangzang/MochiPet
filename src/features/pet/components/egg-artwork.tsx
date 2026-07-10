export function EggArtwork({ nearHatch = false }: { nearHatch?: boolean }) {
  return (
    <svg
      viewBox="0 0 160 200"
      className={`h-40 w-32 egg ${nearHatch ? "egg-near" : ""}`}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="80" cy="188" rx="42" ry="10" className="egg-shadow" />
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
