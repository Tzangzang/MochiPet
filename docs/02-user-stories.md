# 02 — User Stories & Acceptance Criteria

> Ưu tiên theo MoSCoW: **M** = Must have (bắt buộc MVP), **S** = Should have, **C** = Could have.
> ID dạng `US-<domain>-<số>`.
> **Nền tảng: WEB-FIRST** (Next.js/PWA). "App" trong các story hiểu là ứng dụng web; camera là camera web (`getUserMedia`) luôn kèm upload ảnh; notification là in-app + Web Push. Mobile (Expo) ở Phase 10 tái sử dụng các story này qua domain layer chung.

## Auth & Onboarding

### US-AUTH-01 (M) — Đăng ký / đăng nhập
Là người dùng mới, tôi muốn tạo tài khoản để dữ liệu pet được lưu và đồng bộ.
- **AC1**: Đăng ký/đăng nhập bằng email thành công tạo `profiles` tương ứng.
- **AC2**: Email/password không hợp lệ hiển thị lỗi rõ ràng, không lộ chi tiết hệ thống.
- **AC3**: Google/Apple login có interface sẵn (có thể ẩn nếu chưa cấu hình provider).
- **AC4**: Phiên đăng nhập được giữ; mở lại app không phải đăng nhập lại.

### US-ONB-01 (M) — Onboarding lần đầu
Là người dùng mới, tôi muốn được hướng dẫn thiết lập ban đầu.
- **AC1**: Các bước gồm giới thiệu → tên hiển thị → múi giờ → mục tiêu → chọn trứng/pet → đặt tên pet → quyền notification → hành động đầu tiên.
- **AC2**: Bước không bắt buộc có thể bỏ qua; bước bắt buộc (tài khoản, chọn pet, đặt tên) không thể bỏ qua.
- **AC3**: Hoàn thành onboarding phát event `onboarding_completed` và đưa vào home room.
- **AC4**: Thoát giữa chừng và quay lại tiếp tục đúng bước dang dở.

### US-ONB-02 (S) — Chọn mục tiêu sử dụng
Là người dùng, tôi muốn chọn mục tiêu (giải trí / thói quen / nuôi chung / theo dõi ăn uống) để app gợi ý phù hợp.
- **AC1**: Lưu lựa chọn vào `user_settings`.
- **AC2**: Có thể chọn nhiều mục tiêu; có thể đổi lại trong Settings.

## Pet core

### US-EGG-01 (M) — Chọn và ấp trứng
Là người dùng, tôi muốn chọn một quả trứng và bắt đầu ấp.
- **AC1**: Tỉ lệ hiếm hiển thị minh bạch trước khi ấp, lấy từ config backend.
- **AC2**: Thời gian ấp tính phía server; đổi giờ thiết bị không rút ngắn thời gian.
- **AC3**: Trạng thái ấp hiển thị đếm ngược realtime.

### US-EGG-02 (M) — Hatch trứng
Là người dùng, tôi muốn nở trứng để nhận pet.
- **AC1**: Kết quả (loài, màu, rarity, tính cách, chỉ số khởi điểm) do server quyết định bằng transaction.
- **AC2**: Không thể reroll hoặc tạo pet trùng bằng gọi lặp (idempotency).
- **AC3**: Hatch xong tạo bản ghi `pets` + snapshot chỉ số, phát event `egg_hatched`.

### US-EGG-03 (S) — Tăng tốc ấp
Là người dùng, tôi muốn giảm thời gian ấp.
- **AC1**: Có thể tăng tốc bằng rewarded ad (mock), gem, hoặc vật phẩm.
- **AC2**: Rewarded ad tối đa 10 lần/ngày, đếm phía server, không chỉ local.
- **AC3**: Mỗi lần tăng tốc giảm đúng khoảng thời gian theo config.

### US-PET-01 (M) — Xem pet ở home room
Là người dùng, tôi muốn thấy pet và trạng thái ở màn hình chính.
- **AC1**: Hiển thị pet trung tâm, mood/biểu cảm, hunger, energy, hành động nhanh, reminder gần nhất, coin/gem, quest progress, co-parent status.
- **AC2**: Chỉ số tính lazy từ snapshot + thời gian trôi qua, đồng nhất với server.

