"use client"

import type { ReactNode } from "react"

export type ActionTile = {
  id: string
  label: string
  accessibleLabel: string
  icon: ReactNode
  disabled: boolean
  pending: boolean
  badge: string | null
  onAction?: () => void
}

export function ActionDock({ actions }: { actions: ActionTile[] }) {
  return (
    <div className="home-room-dock">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          className="home-room-action"
          onClick={action.onAction}
          disabled={action.disabled}
          aria-label={action.accessibleLabel}
          aria-busy={action.pending}
        >
          <span className="home-room-action-icon" aria-hidden="true">
            {action.icon}
          </span>
          <span className="home-room-action-label">{action.label}</span>
          {action.badge ? (
            <span className="home-room-action-badge">{action.badge}</span>
          ) : null}
        </button>
      ))}
    </div>
  )
}
