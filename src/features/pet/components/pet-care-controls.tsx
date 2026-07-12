"use client"

import { Button } from "@/components/ui/button"

export function PetCareControls({
  onScratch,
  disabled,
}: {
  onScratch: () => void
  disabled: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={onScratch}
        disabled={disabled}
      >
        Vuốt ve Mochi
      </Button>
    </div>
  )
}
