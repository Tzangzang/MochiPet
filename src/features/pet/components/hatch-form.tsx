"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { petNameSchema, type PetNameInput } from "../lib/pet-name-schema"
import { useHatchEgg } from "../hooks/use-pet-core-actions"
import { ErrorNotice } from "./error-notice"

export function HatchForm({ eggId }: { eggId: string }) {
  const hatchEgg = useHatchEgg(eggId)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PetNameInput>({
    resolver: zodResolver(petNameSchema),
    defaultValues: { name: "" },
  })

  const busy = isSubmitting || hatchEgg.isPending

  async function onSubmit(values: PetNameInput) {
    setErrorMessage(null)
    try {
      await hatchEgg.mutateAsync(values.name.trim())
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Đã xảy ra lỗi. Vui lòng thử lại.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <div className="space-y-2">
        <Label htmlFor="pet-name">Đặt tên cho pet</Label>
        <Input
          id="pet-name"
          type="text"
          autoComplete="off"
          maxLength={40}
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
        <p className="text-xs text-muted-foreground">Từ 1 đến 40 ký tự.</p>
        {errors.name ? (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        ) : null}
      </div>
      {errorMessage ? <ErrorNotice message={errorMessage} /> : null}
      <Button type="submit" className="w-full" disabled={busy} aria-busy={busy}>
        {busy ? "Đang nở..." : "Nở trứng"}
      </Button>
    </form>
  )
}
