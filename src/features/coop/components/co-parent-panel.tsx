"use client"

import { useCallback, useState } from "react"

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
  const [copied, setCopied] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<"remove" | "leave" | null>(null)

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

  const handleCopy = useCallback(async (label: string, value: string) => {
    const ok = await copyText(value)
    setCopied(ok ? label : null)
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
              <p className="break-all rounded-lg bg-muted px-3 py-2 text-xs">{created.invite_token ? inviteLink(created.invite_token) : ""}</p>
              <p className="rounded-lg bg-muted px-3 py-2 text-center font-mono text-lg tracking-widest">{created.invite_code}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => created.invite_token && handleCopy("link", inviteLink(created.invite_token))}
              >
                {copied === "link" ? "Đã sao chép" : "Sao chép liên kết"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => created.invite_code && handleCopy("code", created.invite_code)}
              >
                {copied === "code" ? "Đã sao chép" : "Sao chép mã"}
              </Button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" className="w-full" onClick={handleRevoke} disabled={revokeMutation.isPending}>
                Hủy lời mời
              </Button>
              <Button type="button" className="w-full" onClick={handleCreate} disabled={createMutation.isPending}>
                Tạo mã mới
              </Button>
            </div>
          </div>
        ) : data.pending_expires_at ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Lời mời đang hoạt động, {formatExpiry(data.pending_expires_at)}. Mã chỉ hiển thị khi vừa tạo.</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" className="w-full" onClick={handleRevoke} disabled={revokeMutation.isPending}>
                Hủy lời mời
              </Button>
              <Button type="button" className="w-full" onClick={handleCreate} disabled={createMutation.isPending}>
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
