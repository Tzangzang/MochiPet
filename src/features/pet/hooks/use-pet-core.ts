"use client"

import { useQuery } from "@tanstack/react-query"

import { getSupabaseBrowserClient } from "@/services/supabase/client"
import { petCoreKeys } from "../lib/query-keys"
import type {
  CaregiverRole,
  CurrentEgg,
  CurrentPet,
  EggStatus,
  HungerState,
  PetCoreData,
  PetFeedState,
  PetSpecies,
  PetStatus,
} from "../types"

type RawFeedRow = {
  status: PetStatus
  died_at: string | null
  state_version: number | string
  hunger_state: HungerState
  server_now: string
  can_feed: boolean
  next_feed_at: string
  next_state_at: string | null
}

function firstFeedRow(data: unknown): RawFeedRow | null {
  const row = Array.isArray(data) ? (data[0] as RawFeedRow | undefined) : (data as RawFeedRow | null)
  return row ?? null
}

function toFeedState(row: RawFeedRow): PetFeedState {
  return {
    hunger_state: row.hunger_state,
    server_now: row.server_now,
    can_feed: row.can_feed,
    next_feed_at: row.next_feed_at,
    next_state_at: row.next_state_at,
  }
}

type RawSpecies = {
  code: string
  display_name: string
  asset_key: string
}

type RawPet = {
  id: string
  egg_id: string | null
  name: string
  status: PetStatus
  last_fed_at: string
  died_at: string | null
  state_version: number | string
  species: RawSpecies | RawSpecies[] | null
}

type RawCaregiver = {
  role: CaregiverRole
  pet: RawPet | RawPet[] | null
}

type RawEgg = {
  id: string
  status: EggStatus
  hatch_started_at: string | null
  hatches_at: string | null
  created_at: string
  species: RawSpecies | RawSpecies[] | null
}

function firstOf<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

function toSpecies(value: RawSpecies | RawSpecies[] | null): PetSpecies | null {
  const s = firstOf(value)
  if (!s) return null
  return { code: s.code, display_name: s.display_name, asset_key: s.asset_key }
}

export function usePetCore() {
  return useQuery<PetCoreData>({
    queryKey: petCoreKeys.state(),
    queryFn: async () => {
      const supabase = getSupabaseBrowserClient()

      const { data: userData, error: userError } = await supabase.auth.getUser()
      const uid = userData.user?.id
      if (userError || !uid) throw new Error("authentication required")

      const caregiverResponse = await supabase
        .from("pet_caregivers")
        .select(
          "role, pet:pets(id, egg_id, name, status, last_fed_at, died_at, state_version, species:pet_species(code, display_name, asset_key))",
        )
        .eq("user_id", uid)
        .eq("status", "active")
        .limit(1)
        .maybeSingle()
      if (caregiverResponse.error) throw caregiverResponse.error

      const caregiver = caregiverResponse.data as unknown as RawCaregiver | null
      const rawPet = caregiver ? firstOf(caregiver.pet) : null
      if (caregiver && rawPet) {
        const feedResponse = await supabase.rpc("get_pet_feed_state", {
          p_pet_id: rawPet.id,
        })
        const feedRow = feedResponse.error ? null : firstFeedRow(feedResponse.data)
        const pet: CurrentPet = {
          id: rawPet.id,
          egg_id: rawPet.egg_id,
          name: rawPet.name,
          status: feedRow ? feedRow.status : rawPet.status,
          last_fed_at: rawPet.last_fed_at,
          died_at: feedRow ? feedRow.died_at : rawPet.died_at,
          state_version: feedRow ? Number(feedRow.state_version) : Number(rawPet.state_version),
          species: toSpecies(rawPet.species),
          caregiver_role: caregiver.role,
          feed: feedRow ? toFeedState(feedRow) : null,
        }
        return { viewState: "pet", pet, egg: null }
      }

      const eggResponse = await supabase
        .from("eggs")
        .select(
          "id, status, hatch_started_at, hatches_at, created_at, species:pet_species(code, display_name, asset_key)",
        )
        .eq("owner_user_id", uid)
        .in("status", ["unhatched", "incubating"])
        .limit(1)
        .maybeSingle()
      if (eggResponse.error) throw eggResponse.error

      const rawEgg = eggResponse.data as unknown as RawEgg | null
      if (rawEgg) {
        const egg: CurrentEgg = {
          id: rawEgg.id,
          status: rawEgg.status,
          hatch_started_at: rawEgg.hatch_started_at,
          hatches_at: rawEgg.hatches_at,
          created_at: rawEgg.created_at,
          species: toSpecies(rawEgg.species),
        }
        return {
          viewState: egg.status === "incubating" ? "egg_incubating" : "egg_unhatched",
          pet: null,
          egg,
        }
      }

      return { viewState: "empty", pet: null, egg: null }
    },
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  })
}
