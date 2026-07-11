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
import type { FeedPetResult } from "../types"

function firstRow<T>(data: unknown): T | null {
  if (Array.isArray(data)) return (data[0] as T) ?? null
  return (data as T) ?? null
}

export function useFeedPet() {
  const queryClient = useQueryClient()
  return useMutation<FeedPetResult, Error, string>({
    mutationFn: async (petId: string) => {
      const supabase = getSupabaseBrowserClient()
      const namespace = idempotencyNamespace.feedPet(petId)
      const key = ensureIdempotencyKey(namespace)
      const { data, error } = await supabase.rpc("feed_pet", {
        p_pet_id: petId,
        p_idempotency_key: key,
      })
      if (error) {
        const friendly = toFriendlyError(error)
        if (!friendly.keepKey) clearIdempotencyKey(namespace)
        throw new Error(friendly.message)
      }
      clearIdempotencyKey(namespace)
      const row = firstRow<FeedPetResult>(data)
      if (!row) throw new Error("Đã xảy ra lỗi. Vui lòng thử lại.")
      return row
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: petCoreKeys.state() })
    },
  })
}
