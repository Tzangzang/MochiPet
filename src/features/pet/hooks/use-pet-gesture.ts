"use client"

import { useCallback, useRef } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"

type GestureData = {
  active: boolean
  pointerId: number | null
  startX: number
  startY: number
  lastX: number
  lastDirection: number
  directionChanges: number
  accumulatedHorizontal: number
  maxVerticalDrift: number
  lastActivationTime: number
}

const HORIZONTAL_MIN = 36
const SEGMENT_MIN = 12
const DIRECTION_CHANGES_MIN = 2
const VERTICAL_TOLERANCE = 28
const COOLDOWN_MS = 250

function createData(): GestureData {
  return {
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastDirection: 0,
    directionChanges: 0,
    accumulatedHorizontal: 0,
    maxVerticalDrift: 0,
    lastActivationTime: 0,
  }
}

export function usePetGesture(onScratch: () => void, enabled: boolean) {
  const ref = useRef<GestureData>(createData())

  const resetTracking = useCallback(() => {
    const g = ref.current
    g.active = false
    g.pointerId = null
    g.directionChanges = 0
    g.accumulatedHorizontal = 0
    g.maxVerticalDrift = 0
    g.lastDirection = 0
  }, [])

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled) return
      const g = ref.current
      g.active = true
      g.pointerId = event.pointerId
      g.startX = event.clientX
      g.startY = event.clientY
      g.lastX = event.clientX
      g.directionChanges = 0
      g.accumulatedHorizontal = 0
      g.maxVerticalDrift = 0
      g.lastDirection = 0
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        return
      }
    },
    [enabled],
  )

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const g = ref.current
      if (!g.active || event.pointerId !== g.pointerId) return

      const verticalDrift = Math.abs(event.clientY - g.startY)
      if (verticalDrift > g.maxVerticalDrift) g.maxVerticalDrift = verticalDrift
      if (g.maxVerticalDrift > VERTICAL_TOLERANCE && g.directionChanges < DIRECTION_CHANGES_MIN) {
        try {
          if (g.pointerId !== null) event.currentTarget.releasePointerCapture(g.pointerId)
        } catch {
          resetTracking()
          return
        }
        resetTracking()
        return
      }

      const segment = event.clientX - g.lastX
      if (Math.abs(segment) >= SEGMENT_MIN) {
        const direction = segment > 0 ? 1 : -1
        if (g.lastDirection !== 0 && direction !== g.lastDirection) {
          g.directionChanges += 1
        }
        g.lastDirection = direction
        g.accumulatedHorizontal += Math.abs(segment)
        g.lastX = event.clientX
      }

      const now = Date.now()
      if (
        g.accumulatedHorizontal >= HORIZONTAL_MIN &&
        g.directionChanges >= DIRECTION_CHANGES_MIN &&
        now - g.lastActivationTime > COOLDOWN_MS
      ) {
        g.lastActivationTime = now
        g.accumulatedHorizontal = 0
        g.directionChanges = 0
        g.lastDirection = 0
        onScratch()
      }
    },
    [onScratch, resetTracking],
  )

  const endGesture = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const g = ref.current
      if (event.pointerId !== g.pointerId) return
      try {
        if (g.pointerId !== null) event.currentTarget.releasePointerCapture(g.pointerId)
      } catch {
        resetTracking()
        return
      }
      resetTracking()
    },
    [resetTracking],
  )

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: endGesture,
    onPointerCancel: endGesture,
    onLostPointerCapture: endGesture,
  }
}
