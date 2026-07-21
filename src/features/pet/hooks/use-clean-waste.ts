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
import type { CleanWasteResult } from "../types"

function firstRow<T>(data: unknown): T | null {
  if (Array.isArray(data)) return (data[0] as T) ?? null
  return (data as T) ?? null
}

export function useCleanWaste() {
  const queryClient = useQueryClient()
  return useMutation<CleanWasteResult, Error, { petId: string; wasteId: string }>({
    mutationFn: async ({ petId, wasteId }) => {
      const supabase = getSupabaseBrowserClient()
      const namespace = idempotencyNamespace.cleanWaste(wasteId)
      const key = ensureIdempotencyKey(namespace)
      const { data, error } = await supabase.rpc("clean_pet_waste", {
        p_pet_id: petId,
        p_waste_id: wasteId,
        p_idempotency_key: key,
      })
      if (error) {
        const friendly = toFriendlyError(error)
        if (!friendly.keepKey) clearIdempotencyKey(namespace)
        throw new Error(friendly.message)
      }
      clearIdempotencyKey(namespace)
      const row = firstRow<CleanWasteResult>(data)
      if (!row) throw new Error("Đã xảy ra lỗi. Vui lòng thử lại.")
      return row
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: petCoreKeys.state() })
    },
  })
}
