"use client"

import { Input } from "@/components/ui/input"
import { formatCodeDisplay, normalizeCodeInput } from "../lib"

export function InviteCodeInput({
  value,
  onChange,
  disabled,
  id,
}: {
  value: string
  onChange: (next: string) => void
  disabled?: boolean
  id?: string
}) {
  return (
    <Input
      id={id}
      value={formatCodeDisplay(value)}
      onChange={(event) => onChange(normalizeCodeInput(event.target.value))}
      placeholder="Nhập mã mời"
      autoComplete="off"
      autoCapitalize="characters"
      spellCheck={false}
      inputMode="text"
      maxLength={11}
      disabled={disabled}
      aria-label="Mã cùng nuôi"
      className="text-center font-mono tracking-widest"
    />
  )
}
