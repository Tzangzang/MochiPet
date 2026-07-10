# 01 — Phạm vi MVP (MVP Scope)

> Tài liệu Phase 1. Chỉ mô tả phạm vi và tiêu chí. Chưa chứa code hay migration.
>
> **Định hướng nền tảng (đã duyệt): WEB-FIRST.** MVP là **ứng dụng web** (Next.js App Router, PWA). Phiên bản **mobile (Expo/React Native) chuyển sang Phase 10 tương lai**, dùng chung backend Supabase và domain logic.

## 1. Mục tiêu sản phẩm

MochiPet là ứng dụng **nuôi thú ảo đồng hành hằng ngày**. Người dùng chọn hoặc ấp trứng để nhận một pet, rồi chăm pet thông qua các hoạt động đời thật: ăn uống, uống nước, học tập, làm việc, ngủ đúng giờ, hoàn thành công việc, chụp ảnh đồ ăn và tương tác với người đồng hành.

Ba trụ cột giá trị:

1. **Đồng hành cảm xúc** — pet phản ứng theo tính cách và chỉ số, tạo cảm giác thật sự đồng hành chứ không phải nhân vật trang trí.
2. **AI food scan** — điểm khác biệt cốt lõi: chụp ảnh đồ ăn thật, AI nhận diện và phân loại, rồi chuyển thành thức ăn phong cách game để pet ăn.
3. **Nuôi chung + thói quen** — co-op hai người cùng chăm một pet, kết hợp reminder và phần thưởng để xây dựng thói quen.

Định hướng: **production-ready nhưng ưu tiên hoàn thành MVP trước**. Không sao chép hình ảnh, thương hiệu, nhân vật hay tài sản trí tuệ của bất kỳ sản phẩm nào.

## 2. Người dùng mục tiêu

| Nhóm | Mô tả | Nhu cầu chính |
|------|-------|---------------|
| Người nuôi solo | Muốn có pet ảo đồng hành hằng ngày | Giải trí, gắn kết cảm xúc, chăm sóc nhẹ nhàng |
| Cặp đôi / bạn thân / người thân | Hai người muốn cùng chăm một pet | Kết nối, chia sẻ hoạt động, streak chung |
| Người xây thói quen | Dùng nhắc việc và phần thưởng game để tạo thói quen | Reminder, động lực, theo dõi tiến độ |

Đặc điểm chung: yêu thích phong cách dễ thương, pastel, thư giãn; truy cập qua **web responsive (mobile-first)**, có thể cài như PWA lên home screen; độ tuổi trải rộng (trẻ và trưởng thành).

## 3. Phạm vi MVP (In scope)

### 3.1 Tài khoản & onboarding
- Đăng ký / đăng nhập bằng Email (Google, Apple thiết kế sẵn interface, có thể bật sau).
- Onboarding: giới thiệu, tên hiển thị, múi giờ, mục tiêu sử dụng, chọn trứng/pet starter, đặt tên pet, xin quyền notification, hướng dẫn hành động đầu tiên.
- Cho phép bỏ qua các bước không bắt buộc.

### 3.2 Hệ thống pet
- Tối thiểu 6 loài (mèo, chó, thỏ, gấu, cáo, rồng nhỏ) + tối thiểu 8 tính cách.
- 7 chỉ số 0–100: hunger, mood, energy, hygiene, affection, health, sleepiness.
- Tính trạng thái theo **lazy calculation** dựa trên timestamp server (không cron mỗi phút).
- Hành động chăm pet: cho ăn, vuốt ve, chơi, dọn phòng, tắm, cho ngủ, đánh thức… với cooldown và thay đổi chỉ số.

### 3.3 Trứng & ấp trứng
- 5 cấp độ hiếm (Common → Secret) với tỉ lệ cấu hình phía backend, hiển thị minh bạch.
- Thời gian ấp tính phía server; tăng tốc bằng chờ / rewarded ad / gem / vật phẩm.
- Kết quả hatch xác định phía server bằng transaction.

### 3.4 AI food scan (tính năng cốt lõi)
- Chụp/chọn ảnh → nén → upload private storage → backend validate → AI Vision → chuẩn hóa vào food taxonomy → màn hình xác nhận → tạo virtual food → feed pet → ghi food history.
- Schema kết quả AI validate bằng Zod; clamp số, map enum, timeout, retry, fallback.
- Fallback thủ công khi confidence thấp: chọn món gợi ý / category / tìm kiếm / "không phải đồ ăn".
- Dùng asset hoạt hình có sẵn theo `visual_asset_key` (chưa generate ảnh mới).

### 3.5 Reminder & habit
- Tạo reminder (uống nước, học, làm việc, ngủ, thức dậy, tập, uống thuốc chỉ nhắc lịch, tùy chỉnh).
- Lặp lịch; in-app reminder + Web Push (sau khi cấp quyền) theo cá tính pet; đánh dấu hoàn thành/bỏ qua/snooze/muộn.
- Phần thưởng có giới hạn mỗi ngày để chống farm; streak.

