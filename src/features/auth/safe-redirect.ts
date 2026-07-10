/**
 * Chỉ chấp nhận internal relative path (bắt đầu bằng đúng một dấu "/").
 * Chống open redirect: từ chối absolute URL, protocol-relative "//", backslash,
 * hay bất kỳ giá trị nào không phải path nội bộ.
 */
export function getSafeNextPath(
  next: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (typeof next !== "string" || next.length === 0) return fallback

  // Phải bắt đầu bằng "/" nhưng KHÔNG phải "//" (protocol-relative) hoặc "/\".
  if (!next.startsWith("/")) return fallback
  if (next.startsWith("//")) return fallback
  if (next.startsWith("/\\")) return fallback

  // Không cho phép backslash.
  if (next.includes("\\")) return fallback

  // Không cho phép ký tự điều khiển (mã < 0x20 hoặc 0x7f).
  for (let i = 0; i < next.length; i++) {
    const code = next.charCodeAt(i)
    if (code < 0x20 || code === 0x7f) return fallback
  }

  return next
}