### US-PET-02 (M) — Chăm pet
Là người dùng, tôi muốn thực hiện hành động chăm pet.
- **AC1**: Mỗi hành động có cooldown; spam bị chặn.
- **AC2**: Hành động cập nhật chỉ số, ghi `pet_action_logs`, trả phản hồi/animation.
- **AC3**: Vuốt ve và cho ăn hoạt động ngay từ hành động đầu tiên của onboarding.
- **AC4**: Có optimistic update; rollback khi server từ chối.

### US-PET-03 (C) — Trò chuyện với pet (template)
Là người dùng, tôi muốn pet nói chuyện theo tính cách.
- **AC1**: Câu thoại chọn từ template theo tính cách, chỉ số, thời gian, hoạt động gần đây.
- **AC2**: Ghi `pet_dialogue_logs`; không dùng AI chat thật ở MVP.

## AI Food Scan

### US-FOOD-01 (M) — Chụp ảnh đồ ăn
Là người dùng, tôi muốn chụp/chọn ảnh đồ ăn để feed pet.
- **AC1**: Ảnh được nén/resize phía client trước khi upload.
- **AC2**: Upload vào private bucket; truy cập qua signed URL có thời hạn.
- **AC3**: Backend validate MIME, kích thước, định dạng trước khi gọi AI.

### US-FOOD-02 (M) — Nhận diện AI
Là người dùng, tôi muốn AI nhận diện món ăn.
- **AC1**: Kết quả AI parse an toàn theo schema Zod; clamp số; map category vào enum.
- **AC2**: Có timeout và retry giới hạn; AI lỗi vẫn không chặn luồng feed.
- **AC3**: Phát `food_scan_started` và `food_scan_succeeded`/`food_scan_failed`.

### US-FOOD-03 (M) — Xác nhận / fallback thủ công
Là người dùng, tôi muốn xác nhận hoặc chọn lại món khi AI không chắc.
- **AC1**: Confidence < ngưỡng config → hiển thị màn hình chọn thủ công (gợi ý / category / tìm kiếm / "không phải đồ ăn").
- **AC2**: Người dùng có thể chấp nhận, đổi món, hoặc chọn nhóm gần đúng.
- **AC3**: Sửa kết quả phát `food_scan_corrected`.

### US-FOOD-04 (M) — Feed pet bằng virtual food
Là người dùng, tôi muốn pet ăn món vừa nhận diện.
- **AC1**: Tạo `virtual_food_items` với `visual_asset_key` hợp lệ.
- **AC2**: Feed cập nhật chỉ số theo food category, ghi `pet_feeding_logs`, phát `pet_fed`.
- **AC3**: Health score hiển thị kèm ghi chú "chỉ là cơ chế gameplay, không phải tư vấn y tế".

## Reminder & Habit

### US-REM-01 (M) — Tạo reminder
Là người dùng, tôi muốn tạo nhắc việc.
- **AC1**: Reminder gồm tiêu đề, nội dung, icon, thời gian, múi giờ, ngày lặp, bật/tắt, riêng/chung, phần thưởng, snooze, loại notification.
- **AC2**: Reminder uống thuốc chỉ nhắc lịch, không có liều lượng/chỉ định y tế.
- **AC3**: Phát `reminder_created`.

### US-REM-02 (M) — Nhận notification & hoàn thành
Là người dùng, tôi muốn được nhắc và đánh dấu hoàn thành.
- **AC1**: In-app reminder luôn hiển thị đúng giờ theo múi giờ (không phụ thuộc timer trong tab); nếu đã cấp quyền thì gửi thêm Web Push qua service worker. Nội dung theo cá tính pet.
- **AC2**: Có thể hoàn thành / bỏ qua / snooze / hoàn thành muộn.
- **AC3**: Hoàn thành trao thưởng (coin/XP/mood/affection/streak) trong giới hạn ngày; phát `reminder_completed`.
- **AC4**: Tạo reminder giả để farm bị chặn bởi reward cap.
- **AC5**: Notification đi qua `NotificationProvider` (adapter) để mobile push thay được mà không sửa domain logic.

