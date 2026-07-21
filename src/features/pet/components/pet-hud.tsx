export function PetHud({
  name,
  species,
  level,
  role,
  mealCount,
  mealsRequired,
  health,
  hygiene,
}: {
  name: string
  species: string
  level: number
  role: string
  mealCount: number | null
  mealsRequired: number | null
  health: number | null
  hygiene: number | null
}) {
  return (
    <div className="home-room-hud home-room-hud-pet">
      <p className="home-room-hud-title">{name}</p>
      <p className="home-room-hud-sub">
        {species} · Cấp {level} · {role}
      </p>
      {mealCount !== null && mealsRequired !== null ? (
        <p className="home-room-hud-meta">
          Bữa hôm nay: {mealCount}/{mealsRequired}
        </p>
      ) : null}
      {health !== null && hygiene !== null ? (
        <div className="home-room-stats" role="group" aria-label="Sức khỏe và vệ sinh">
          <span className="home-room-stat">
            <span className="home-room-stat-label">Sức khỏe</span>
            <span className="home-room-stat-track" aria-hidden="true">
              <span className="home-room-stat-fill home-room-stat-health" style={{ width: `${health}%` }} />
            </span>
            <span className="home-room-stat-value">{health}</span>
          </span>
          <span className="home-room-stat">
            <span className="home-room-stat-label">Vệ sinh</span>
            <span className="home-room-stat-track" aria-hidden="true">
              <span className="home-room-stat-fill home-room-stat-hygiene" style={{ width: `${hygiene}%` }} />
            </span>
            <span className="home-room-stat-value">{hygiene}</span>
          </span>
        </div>
      ) : null}
    </div>
  )
}
