export function normalizeCodeInput(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10)
}

export function formatCodeDisplay(value: string): string {
  const norm = normalizeCodeInput(value)
  if (norm.length <= 5) return norm
  return `${norm.slice(0, 5)}-${norm.slice(5)}`
}

export function isCompleteCode(value: string): boolean {
  return normalizeCodeInput(value).length === 10
}

export function formatExpiry(iso: string | null): string {
  if (!iso) return ""
  const target = Date.parse(iso)
  if (Number.isNaN(target)) return ""
  const diffMinutes = Math.round((target - Date.now()) / 60000)
  if (diffMinutes <= 0) return "đã hết hạn"
  if (diffMinutes < 60) return `còn ${diffMinutes} phút`
  const hours = Math.round(diffMinutes / 60)
  return `còn khoảng ${hours} giờ`
}

export const PREVIEW_MESSAGE: Record<string, string> = {
  expired: "Lời mời đã hết hạn.",
  revoked: "Lời mời đã bị hủy.",
  used: "Lời mời đã được sử dụng.",
  invalid: "Mã hoặc liên kết không hợp lệ.",
  rate_limited: "Bạn đã thử quá nhiều lần. Vui lòng đợi ít phút rồi thử lại.",
  pet_unavailable: "Bé hiện không thể nhận thêm người cùng nuôi.",
}

export const ACCEPT_MESSAGE: Record<string, string> = {
  used: "Lời mời đã được sử dụng.",
  revoked: "Lời mời đã bị hủy.",
  expired: "Lời mời đã hết hạn.",
  invalid: "Mã hoặc liên kết không hợp lệ.",
  rate_limited: "Bạn đã thử quá nhiều lần. Vui lòng đợi ít phút rồi thử lại.",
  self_owner: "Bạn là chủ nuôi của bé này.",
  already_caregiver: "Bạn đã là người chăm sóc bé này.",
  pet_full: "Bé đã có đủ người cùng nuôi.",
  pet_unavailable: "Bé hiện không thể nhận thêm người cùng nuôi.",
}
