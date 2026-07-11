export type FriendlyError = {
  message: string
  keepKey: boolean
}

function extractMessage(error: unknown): string {
  if (!error) return ""
  if (typeof error === "string") return error
  if (typeof error === "object") {
    const candidate = error as { message?: unknown }
    if (typeof candidate.message === "string") return candidate.message
  }
  return ""
}

export function toFriendlyError(error: unknown): FriendlyError {
  const raw = extractMessage(error).toLowerCase()

  if (!raw || raw.includes("failed to fetch") || raw.includes("network") || raw.includes("fetch")) {
    return { message: "Mất kết nối. Vui lòng kiểm tra mạng và thử lại.", keepKey: true }
  }
  if (raw.includes("authentication required") || raw.includes("not authenticated") || raw.includes("jwt")) {
    return { message: "Bạn cần đăng nhập để tiếp tục.", keepKey: false }
  }
  if (raw.includes("already has an active egg")) {
    return { message: "Bạn đã có một quả trứng đang hoạt động.", keepKey: false }
  }
  if (raw.includes("not ready to hatch")) {
    return { message: "Trứng chưa đủ thời gian nở. Vui lòng thử lại sau vài giây.", keepKey: true }
  }
  if (raw.includes("not a caregiver")) {
    return { message: "Bạn không có quyền chăm sóc bé này.", keepKey: false }
  }
  if (
    raw.includes("different species") ||
    raw.includes("different egg") ||
    raw.includes("different input") ||
    raw.includes("different pet")
  ) {
    return { message: "Thao tác đã được dùng với thông tin khác. Vui lòng thử lại.", keepKey: false }
  }
  if (raw.includes("cannot be incubated") || raw.includes("not incubating") || raw.includes("already hatched")) {
    return { message: "Không thể thực hiện: trứng đã được xử lý.", keepKey: false }
  }
  if (
    raw.includes("egg not found") ||
    raw.includes("species not found") ||
    raw.includes("pet not found") ||
    raw.includes("no_data")
  ) {
    return { message: "Không tìm thấy dữ liệu phù hợp. Vui lòng tải lại trang.", keepKey: false }
  }
  if (raw.includes("invalid pet name")) {
    return { message: "Tên pet không hợp lệ.", keepKey: false }
  }
  return { message: "Đã xảy ra lỗi. Vui lòng thử lại.", keepKey: false }
}
