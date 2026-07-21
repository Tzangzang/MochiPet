export function getClientTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (typeof tz === "string" && tz.length > 0) return tz
  } catch {
    return "UTC"
  }
  return "UTC"
}
