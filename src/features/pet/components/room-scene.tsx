import type { ReactNode } from "react"

export function RoomScene({
  children,
  dimmed = false,
}: {
  children: ReactNode
  dimmed?: boolean
}) {
  return (
    <div className="home-room-scene" data-dimmed={dimmed ? "true" : undefined}>
      <span className="home-room-frame" aria-hidden="true" />
      <div className="home-room-window" aria-hidden="true">
        <span className="home-room-window-glow" />
        <span className="home-room-window-bar home-room-window-bar-v" />
        <span className="home-room-window-bar home-room-window-bar-h" />
      </div>
      <span className="home-room-curtain home-room-curtain-left" aria-hidden="true" />
      <span className="home-room-curtain home-room-curtain-right" aria-hidden="true" />
      <div className="home-room-floor" aria-hidden="true" />
      <span className="home-room-rug" aria-hidden="true" />
      <div className="home-room-plant" aria-hidden="true">
        <svg viewBox="0 0 60 80" className="home-room-plant-svg" focusable="false">
          <path d="M30 46 C14 42 12 18 24 10 C27 26 30 32 30 46 Z" className="home-room-leaf" />
          <path d="M30 46 C46 40 50 16 38 8 C34 26 30 32 30 46 Z" className="home-room-leaf" />
          <path d="M30 48 C24 40 22 22 30 12 C38 22 36 40 30 48 Z" className="home-room-leaf home-room-leaf-mid" />
          <path d="M18 46 h24 l-4 28 h-16 z" className="home-room-pot" />
        </svg>
      </div>
      <div className="home-room-stage">{children}</div>
    </div>
  )
}
