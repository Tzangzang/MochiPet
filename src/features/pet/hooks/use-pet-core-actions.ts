"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { getSupabaseBrowserClient } from "@/services/supabase/client"
import { petCoreKeys } from "../lib/query-keys"
import {
  clearIdempotencyKey,
  ensureIdempotencyKey,
  idempotencyNamespace,
} from "../lib/idempotency"
import { toFriendlyError } from "../lib/errors"
import type {
  CreateEggResult,
  HatchEggResult,
  StartIncubationResult,
} from "../types"

function firstRow<T>(data: unknown): T | null {
  if (Array.isArray(data)) return (data[0] as T) ?? null
  return (data as T) ?? null
}

export function useCreateEgg() {
  const queryClient = useQueryClient()
  return useMutation<CreateEggResult>({
    mutationFn: async () => {
      const supabase = getSupabaseBrowserClient()
      const namespace = idempotencyNamespace.createEgg()
      const key = ensureIdempotencyKey(namespace)
      const { data, error } = await supabase.rpc("create_egg", {
        p_species_code: "starter_mochi",
        p_idempotency_key: key,
      })
      if (error) {
        const friendly = toFriendlyError(error)
        if (!friendly.keepKey) clearIdempotencyKey(namespace)
        throw new Error(friendly.message)
      }
      clearIdempotencyKey(namespace)
      const row = firstRow<CreateEggResult>(data)
      if (!row) throw new Error("Đã xảy ra lỗi. Vui lòng thử lại.")
      return row
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: petCoreKeys.state() })
    },
  })
}

export function useStartIncubation(eggId: string) {
  const queryClient = useQueryClient()
  return useMutation<StartIncubationResult>({
    mutationFn: async () => {
      const supabase = getSupabaseBrowserClient()
      const namespace = idempotencyNamespace.startIncubation(eggId)
      const key = ensureIdempotencyKey(namespace)
      const { data, error } = await supabase.rpc("start_egg_incubation", {
        p_egg_id: eggId,
        p_idempotency_key: key,
      })
      if (error) {
        const friendly = toFriendlyError(error)
        if (!friendly.keepKey) clearIdempotencyKey(namespace)
        throw new Error(friendly.message)
      }
      clearIdempotencyKey(namespace)
      const row = firstRow<StartIncubationResult>(data)
      if (!row) throw new Error("Đã xảy ra lỗi. Vui lòng thử lại.")
      return row
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: petCoreKeys.state() })
    },
  })
}

export function useHatchEgg(eggId: string) {
  const queryClient = useQueryClient()
  return useMutation<HatchEggResult, Error, string>({
    mutationFn: async (petName: string) => {
      const supabase = getSupabaseBrowserClient()
      const namespace = idempotencyNamespace.hatch(eggId)
      const key = ensureIdempotencyKey(namespace)
      const { data, error } = await supabase.rpc("hatch_egg", {
        p_egg_id: eggId,
        p_pet_name: petName,
        p_idempotency_key: key,
      })
      if (error) {
        const friendly = toFriendlyError(error)
        if (!friendly.keepKey) clearIdempotencyKey(namespace)
        throw new Error(friendly.message)
      }
      clearIdempotencyKey(namespace)
      const row = firstRow<HatchEggResult>(data)
      if (!row) throw new Error("Đã xảy ra lỗi. Vui lòng thử lại.")
      return row
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: petCoreKeys.state() })
    },
  })
}
