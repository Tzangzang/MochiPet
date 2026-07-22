"use client"

import { useQuery } from "@tanstack/react-query"

import { getSupabaseBrowserClient } from "@/services/supabase/client"
import { getClientTimeZone } from "@/adapters/timezone"
import { petCoreKeys } from "../lib/query-keys"
import type {
  CaregiverRole,
  CurrentEgg,
  CurrentPet,
  EggStatus,
  HungerState,
  PetCoreData,
  PetLifecycle,
  PetSpecies,
  PetStatus,
  WasteEntity,
} from "../types"

type RawRoomRow = {
  status: PetStatus
  hunger_state: HungerState
  last_fed_at: string
  died_at: string | null
  state_version: number | string
  server_now: string
  can_feed: boolean
  next_feed_at: string
  next_state_at: string | null
  game_tz: string | null
  pending_game_tz: string | null
  meal_count_today: number | string
  meals_required: number | string
  health: number | string
  hygiene: number | string
  is_refusing_food: boolean
  refusing_food_days: number | string
  sleep_debt_days: number | string
  is_sleeping: boolean
  current_sleep_started_at: string | null
  sleep_seconds_today: number | string
  required_sleep_seconds: number | string
  waste: WasteEntity[] | null
  variant_id: string | null
  variant_code: string | null
  variant_display_name: string | null
  variant_image_path: string | null
  variant_rarity: string | null
  variant_rarity_label: string | null
}

function firstRoomRow(data: unknown): RawRoomRow | null {
  const row = Array.isArray(data) ? (data[0] as RawRoomRow | undefined) : (data as RawRoomRow | null)
  return row ?? null
}

function toLifecycle(row: RawRoomRow): PetLifecycle {
  return {
    game_tz: row.game_tz,
    pending_game_tz: row.pending_game_tz,
    meal_count_today: Number(row.meal_count_today),
    meals_required: Number(row.meals_required),
    health: Number(row.health),
    hygiene: Number(row.hygiene),
    is_refusing_food: row.is_refusing_food,
    refusing_food_days: Number(row.refusing_food_days),
    sleep_debt_days: Number(row.sleep_debt_days),
    is_sleeping: row.is_sleeping,
    current_sleep_started_at: row.current_sleep_started_at,
    sleep_seconds_today: Number(row.sleep_seconds_today),
    required_sleep_seconds: Number(row.required_sleep_seconds),
    waste: Array.isArray(row.waste) ? row.waste : [],
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
        const roomResponse = await supabase.rpc("get_pet_room_state", {
          p_pet_id: rawPet.id,
          p_client_tz: getClientTimeZone(),
        })
        const room = roomResponse.error ? null : firstRoomRow(roomResponse.data)
        const pet: CurrentPet = {
          id: rawPet.id,
          egg_id: rawPet.egg_id,
          name: rawPet.name,
          status: room ? room.status : rawPet.status,
          last_fed_at: room ? room.last_fed_at : rawPet.last_fed_at,
          died_at: room ? room.died_at : rawPet.died_at,
          state_version: room ? Number(room.state_version) : Number(rawPet.state_version),
          species: toSpecies(rawPet.species),
          caregiver_role: caregiver.role,
          feed: room
            ? {
                hunger_state: room.hunger_state,
                server_now: room.server_now,
                can_feed: room.can_feed,
                next_feed_at: room.next_feed_at,
                next_state_at: room.next_state_at,
              }
            : null,
          lifecycle: room ? toLifecycle(room) : null,
          variant:
            room && room.variant_id && room.variant_code && room.variant_image_path
              ? {
                  id: room.variant_id,
                  code: room.variant_code,
                  display_name: room.variant_display_name ?? room.variant_code,
                  image_path: room.variant_image_path,
                  rarity: room.variant_rarity ?? "",
                  rarity_label: room.variant_rarity_label ?? "",
                }
              : null,
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