### 3.6 Co-op hai người
- Mời qua mã / deep link / username. Tối đa 2 caregiver mỗi pet.
- Role Owner và Co-parent với quyền khác nhau.
- Realtime cập nhật trạng thái pet và activity feed.
- Chống double reward bằng transaction / idempotency / optimistic locking.
- Co-op streak dựa trên ít nhất một caregiver hoạt động mỗi ngày.

### 3.7 Game loop cơ bản
- Daily quest (và cấu trúc weekly quest).
- Tối thiểu 2 mini game (tap game, memory card) với reward cap + cooldown.
- Hai loại tiền: coin (kiếm trong game) và gem (hạn chế). Currency thay đổi qua transaction phía server.
- Shop + inventory + mặc cosmetic (chỉ thay đổi ngoại hình, không pay-to-win).
- Rewarded ads dạng mock service (interface sẵn, verify phía server nếu hỗ trợ).

### 3.8 Nền tảng kỹ thuật (web)
- Next.js (App Router) + TypeScript strict + Tailwind CSS + shadcn/ui.
- Domain layer tách riêng (`domain/`) không phụ thuộc browser API, tái sử dụng cho mobile sau.
- Browser API (camera, storage, push/service worker) bọc qua `adapters/`.
- Supabase với RLS cho mọi bảng dữ liệu người dùng.
- Private storage + signed URL cho ảnh đồ ăn.
- Edge Functions cho các thao tác nhạy cảm (hatch, feed, action, reward, currency…).
- Design system (tokens, typography, spacing, radius, shadow, button/card variants, rarity styles).
- PWA: web app manifest + icon placeholder + cài lên home screen.
- Camera web (`MediaDevices.getUserMedia`) + luôn có upload ảnh từ thiết bị.
- In-app reminder + Web Push qua service worker (bật sau khi cấp quyền).

## 4. Ngoài phạm vi MVP (Out of scope — để phase sau)

- **Mobile app (Expo/React Native)** — chuyển sang **Phase 10 tương lai**, dùng chung backend + domain layer; chỉ viết lại UI và adapters cho mobile.
- **AI chat mở rộng**: MVP chỉ dùng dialogue engine theo template; interface AI chat thiết kế sẵn nhưng chưa tích hợp đầy đủ.
- **Payment thật**: RevenueCat / IAP / subscription / ad network thật — chỉ có interface + mock; chưa tích hợp thanh toán thật.
- **Community nâng cao**: chỉ ở mức an toàn (xem pet người khác, like, share card, follow, leaderboard tuần). Chưa có chat tự do giữa người lạ, chưa có marketplace trao đổi item.
- **Image generation** cho food asset (dùng asset có sẵn ở MVP).
- **QR code invite** (để sau; MVP dùng mã / link mời / username).
- **Offline mode nâng cao** của PWA (service worker MVP tập trung cho Web Push; offline caching nâng cao để sau).
- **Dark mode** (thiết kế token hỗ trợ tương lai, chưa bật ở MVP).
- Chuyển quyền sở hữu pet nâng cao, trao đổi item giữa người chơi.

## 5. Tiêu chí hoàn thành MVP (Definition of Done)

MVP hoàn thành khi luồng end-to-end sau chạy được ổn định:

1. Người dùng đăng ký.
2. Chọn một quả trứng.
3. Bắt đầu ấp trứng.
4. Hatch pet.
5. Xem pet tại home room.
6. Vuốt ve và chơi với pet.
7. Chụp ảnh đồ ăn.
8. AI nhận diện **hoặc** cho phép chọn thủ công (fallback).
9. Feed pet, chỉ số cập nhật.
10. Tạo reminder.
11. Nhận notification (in-app; Web Push nếu đã cấp quyền).
12. Hoàn thành reminder, nhận thưởng có giới hạn.
13. Mời một người cùng chăm pet.
14. Người thứ hai tương tác với cùng pet.
15. Dữ liệu đồng bộ realtime giữa hai người.
16. Kiếm coin qua hoạt động/mini game/quest.
17. Mua và mặc một cosmetic item.

### Tiêu chí chất lượng kèm theo
- Không để client tự cộng coin/gem/XP hay đổi rarity — mọi thay đổi giá trị qua server.
- RLS bật cho toàn bộ bảng dữ liệu người dùng.
- Không hard-code secret hoặc business config quan trọng.
- Mọi màn hình có loading / empty / error state và retry phù hợp.
- Có test cho: hatch probability, pet state calculation, currency transaction, co-op concurrency, AI response parser.
- Không đưa AI API key vào client (web hoặc mobile); key chỉ ở Edge Function/secret.
- `domain/` (pet state, hatch, feeding, currency, reminder, co-op) không phụ thuộc browser API để tái sử dụng cho mobile.
