# Stores (Zustand)

Zustand chỉ dùng cho **client / UI state** — thứ chỉ tồn tại ở trình duyệt và
không phải nguồn sự thật của server. Ví dụ: trạng thái modal/drawer, bước hiện
tại trong onboarding, bộ lọc UI tạm thời, trạng thái nháp của form phức tạp.

## Quy tắc

- **Server state phải dùng TanStack Query**, không lưu trong Zustand. Dữ liệu
  từ Supabase (pet, egg, currency, reminder, co-op…) được fetch/cache bằng
  TanStack Query để có loading/error/refetch/invalidation nhất quán.
- **Không lưu Supabase session trong Zustand.** Session do Supabase Auth quản
  lý; đọc qua Supabase client / SSR adapter khi cần.
- **Không nhân bản dữ liệu database vào Zustand.** Tránh trùng lặp nguồn dữ
  liệu gây lệch trạng thái; chỉ giữ ở Zustand phần state thuần UI.
- Business logic không đặt trong store — đặt trong `src/domain/` (thuần, tái
  sử dụng cho mobile sau này).
