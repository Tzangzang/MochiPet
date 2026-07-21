"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getSupabaseBrowserClient } from "@/services/supabase/client"
import { petCoreKeys } from "@/features/pet/lib/query-keys"
import {
  clearIdempotencyKey,
  ensureIdempotencyKey,
} from "@/features/pet/lib/idempotency"
import { toFriendlyError } from "@/features/pet/lib/errors"
import type {
  AcceptInvitationResult,
  CoParentState,
  CreateInvitationResult,
  InvitationPreview,
} from "./types"

export const coopKeys = {
  all: ["coop"] as const,
  coParent: (petId: string) => [...coopKeys.all, "co-parent", petId] as const,
}

function firstRow<T>(data: unknown): T | null {
  if (Array.isArray(data)) return (data[0] as T) ?? null
  return (data as T) ?? null
}

async function callSimple(
  rpc: "revoke_pet_caregiver_invitation" | "remove_pet_co_parent" | "leave_pet_as_co_parent",
  namespace: string,
  petId: string,
): Promise<string> {
  const supabase = getSupabaseBrowserClient()
  const key = ensureIdempotencyKey(namespace)
  const { data, error } = await supabase.rpc(rpc, { p_pet_id: petId, p_idempotency_key: key })
  if (error) {
    const friendly = toFriendlyError(error)
    if (!friendly.keepKey) clearIdempotencyKey(namespace)
    throw new Error(friendly.message)
  }
  clearIdempotencyKey(namespace)
  const row = firstRow<{ outcome: string }>(data)
  return row?.outcome ?? "unknown"
}

export function useCoParentState(petId: string | null) {
  return useQuery<CoParentState | null>({
    queryKey: petId ? coopKeys.coParent(petId) : coopKeys.all,
    enabled: Boolean(petId),
    queryFn: async () => {
      if (!petId) return null
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.rpc("get_pet_coparent_state", { p_pet_id: petId })
      if (error) throw error
      return firstRow<CoParentState>(data)
    },
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  })
}

export function useCreateInvitation() {
  const queryClient = useQueryClient()
  return useMutation<CreateInvitationResult, Error, string>({
    mutationFn: async (petId: string) => {
      const supabase = getSupabaseBrowserClient()
      const namespace = `coop:create:${petId}`
      const key = ensureIdempotencyKey(namespace)
      const { data, error } = await supabase.rpc("create_pet_caregiver_invitation", {
        p_pet_id: petId,
        p_idempotency_key: key,
      })
      if (error) {
        const friendly = toFriendlyError(error)
        if (!friendly.keepKey) clearIdempotencyKey(namespace)
        throw new Error(friendly.message)
      }
      clearIdempotencyKey(namespace)
      const row = firstRow<CreateInvitationResult>(data)
      if (!row) throw new Error("Đã xảy ra lỗi. Vui lòng thử lại.")
      return row
    },
    onSettled: (_data, _error, petId) => {
      void queryClient.invalidateQueries({ queryKey: coopKeys.coParent(petId) })
    },
  })
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, string>({
    mutationFn: (petId: string) => callSimple("revoke_pet_caregiver_invitation", `coop:revoke:${petId}`, petId),
    onSettled: (_data, _error, petId) => {
      void queryClient.invalidateQueries({ queryKey: coopKeys.coParent(petId) })
    },
  })
}

export function useRemoveCoParent() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, string>({
    mutationFn: (petId: string) => callSimple("remove_pet_co_parent", `coop:remove:${petId}`, petId),
    onSettled: (_data, _error, petId) => {
      void queryClient.invalidateQueries({ queryKey: coopKeys.coParent(petId) })
      void queryClient.invalidateQueries({ queryKey: petCoreKeys.state() })
    },
  })
}

export function useLeavePet() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, string>({
    mutationFn: (petId: string) => callSimple("leave_pet_as_co_parent", `coop:leave:${petId}`, petId),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: coopKeys.all })
      void queryClient.invalidateQueries({ queryKey: petCoreKeys.state() })
    },
  })
}

export function usePreviewInvitation() {
  return useMutation<InvitationPreview, Error, { token?: string; code?: string }>({
    mutationFn: async ({ token, code }) => {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.rpc("preview_pet_caregiver_invitation", {
        p_invite_token: token ?? null,
        p_invite_code: code ?? null,
      })
      if (error) throw new Error(toFriendlyError(error).message)
      const row = firstRow<InvitationPreview>(data)
      if (!row) throw new Error("Đã xảy ra lỗi. Vui lòng thử lại.")
      return row
    },
  })
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient()
  return useMutation<AcceptInvitationResult, Error, { token?: string; code?: string }>({
    mutationFn: async ({ token, code }) => {
      const supabase = getSupabaseBrowserClient()
      const namespace = `coop:accept:${token ?? code ?? ""}`
      const key = ensureIdempotencyKey(namespace)
      const { data, error } = await supabase.rpc("accept_pet_caregiver_invitation", {
        p_invite_token: token ?? null,
        p_invite_code: code ?? null,
        p_idempotency_key: key,
      })
      if (error) {
        const friendly = toFriendlyError(error)
        if (!friendly.keepKey) clearIdempotencyKey(namespace)
        throw new Error(friendly.message)
      }
      clearIdempotencyKey(namespace)
      const row = firstRow<AcceptInvitationResult>(data)
      if (!row) throw new Error("Đã xảy ra lỗi. Vui lòng thử lại.")
      return row
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: petCoreKeys.state() })
      void queryClient.invalidateQueries({ queryKey: coopKeys.all })
    },
  })
}
