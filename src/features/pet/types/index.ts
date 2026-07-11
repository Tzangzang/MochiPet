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

export type FeedOutcome = "fed" | "cooldown" | "dead"

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
