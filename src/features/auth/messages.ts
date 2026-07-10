/**
 * Thông báo trạng thái auth an toàn. KHÔNG render chuỗi tùy ý từ URL — chỉ map
 * một tập key cố định sang text đã kiểm soát.
 */
export const AUTH_MESSAGES = {
  confirmed: {
    tone: "success",
    text: "Email đã được xác nhận. Bạn có thể đăng nhập.",
  },
  "signup-check-email": {
    tone: "info",
    text: "Kiểm tra email để xác nhận tài khoản.",
  },
  "signed-out": {
    tone: "info",
    text: "Bạn đã đăng xuất.",
  },
  "auth-error": {
    tone: "error",
    text: "Có lỗi xảy ra khi xác thực. Vui lòng thử lại.",
  },
} as const

export type AuthMessageKey = keyof typeof AUTH_MESSAGES

export function getAuthMessage(
  key: string | string[] | undefined,
): (typeof AUTH_MESSAGES)[AuthMessageKey] | null {
  if (typeof key !== "string") return null
  if (Object.prototype.hasOwnProperty.call(AUTH_MESSAGES, key)) {
    return AUTH_MESSAGES[key as AuthMessageKey]
  }
  return null
}
