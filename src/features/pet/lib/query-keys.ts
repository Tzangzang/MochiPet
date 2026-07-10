export const petCoreKeys = {
  all: ["pet-core"] as const,
  state: () => [...petCoreKeys.all, "state"] as const,
}