## Co-op

### US-COOP-01 (M) — Mời co-parent
Là owner, tôi muốn mời một người cùng chăm pet.
- **AC1**: Tạo mã mời / link mời web (deep link) / mời bằng username.
- **AC2**: Một pet tối đa 2 caregiver.
- **AC3**: Phát `coop_invite_sent`.

### US-COOP-02 (M) — Chấp nhận lời mời
Là người được mời, tôi muốn tham gia chăm pet.
- **AC1**: Link mời web mở đúng route và xử lý an toàn (validate token phía server, không trust input thô). Cấu trúc token dùng lại được cho deep link mobile sau.
- **AC2**: Chấp nhận tạo `pet_caregivers` role co-parent; phát `coop_invite_accepted`.
- **AC3**: Lời mời hết hạn/đã dùng không thể tái sử dụng.

### US-COOP-03 (M) — Tương tác đồng thời an toàn
Là hai caregiver, chúng tôi muốn cùng chăm pet mà không lỗi.
- **AC1**: Hai người thực hiện cùng hành động không tạo double reward (idempotency/optimistic lock).
- **AC2**: Activity feed và trạng thái pet cập nhật realtime cho cả hai.
- **AC3**: Co-op streak không reset nếu ít nhất một người hoạt động trong ngày.

### US-COOP-04 (S) — Phân quyền
Là owner, tôi muốn kiểm soát quyền của co-parent.
- **AC1**: Owner có quyền mời/xóa co-parent, đổi tên pet, giải tán co-op.
- **AC2**: Co-parent không thực hiện được hành động chỉ dành cho owner (server enforce, không chỉ ẩn UI).

## Kinh tế, quest, mini game, cosmetic

### US-QUEST-01 (M) — Daily quest
Là người dùng, tôi muốn hoàn thành nhiệm vụ ngày để nhận thưởng.
- **AC1**: Quest định nghĩa từ config backend (đổi được không cần phát hành app).
- **AC2**: Tiến độ ghi `quest_progress`; claim reward qua server; phát `daily_quest_completed`.

### US-GAME-01 (M) — Mini game
Là người dùng, tôi muốn chơi mini game kiếm coin/XP.
- **AC1**: Có ít nhất tap game và memory card.
- **AC2**: Reward cap theo ngày + cooldown; server verify mức thưởng, không tin kết quả client tuyệt đối.
- **AC3**: Chơi offline được nhưng reward chỉ xác nhận khi online.

### US-ECON-01 (M) — Kiếm coin
Là người dùng, tôi muốn tích coin từ hoạt động.
- **AC1**: Coin cộng qua currency transaction phía server, ghi `currency_transactions`.
- **AC2**: Client không tự cộng coin/gem.

### US-SHOP-01 (M) — Mua & mặc cosmetic
Là người dùng, tôi muốn mua item và mặc cho pet.
- **AC1**: Mua kiểm tra đủ số dư trong transaction; trừ đúng số coin/gem.
- **AC2**: Item vào `inventory_items`; mặc ghi `pet_equipped_items`; phát `item_purchased`, `cosmetic_equipped`.
- **AC3**: Cosmetic chỉ đổi ngoại hình, không tạo lợi thế gameplay.

### US-ADS-01 (S) — Rewarded ad (mock)
Là người dùng, tôi muốn xem quảng cáo để nhận thưởng.
- **AC1**: Dùng mock ad provider qua interface chung.
- **AC2**: Tối đa 10 lần/ngày, đếm phía server; phát `rewarded_ad_completed`.
- **AC3**: Không hiển thị ad ép buộc trong onboarding hay lúc pet tương tác cảm xúc.

## Community (mức an toàn)

### US-COMM-01 (C) — Xem & tương tác nhẹ
Là người dùng, tôi muốn xem pet người khác và thể hiện yêu thích.
- **AC1**: Xem public profile, like room/outfit, follow, leaderboard tuần.
- **AC2**: Tài khoản mặc định riêng tư; không lộ email/thông tin cá nhân.
- **AC3**: Có report/block; nội dung do người dùng tải lên đi qua moderation.
