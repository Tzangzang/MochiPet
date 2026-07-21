const PREFIX = "mochipet:idem:"

function safeSession(): Storage | null {
  if (typeof window === "undefined") return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function ensureIdempotencyKey(namespace: string): string {
  const store = safeSession()
  const storageKey = PREFIX + namespace
  if (store) {
    const existing = store.getItem(storageKey)
    if (existing) return existing
    const created = crypto.randomUUID()
    store.setItem(storageKey, created)
    return created
  }
  return crypto.randomUUID()
}

export function clearIdempotencyKey(namespace: string): void {
  const store = safeSession()
  if (store) store.removeItem(PREFIX + namespace)
}

export const idempotencyNamespace = {
  createEgg: (): string => "create_egg",
  startIncubation: (eggId: string): string => `start_incubation:${eggId}`,
  hatch: (eggId: string): string => `hatch:${eggId}`,
  feedPet: (petId: string): string => `feed_pet:${petId}`,
  cleanWaste: (wasteId: string): string => `clean_pet_waste:${wasteId}`,
  startSleep: (petId: string): string => `start_pet_sleep:${petId}`,
  wakePet: (petId: string): string => `wake_pet:${petId}`,
}
