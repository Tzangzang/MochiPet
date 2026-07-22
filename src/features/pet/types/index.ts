export type CaregiverRole = "owner" | "co_parent"

export type EggStatus = "unhatched" | "incubating" | "hatched" | "cancelled"

export type PetStatus = "active" | "dead"

export type HungerState =
  | "normal"
  | "hungry"
  | "very_hungry"
  | "weak"
  | "critical"
  | "dead"

export type PetFeedState = {
  hunger_state: HungerState
  server_now: string
  can_feed: boolean
  next_feed_at: string
  next_state_at: string | null
}

export type PetVisualState =
  | "idle"
  | "hover_happy"
  | "scratch_happy"
  | "normal"
  | "hungry"
  | "very_hungry"
  | "weak"
  | "critical"
  | "dead"

export type PetSpecies = {
  code: string
  display_name: string
  asset_key: string
}

export type CurrentEgg = {
  id: string
  status: EggStatus
  hatch_started_at: string | null
  hatches_at: string | null
  created_at: string
  species: PetSpecies | null
}

export type WasteEntity = {
  id: string
  available_at: string
  pos_seed: number
}

export type PetLifecycle = {
  game_tz: string | null
  pending_game_tz: string | null
  meal_count_today: number
  meals_required: number
  health: number
  hygiene: number
  is_refusing_food: boolean
  refusing_food_days: number
  sleep_debt_days: number
  is_sleeping: boolean
  current_sleep_started_at: string | null
  sleep_seconds_today: number
  required_sleep_seconds: number
  waste: WasteEntity[]
}

export type PetVariant = {
  id: string
  code: string
  display_name: string
  image_path: string
  rarity: string
  rarity_label: string
}

export type CurrentPet = {
  id: string
  egg_id: string | null
  name: string
  status: PetStatus
  last_fed_at: string
  died_at: string | null
  state_version: number
  species: PetSpecies | null
  caregiver_role: CaregiverRole
  feed: PetFeedState | null
  lifecycle: PetLifecycle | null
  variant: PetVariant | null
}

export type PetCoreViewState =
  | "empty"
  | "egg_unhatched"
  | "egg_incubating"
  | "pet"

export type PetCoreData = {
  viewState: PetCoreViewState
  pet: CurrentPet | null
  egg: CurrentEgg | null
}

export type FeedOutcome = "fed" | "cooldown" | "dead" | "refusing_food" | "needs_timezone"

export type FeedPetResult = {
  pet_id: string
  status: PetStatus
  hunger_state: HungerState
  last_fed_at: string
  died_at: string | null
  state_version: number | string
  server_now: string
  can_feed: boolean
  next_feed_at: string
  next_state_at: string | null
  outcome: FeedOutcome
  meal_count_today: number | string
  meals_required: number | string
  waste_available_at: string | null
}

export type CleanWasteOutcome = "cleaned" | "already_cleaned"

export type CleanWasteResult = {
  waste_id: string
  outcome: CleanWasteOutcome
  hygiene: number | string
  state_version: number | string
  server_now: string
}

export type SleepOutcome = "sleeping" | "already_sleeping" | "awake" | "not_sleeping" | "dead"

export type SleepResult = {
  outcome: SleepOutcome
  is_sleeping: boolean
  state_version: number | string
  server_now: string
}

export type CreateEggResult = {
  egg_id: string
  species_code: string
  status: string
  created_at: string
  replayed: boolean
}

export type StartIncubationResult = {
  egg_id: string
  status: string
  hatch_started_at: string
  hatches_at: string
  replayed: boolean
}

export type HatchEggResult = {
  egg_id: string
  pet_id: string
  pet_name: string
  species_code: string
  pet_status: string
  hatched_at: string
  replayed: boolean
}
