"use client"

import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { petCoreKeys } from "../lib/query-keys"

type Anchor = { key: string; tick: number; base: number }

export function useFeedCooldown(args: {
  active: boolean
  serverNow: string | null
  nextFeedAt: string | null
}): number | null {
  const { active, serverNow, nextFeedAt } = args
  const queryClient = useQueryClient()
  const [nowTick, setNowTick] = useState<number>(() => Date.now())
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const boundaryFiredFor = useRef<string | null>(null)

  const key = active && serverNow && nextFeedAt ? nextFeedAt : null
  if (key !== (anchor?.key ?? null)) {
    if (key && serverNow) {
      const base = Date.parse(key) - Date.parse(serverNow)
      setAnchor(Number.isNaN(base) ? null : { key, tick: nowTick, base })
    } else {
      setAnchor(null)
    }
  }

  useEffect(() => {
    if (!anchor) return
    const intervalId = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return
      setNowTick(Date.now())
    }, 1000)
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") setNowTick(Date.now())
    }
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [anchor])

  const remaining = anchor ? Math.max(0, anchor.base - (nowTick - anchor.tick)) : null

  useEffect(() => {
    if (remaining === null || remaining > 0 || !nextFeedAt) return
    if (boundaryFiredFor.current === nextFeedAt) return
    boundaryFiredFor.current = nextFeedAt
    void queryClient.invalidateQueries({ queryKey: petCoreKeys.state() })
  }, [remaining, nextFeedAt, queryClient])

  return remaining
}
