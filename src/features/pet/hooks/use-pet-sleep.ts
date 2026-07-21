"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { getSupabaseBrowserClient } from "@/services/supabase/client"
import { getClientTimeZone } from "@/adapters/timezone"
import { petCoreKeys } from "../lib/query-keys"
import {
  clearIdempotencyKey,
  ensureIdempotencyKey,
  idempotencyNamespace,
} from "../lib/idempotency"
import { toFriendlyError } from "../lib/errors"
import type { SleepResult } from "../types"

function firstRow<T>(data: unknown): T | null {
  if (Array.isArray(data)) return (data[0] as T) ?? null
  return (data as T) ?? null
}

async function callSleep(
  rpc: "start_pet_sleep" | "wake_pet",
  namespace: string,
  petId: string,
): Promise<SleepResult> {
  const supabase = getSupabaseBrowserClient()
  const key = ensureIdempotencyKey(namespace)
  const { data, error } = await supabase.rpc(rpc, {
    p_pet_id: petId,
    p_client_tz: getClientTimeZone(),
    p_idempotency_key: key,
  })
  if (error) {
    const friendly = toFriendlyError(error)
    if (!friendly.keepKey) clearIdempotencyKey(namespace)
    throw new Error(friendly.message)
  }
  clearIdempotencyKey(namespace)
  const row = firstRow<SleepResult>(data)
  if (!row) throw new Error("Đã xảy ra lỗi. Vui lòng thử lại.")
  return row
}

export function usePetSleep() {
  const queryClient = useQueryClient()
  return useMutation<SleepResult, Error, { petId: string; action: "start" | "wake" }>({
    mutationFn: async ({ petId, action }) => {
      if (action === "start") {
        return callSleep("start_pet_sleep", idempotencyNamespace.startSleep(petId), petId)
      }
      return callSleep("wake_pet", idempotencyNamespace.wakePet(petId), petId)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: petCoreKeys.state() })
    },
  })
}
