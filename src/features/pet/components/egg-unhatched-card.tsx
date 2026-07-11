"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useStartIncubation } from "../hooks/use-pet-core-actions"
import { EggArtwork } from "./egg-artwork"
import { ErrorNotice } from "./error-notice"
import type { CurrentEgg } from "../types"

export function EggUnhatchedCard({ egg }: { egg: CurrentEgg }) {
  const startIncubation = useStartIncubation(egg.id)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const busy = startIncubation.isPending

  async function handleStart() {
    if (busy) return
    setErrorMessage(null)
    try {
      await startIncubation.mutateAsync()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Đã xảy ra lỗi. Vui lòng thử lại.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trứng bí ẩn</CardTitle>
        <CardDescription>
          Bên trong đang có một người bạn nhỏ. Hãy bắt đầu ấp để khám phá.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <EggArtwork variant="unhatched" />
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Trạng thái</dt>
            <dd className="font-medium">Chưa bắt đầu ấp</dd>
          </div>
        </dl>
        {errorMessage ? <ErrorNotice message={errorMessage} /> : null}
        <Button
          type="button"
          className="w-full"
          onClick={handleStart}
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? "Đang bắt đầu..." : "Bắt đầu ấp"}
        </Button>
      </CardContent>
    </Card>
  )
}
