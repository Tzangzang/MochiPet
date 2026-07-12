export function PetHud({
  name,
  species,
  level,
  role,
}: {
  name: string
  species: string
  level: number
  role: string
}) {
  return (
    <div className="home-room-hud home-room-hud-pet">
      <p className="home-room-hud-title">{name}</p>
      <p className="home-room-hud-sub">
        {species} · Cấp {level} · {role}
      </p>
    </div>
  )
}
