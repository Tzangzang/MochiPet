"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { copyText } from "@/adapters/clipboard"
import {
  useCoParentState,
  useCreateInvitation,
  useRevokeInvitation,
  useRemoveCoParent,
  useLeavePet,
} from "../hooks"
import { formatExpiry } from "../lib"
import type { CreateInvitationResult } from "../types"

function inviteLink(token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  return `${origin}/join/${token}`
}

export function CoParentPanel({ petId }: { petId: string }) {
  const state = useCoParentState(petId)
  const createMutation = useCreateInvitation()
  const revokeMutation = useRevokeInvitation()
  const removeMutation = useRemoveCoParent()
  const leaveMutation = useLeavePet()

  const [created, setCreated] = useState<CreateInvitationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<"link" | "code" | null>(null)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<"remove" | "leave" | null>(null)
  const copyTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current)
    }
  }, [])

  const handleCreate = useCallback(() => {
    if (createMutation.isPending) return
    setError(null)
    createMutation.mutate(petId, {
      onSuccess: (result) => setCreated(result),
      onError: (err) => setError(err.message),
    })
  }, [createMutation, petId])

  const handleRevoke = useCallback(() => {
    if (revokeMutation.isPending) return
    setError(null)
    revokeMutation.mutate(petId, {
      onSuccess: () => setCreated(null),
      onError: (err) => setError(err.message),
    })
  }, [revokeMutation, petId])

  const handleCopy = useCallback(async (label: "link" | "code", value: string) => {
    setCopyError(null)
    const ok = await copyText(value)
    if (!ok) {
      setCopyError("Không sao chép được. Vui lòng thử lại.")
      return
    }
    setCopied(label)
    if (copyTimer.current) window.clearTimeout(copyTimer.current)
    copyTimer.current = window.setTimeout(() => setCopied(null), 1800)
  }, [])

  if (state.isPending || !state.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nuôi cùng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-16 w-full animate-pulse rounded-xl bg-muted" aria-hidden="true" />
        </CardContent>
      </Card>
    )
  }

  const data = state.data

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nuôi cùng</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.viewer_role === "co_parent" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Bạn là <span className="font-medium text-foreground">Người cùng nuôi</span>
              {data.owner_display_name ? ` cùng ${data.owner_display_name}` : ""}.
            </p>
            {confirming === "leave" ? (
              <div className="space-y-2">
                <p className="text-sm">Bạn chắc chắn muốn rời khỏi bé này?</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    onClick={() => leaveMutation.mutate(petId, { onError: (e) => setError(e.message) })}
                    disabled={leaveMutation.isPending}
                    aria-busy={leaveMutation.isPending}
                  >
                    Xác nhận rời
                  </Button>
                  <Button type="button" variant="outline" className="w-full" onClick={() => setConfirming(null)}>
                    Hủy
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="button" variant="outline" className="w-full" onClick={() => setConfirming("leave")}>
                Rời khỏi bé
              </Button>
            )}
          </div>
        ) : data.has_co_parent ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Đang cùng nuôi</span>
              {data.co_parent_display_name ? ` với ${data.co_parent_display_name}` : ""}.
            </p>
            {confirming === "remove" ? (
              <div className="space-y-2">
                <p className="text-sm">Bạn chắc chắn muốn xóa người cùng nuôi?</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    onClick={() => removeMutation.mutate(petId, { onError: (e) => setError(e.message) })}
                    disabled={removeMutation.isPending}
                    aria-busy={removeMutation.isPending}
                  >
                    Xác nhận xóa
                  </Button>
                  <Button type="button" variant="outline" className="w-full" onClick={() => setConfirming(null)}>
                    Hủy
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="button" variant="outline" className="w-full" onClick={() => setConfirming("remove")}>
                Xóa người cùng nuôi
              </Button>
            )}
          </div>
        ) : created ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Chia sẻ liên kết hoặc mã dưới đây. Lời mời {formatExpiry(created.expires_at)}.</p>
            <div className="space-y-2">
              <div className="flex w-full min-w-0 max-w-full items-center gap-2 rounded-lg bg-muted px-3 py-2">
                <span className="line-clamp-2 min-w-0 flex-1 break-all text-xs">
                  {created.invite_token ? inviteLink(created.invite_token) : ""}
                </span>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background text-foreground transition hover:bg-accent active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
                  onClick={() => created.invite_token && handleCopy("link", inviteLink(created.invite_token))}
                  aria-label="Sao chép liên kết mời"
                >
                  {copied === "link" ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                </button>
              </div>
              <div className="flex w-full min-w-0 max-w-full items-center gap-2 rounded-lg bg-muted px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-center font-mono text-lg tracking-widest">
                  {created.invite_code}
                </span>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background text-foreground transition hover:bg-accent active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
                  onClick={() => created.invite_code && handleCopy("code", created.invite_code)}
                  aria-label="Sao chép mã mời"
                >
                  {copied === "code" ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                </button>
              </div>
            </div>
            <p className="min-h-5 text-xs text-muted-foreground" aria-live="polite">
              {copied === "link" ? "Đã sao chép liên kết" : copied === "code" ? "Đã sao chép mã" : ""}
            </p>
            {copyError ? (
              <p className="text-sm text-destructive" role="alert">
                {copyError}
              </p>
            ) : null}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" className="w-full min-w-0" onClick={handleRevoke} disabled={revokeMutation.isPending}>
                Hủy lời mời
              </Button>
              <Button type="button" className="w-full min-w-0" onClick={handleCreate} disabled={createMutation.isPending}>
                Tạo mã mới
              </Button>
            </div>
          </div>
        ) : data.pending_expires_at ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Lời mời đang hoạt động, {formatExpiry(data.pending_expires_at)}. Mã chỉ hiển thị khi vừa tạo.</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" className="w-full min-w-0" onClick={handleRevoke} disabled={revokeMutation.isPending}>
                Hủy lời mời
              </Button>
              <Button type="button" className="w-full min-w-0" onClick={handleCreate} disabled={createMutation.isPending}>
                Tạo mã mới
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" className="w-full" onClick={handleCreate} disabled={createMutation.isPending} aria-busy={createMutation.isPending}>
            {createMutation.isPending ? "Đang tạo…" : "Mời người cùng nuôi"}
          </Button>
        )}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
