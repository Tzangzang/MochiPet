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
import { useCreateEgg } from "../hooks/use-pet-core-actions"
import { EggArtwork } from "./egg-artwork"
import { ErrorNotice } from "./error-notice"

export function CreateEggCard() {
  const createEgg = useCreateEgg()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const busy = createEgg.isPending

  async function handleCreate() {
    if (busy) return
    setErrorMessage(null)
    try {
      await createEgg.mutateAsync()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Đã xảy ra lỗi. Vui lòng thử lại.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bắt đầu hành trình</CardTitle>
        <CardDescription>
          Một người bạn bí ẩn đang chờ bạn bên trong quả trứng.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <EggArtwork />
        </div>
        {errorMessage ? <ErrorNotice message={errorMessage} /> : null}
        <Button
          type="button"
          className="w-full"
          onClick={handleCreate}
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? "Đang chuẩn bị..." : "Nhận trứng bí ẩn"}
        </Button>
      </CardContent>
    </Card>
  )
}
