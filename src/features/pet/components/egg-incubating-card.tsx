"use client"

import { useEffect, useState } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EggArtwork } from "./egg-artwork"
import { HatchForm } from "./hatch-form"
import type { CurrentEgg } from "../types"

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function EggIncubatingCard({ egg }: { egg: CurrentEgg }) {
  const hatchesAt = egg.hatches_at ? new Date(egg.hatches_at).getTime() : null
  const startedAt = egg.hatch_started_at ? new Date(egg.hatch_started_at).getTime() : null
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (hatchesAt === null) return
    const tick = () => setRemaining(Math.max(0, hatchesAt - Date.now()))
    tick()
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") tick()
    }, 1000)
    const onVisibility = () => {
      if (document.visibilityState === "visible") tick()
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [hatchesAt])

  const ready = remaining !== null && remaining <= 0
  const totalMs = hatchesAt !== null && startedAt !== null ? hatchesAt - startedAt : 0
  const progress =
    totalMs > 0 && remaining !== null
      ? Math.min(100, Math.max(0, ((totalMs - remaining) / totalMs) * 100))
      : 0
  const nearHatch = remaining !== null && remaining <= 20000

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đang ấp trứng</CardTitle>
        <CardDescription>Starter Mochi sắp chào đời.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <EggArtwork variant="incubating" nearHatch={nearHatch} />
        </div>
        <div className="text-center" aria-live="polite">
          <p className="text-3xl font-semibold tabular-nums">
            {remaining === null ? "—:—" : formatRemaining(remaining)}
          </p>
          <p className="text-sm text-muted-foreground">
            {ready ? "Trứng đã sẵn sàng để nở!" : "Thời gian còn lại"}
          </p>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {ready ? (
          <HatchForm eggId={egg.id} />
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Nút nở sẽ xuất hiện khi đếm ngược kết thúc.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
