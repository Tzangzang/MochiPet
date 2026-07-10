Bạn là một Senior Web Engineer, Solution Architect, AI Engineer, Game Designer và Product Designer. Nhiệm vụ của bạn là thiết kế và lập trình một ứng dụng **web-first** nuôi thú ảo đồng hành hằng ngày, kết hợp:

* Nuôi và chăm sóc thú ảo.
* AI nhận diện món ăn từ ảnh thật.
* Chuyển món ăn thật thành thức ăn theo phong cách game.
* Co-op hai người cùng nuôi một pet.
* Nhắc việc và xây dựng thói quen.
* Sưu tầm pet, trang phục và vật phẩm.
* Mini game và nhiệm vụ hằng ngày.
* Cộng đồng người chơi.

Tên tạm thời của ứng dụng: **MochiPet**.

Hãy xây dựng ứng dụng theo hướng production-ready nhưng ưu tiên hoàn thành MVP trước. Không chỉ đưa ra ý tưởng hoặc pseudo-code. Hãy tạo code có thể chạy, cấu trúc thư mục rõ ràng, database schema, API, hướng dẫn cài đặt và hướng dẫn kiểm thử.

> **ĐỊNH HƯỚNG NỀN TẢNG (đã duyệt): WEB-FIRST.** Xây dựng phiên bản **web hoàn chỉnh trước** bằng Next.js (App Router). Phiên bản **mobile bằng Expo/React Native triển khai sau** ở Phase 10 (tương lai). Backend Supabase, database schema và toàn bộ **domain logic** được thiết kế **dùng chung** cho web và mobile. Vì vậy domain layer không được phụ thuộc API chỉ có trên trình duyệt; mọi browser API phải bọc qua adapter/interface. Ở bước hiện tại **chưa** khởi tạo hay cài đặt Expo.

# 1. Mục tiêu sản phẩm

MochiPet là ứng dụng nuôi thú ảo đồng hành hằng ngày. Người dùng lựa chọn hoặc ấp trứng để nhận một pet, sau đó chăm pet thông qua những hoạt động trong đời sống thật như:

* Ăn uống.
* Uống nước.
* Học tập.
* Làm việc.
* Ngủ đúng giờ.
* Hoàn thành công việc.
* Chụp ảnh đồ ăn.
* Tương tác với bạn bè hoặc người đồng hành.

Ứng dụng phải tạo cảm giác pet đang thực sự đồng hành với người dùng, không chỉ là một nhân vật trang trí.

Điểm khác biệt quan trọng nhất là người dùng có thể chụp ảnh đồ ăn thật. AI sẽ nhận diện món ăn, phân loại và chuyển món ăn đó thành một phiên bản hoạt hình trong game để pet ăn.

App có thể tham khảo logic sản phẩm từ các mô hình như:

* App nuôi pet cùng người khác.
* App chụp đồ ăn để feed pet.
* App xây dựng thói quen bằng phần thưởng.
* Game hatch egg và sưu tầm pet.
* App nhắc lịch chăm thú ngoài đời thực.

Không sao chép trực tiếp hình ảnh, thương hiệu, nhân vật, giao diện hoặc tài sản trí tuệ của bất kỳ sản phẩm nào.

# 2. Công nghệ đề xuất

Sử dụng stack sau cho phiên bản MVP (**web-first**):

## Web frontend (MVP hiện tại)

* Next.js với App Router.
* TypeScript strict mode.
* Tailwind CSS.
* shadcn/ui cho component primitives.
* TanStack Query để quản lý server state và cache.
* Zustand để quản lý client state.
* React Hook Form và Zod để validate form.
* Framer Motion cho animation giao diện.
* Lottie hoặc placeholder component cho pet animation.
* Camera web dùng `MediaDevices.getUserMedia`, luôn kèm lựa chọn upload ảnh từ thiết bị.
* Web Push qua service worker cho notification (bật sau khi người dùng cấp quyền).
* PWA: web app manifest + icon placeholder + cài lên home screen; offline mode nâng cao để phase sau.

Ngoài ra phải có **design tokens riêng** cho màu sắc, typography, spacing, radius và shadow; không hard-code style lặp lại trong page/component.

## Mobile frontend (Phase 10 — tương lai, chưa triển khai)

Sẽ dùng React Native + Expo, tái sử dụng backend Supabase và domain layer đã tách. Danh sách tham khảo cho tương lai:

* React Native, Expo, Expo Router.
* Zustand, TanStack Query, React Hook Form, Zod (dùng lại được từ domain layer).
* Expo Notifications cho push/local notification (thay cho Web Push).
* Expo Camera / Image Picker (thay cho MediaDevices).
* React Native Reanimated + Lottie cho animation.
* NativeWind cho styling (thay cho Tailwind CSS web).

## Backend

* Supabase.
* PostgreSQL.
* Supabase Authentication.
* Supabase Storage.
* Supabase Realtime.
* Supabase Edge Functions.
* Row Level Security cho toàn bộ bảng chứa dữ liệu người dùng.

## AI

Thiết kế AI provider theo abstraction layer để có thể thay đổi giữa:

* OpenAI Vision.
* Google Gemini Vision.
* Anthropic-compatible service nếu có hỗ trợ hình ảnh phù hợp.
* Model nội bộ trong tương lai.

AI không được trực tiếp quyết định toàn bộ gameplay. Kết quả AI phải được chuẩn hóa và kiểm tra bằng backend trước khi ghi nhận.

## Monetization

Chuẩn bị kiến trúc để tích hợp:

* Rewarded ads.
* In-app purchase.
* Subscription.
* Cosmetic shop.

Có thể sử dụng RevenueCat cho in-app purchase và subscription.

Không cần tích hợp thanh toán thật ngay ở bước đầu, nhưng phải thiết kế interface và mock service để có thể tích hợp sau.

# 3. Nhóm người dùng

Ứng dụng phục vụ ba nhóm chính:

1. Người dùng muốn có một pet ảo đồng hành hằng ngày.
2. Hai người muốn cùng chăm một pet, ví dụ bạn bè, người yêu hoặc người thân.
3. Người dùng muốn xây dựng thói quen thông qua nhắc việc và phần thưởng trong game.

# 4. Luồng onboarding

Xây dựng onboarding gồm các bước:

1. Màn hình giới thiệu ngắn.
2. Đăng ký hoặc đăng nhập:

   * Email.
   * Google.
   * Apple.
3. Nhập tên hiển thị.
4. Chọn múi giờ.
5. Chọn mục tiêu sử dụng:

   * Nuôi pet giải trí.
   * Xây dựng thói quen.
   * Nuôi chung với người khác.
   * Theo dõi thói quen ăn uống.
6. Chọn pet starter hoặc chọn một quả trứng.
7. Đặt tên cho pet.
8. Cho phép notification.
9. Hướng dẫn hành động đầu tiên:

   * Vuốt ve pet.
   * Cho pet ăn.
   * Tạo reminder đầu tiên.

Onboarding phải có thể bỏ qua một số bước không bắt buộc.

# 5. Hệ thống pet

## 5.1 Loài pet

MVP hỗ trợ tối thiểu các loài:

* Mèo.
* Chó.
* Thỏ.
* Gấu.
* Cáo.
* Rồng nhỏ.

Mỗi loài có:

* ID.
* Tên.
* Mô tả.
* Tính cách cơ bản.
* Thời gian ấp.
* Bộ animation.
* Bộ biểu cảm.
* Tốc độ giảm đói.
* Tốc độ giảm năng lượng.
* Sở thích đồ ăn.
* Nhóm đồ ăn không thích.
* Các màu có thể xuất hiện.
* Tỉ lệ độ hiếm.

## 5.2 Tính cách

Ví dụ tính cách:

* Vui vẻ.
* Nhút nhát.
* Năng động.
* Ham ăn.
* Thông minh.
* Ngái ngủ.
* Tò mò.
* Khó chiều.

Tính cách ảnh hưởng đến:

* Câu thoại.
* Phản ứng khi được cho ăn.
* Tốc độ tăng thân thiết.
* Sở thích mini game.
* Biểu cảm.
* Loại reminder pet thường sử dụng.

## 5.3 Chỉ số pet

Mỗi pet có các chỉ số từ 0 đến 100:

* Hunger: mức đói.
* Mood: tâm trạng.
* Energy: năng lượng.
* Hygiene: vệ sinh.
* Affection: độ thân thiết.
* Health: sức khỏe.
* Sleepiness: mức buồn ngủ.

Chỉ số phải thay đổi theo thời gian dựa trên timestamp phía server, không phụ thuộc hoàn toàn vào timer phía client.

Hãy thiết kế một hàm tính trạng thái hiện tại dựa trên:

* Trạng thái cuối cùng đã lưu.
* Thời gian cập nhật cuối.
* Loài.
* Tính cách.
* Trạng thái ngủ.
* Buff hoặc debuff hiện có.

Không chạy cron cập nhật từng pet mỗi phút. Sử dụng cơ chế lazy calculation khi người dùng mở app hoặc thực hiện hành động.

## 5.4 Hành động chăm pet

Các hành động chính:

* Cho ăn.
* Vuốt ve.
* Trò chuyện.
* Chơi mini game.
* Dọn phòng.
* Tắm.
* Cho ngủ.
* Đánh thức.
* Thay trang phục.
* Trang trí phòng.
* Đưa pet đi khám nếu health quá thấp.

Mỗi hành động cần có:

* Cooldown.
* Chi phí tài nguyên nếu có.
* Thay đổi chỉ số.
* Animation.
* Log hoạt động.
* Phản hồi của pet.
* Điểm kinh nghiệm.
* Điểm thân thiết.

Không cho phép spam hành động để farm vô hạn.

# 6. Cơ chế trứng và ấp trứng

Mỗi pet mới có thể bắt đầu từ một quả trứng.

## 6.1 Độ hiếm

Sử dụng các cấp:

* Common.
* Rare.
* Epic.
* Legendary.
* Secret.

Tỉ lệ hiếm phải được cấu hình phía backend, không hard-code hoàn toàn trong frontend.

Hiển thị minh bạch tỉ lệ nhận pet trước khi người dùng bắt đầu ấp hoặc mua trứng.

Ví dụ tỉ lệ mặc định cho trứng cơ bản:

* Common: 65%.
* Rare: 25%.
* Epic: 8%.
* Legendary: 1.8%.
* Secret: 0.2%.

Các con số phải được lưu trong bảng cấu hình và có thể thay đổi.

## 6.2 Thời gian ấp

Thời gian ấp cơ bản:

* Common: 3 giờ.
* Rare: 4 giờ.
* Epic: 5 giờ.
* Legendary: 8 giờ.
* Secret: 12 giờ.

Loài, sự kiện hoặc loại trứng có thể thay đổi thời gian ấp.

Thời gian phải được tính phía server để tránh gian lận bằng cách đổi giờ thiết bị.

## 6.3 Tăng tốc ấp

Người dùng có thể:

1. Chờ tự nhiên.
2. Xem rewarded ad để giảm thời gian.
3. Dùng premium currency để hoàn thành nhanh.
4. Hoàn thành nhiệm vụ để nhận vật phẩm giảm thời gian.

Giới hạn rewarded ad:

* Tối đa 10 lần mỗi ngày.
* Mỗi quảng cáo giảm một khoảng thời gian được cấu hình.
* Backend phải kiểm tra số lượt.
* Không chỉ lưu số lượt ở local storage.

## 6.4 Kết quả hatch

Khi pet nở, hệ thống xác định:

* Loài.
* Màu sắc.
* Độ hiếm.
* Tính cách.
* Trait đặc biệt.
* Chỉ số khởi điểm.
* Cosmetic hoặc badge đi kèm nếu có.

Kết quả hatch phải được xác định phía server bằng transaction để tránh tạo pet trùng hoặc reroll trái phép.

# 7. AI nhận diện đồ ăn

Đây là tính năng quan trọng nhất của ứng dụng.

## 7.1 Luồng sử dụng

1. Người dùng mở camera.
2. Chụp ảnh hoặc chọn ảnh từ thư viện.
3. Client nén và resize ảnh.
4. Upload ảnh lên private storage.
5. Backend kiểm tra:

   * Định dạng.
   * Kích thước.
   * Nội dung có hợp lệ không.
6. Backend gửi ảnh đến AI Vision.
7. AI trả về món ăn gần đúng.
8. Backend chuẩn hóa kết quả vào food taxonomy của game.
9. Người dùng xem màn hình xác nhận.
10. Người dùng có thể:

    * Chấp nhận.
    * Chọn món khác.
    * Chọn nhóm món gần đúng.
11. Hệ thống tạo virtual food item.
12. Pet ăn virtual food item.
13. Chỉ số pet được cập nhật.
14. Kết quả được ghi vào food history.

## 7.2 Kết quả AI bắt buộc

AI phải trả JSON theo schema:

{
"is_food": true,
"primary_food_name": "chicken noodle soup",
"localized_name": "mì gà",
"food_category": "noodles",
"ingredients": ["noodles", "chicken", "vegetables"],
"health_score": 72,
"confidence": 0.87,
"portion_size": "medium",
"possible_alternatives": [
{
"name": "pho ga",
"confidence": 0.61
}
],
"safety_flags": [],
"visual_asset_key": "noodle_bowl_01"
}

Sử dụng Zod hoặc schema validation ở backend.

Không tin tưởng trực tiếp JSON do model trả về. Phải:

* Parse an toàn.
* Validate schema.
* Clamp các giá trị số.
* Map category vào enum được hỗ trợ.
* Có timeout.
* Có retry giới hạn.
* Có fallback nếu AI lỗi.

## 7.3 Food taxonomy

MVP có các nhóm:

* Rice.
* Noodles.
* Soup.
* Meat.
* Seafood.
* Vegetables.
* Fruit.
* Bread.
* Dessert.
* Snack.
* Fast food.
* Drink.
* Coffee or tea.
* Dairy.
* Unknown food.

Mỗi nhóm có:

* Mức no.
* Mức tăng mood.
* Thời gian duy trì độ no.
* Health effect.
* Rarity.
* Asset key.
* Animation khi pet ăn.

## 7.4 Gameplay đồ ăn

Ví dụ:

* Rau và món cân bằng:

  * Mood tăng vừa.
  * Health tăng.
  * No lâu.
* Trái cây:

  * Mood tăng vừa.
  * Health tăng nhẹ.
* Đồ ngọt:

  * Mood tăng nhanh.
  * No trong thời gian ngắn.
  * Dùng quá nhiều tạo debuff.
* Fast food:

  * Mood tăng nhiều.
  * Health giảm nhẹ nếu sử dụng liên tục.
* Đồ uống:

  * Tác động tới thirst hoặc energy.
* Món hiếm:

  * Có thể tặng bonus cosmetic fragment hoặc XP.

Không mô tả kết quả AI như tư vấn y tế hoặc đánh giá dinh dưỡng chính xác. Hiển thị rõ rằng health score chỉ là cơ chế gameplay và kết quả nhận diện có thể không chính xác.

## 7.5 Fallback

Nếu confidence thấp hơn ngưỡng cấu hình, hiển thị:

“Pet chưa chắc đây là món gì. Bạn hãy chọn loại gần đúng.”

Cho người dùng chọn thủ công từ:

* Danh sách món gợi ý.
* Food category.
* Tìm kiếm món.
* “Không phải đồ ăn”.

Không làm gián đoạn luồng feed pet khi AI không nhận diện được.

## 7.6 Virtual food asset

Trong MVP, không cần tạo mô hình 3D mới từ từng ảnh.

Thực hiện theo hai bước:

1. AI nhận diện món và map vào taxonomy.
2. Chọn asset hoạt hình có sẵn theo `visual_asset_key`.

Ví dụ:

* `rice_bowl_01`.
* `noodle_bowl_01`.
* `cake_slice_01`.
* `fruit_plate_01`.
* `milk_tea_01`.

Kiến trúc phải cho phép bổ sung image generation trong tương lai, nhưng MVP ưu tiên asset có sẵn để đảm bảo tốc độ và tính nhất quán.

# 8. Co-op hai người

Cho phép hai tài khoản cùng chăm một pet hoặc một quả trứng.

## 8.1 Tạo liên kết

Người dùng có thể:

* Tạo mã mời.
* Chia sẻ deep link.
* Mời bằng username.
* Quét QR code trong tương lai.

Một pet trong MVP có tối đa hai caregiver.

## 8.2 Quyền hạn

Các role:

* Owner.
* Co-parent.

Owner có thể:

* Mời hoặc xóa co-parent.
* Đổi tên pet.
* Cài đặt quyền sử dụng premium currency.
* Chuyển quyền sở hữu.
* Giải tán liên kết co-op.

Co-parent có thể:

* Cho ăn.
* Chơi.
* Dọn phòng.
* Hoàn thành nhiệm vụ.
* Tạo reminder dùng chung.
* Xem lịch sử chăm pet.

Không cho phép hai người thực hiện cùng một hành động gây double reward.

Sử dụng database transaction, idempotency key hoặc optimistic locking để xử lý concurrency.

## 8.3 Realtime

Dùng Supabase Realtime để cập nhật:

* Trạng thái pet.
* Người vừa cho pet ăn.
* Nhiệm vụ chung.
* Tin nhắn ngắn.
* Trạng thái trứng.
* Thay đổi phòng.

Ví dụ feed hoạt động:

* “Linh vừa cho Mochi ăn một tô mì.”
* “An vừa hoàn thành nhiệm vụ uống nước.”
* “Hai bạn đã chăm Mochi liên tục 7 ngày.”

## 8.4 Co-op streak

Có streak chung dựa trên việc ít nhất một caregiver thực hiện hành động hợp lệ mỗi ngày.

Không được reset streak chỉ vì một người không đăng nhập nếu người còn lại vẫn chăm pet.

# 9. Reminder và habit

Người dùng có thể tạo reminder:

* Uống nước.
* Học bài.
* Làm việc.
* Đi ngủ.
* Thức dậy.
* Tập thể dục.
* Uống thuốc.
* Sự kiện cá nhân.
* Reminder tùy chỉnh.

Lưu ý: reminder uống thuốc chỉ đóng vai trò nhắc lịch do người dùng tự cài đặt, không được đưa ra liều lượng hoặc chỉ định y tế.

Mỗi reminder gồm:

* Tiêu đề.
* Nội dung.
* Icon.
* Thời gian.
* Múi giờ.
* Ngày lặp lại.
* Trạng thái bật hoặc tắt.
* Người sở hữu.
* Dùng riêng hay dùng chung.
* Phần thưởng.
* Thời gian snooze.
* Loại notification.

## 9.1 Notification trên web (MVP)

* **In-app reminder là tính năng bắt buộc của MVP** và phải hoạt động ngay cả khi chưa cấp quyền browser notification.
* Chuẩn bị kiến trúc **Web Push bằng service worker**; **browser notification chỉ bật sau khi người dùng cấp quyền**.
* Tách một **NotificationProvider** (qua adapter/interface) để sau này thêm mobile push notification mà không sửa domain logic.
* **Không phụ thuộc hoàn toàn vào timer chạy trong tab trình duyệt**: lịch nhắc phải được tính từ dữ liệu phía server và khôi phục lại khi mở app; dùng service worker / scheduled push thay vì chỉ `setTimeout` trong tab.

Pet sẽ gửi notification theo cá tính, ví dụ:

* “Đến giờ uống nước rồi đó. Mochi cũng đang khát!”
* “Học 25 phút cùng mình nhé?”
* “Khuya rồi, mình cùng đi ngủ thôi.”

Người dùng có thể đánh dấu:

* Hoàn thành.
* Bỏ qua.
* Snooze.
* Hoàn thành muộn.

Mỗi reminder hoàn thành có thể trao:

* Coin.
* XP.
* Mood.
* Affection.
* Streak point.

Phải có giới hạn phần thưởng mỗi ngày để tránh tạo reminder giả nhằm farm coin.

# 10. Trò chuyện với pet

Xây dựng hai chế độ:

## Chế độ MVP

Sử dụng dialogue engine dựa trên:

* Tính cách.
* Chỉ số pet.
* Thời gian trong ngày.
* Lịch sử hành động gần đây.
* Reminder.
* Streak.
* Món vừa ăn.

Các câu thoại được chọn từ template có biến động.

## Chế độ AI mở rộng

Thiết kế interface cho AI chat nhưng chưa bắt buộc tích hợp đầy đủ trong MVP.

AI chat phải:

* Giữ nhân cách nhất quán.
* Không đóng vai chuyên gia y tế.
* Không cung cấp nội dung nguy hiểm.
* Không yêu cầu dữ liệu nhạy cảm.
* Không khiến người dùng hiểu rằng pet là người thật.
* Có giới hạn số lượt hoặc token.
* Có moderation.
* Không lưu toàn bộ cuộc trò chuyện vô thời hạn nếu không cần thiết.

Pet có thể phản hồi dựa trên:

* Tên người dùng.
* Tên pet.
* Mood.
* Hunger.
* Hoạt động hôm nay.
* Reminder sắp tới.

# 11. Mini game

MVP có ít nhất hai mini game đơn giản:

1. Tap game:

   * Người dùng chạm vào vật phẩm đúng.
   * Có thời gian giới hạn.
   * Nhận coin và XP.

2. Memory card:

   * Lật và ghép cặp.
   * Có nhiều mức độ khó.
   * Pet có animation phản ứng.

Yêu cầu:

* Có daily reward cap.
* Có cooldown.
* Không dùng kết quả phía client làm nguồn dữ liệu tuyệt đối.
* Backend xác minh mức thưởng hợp lý.
* Có thể chơi offline nhưng reward chỉ được xác nhận khi online.

# 12. Sưu tầm và customization

Cho phép tùy chỉnh:

* Quần áo.
* Mũ.
* Phụ kiện.
* Vòng cổ.
* Biểu cảm.
* Nền phòng.
* Giường.
* Đồ chơi.
* Vật trang trí.
* Hiệu ứng đặc biệt.

Mỗi item gồm:

* ID.
* Tên.
* Loại.
* Độ hiếm.
* Giá coin.
* Giá premium currency.
* Asset key.
* Pet species compatibility.
* Thời gian phát hành.
* Event source.
* Trạng thái có thể mua.
* Trạng thái có thể trao đổi trong tương lai.

MVP chưa cần marketplace giữa người chơi.

Trang phục chỉ thay đổi ngoại hình, không tạo lợi thế pay-to-win đáng kể.

# 13. Nhiệm vụ và phần thưởng

## Daily quests

Ví dụ:

* Cho pet ăn một lần.
* Vuốt ve pet ba lần.
* Hoàn thành một reminder.
* Chơi một mini game.
* Dọn phòng.
* Chụp một món ăn.
* Tương tác co-op.

## Weekly quests

Ví dụ:

* Chăm pet năm ngày.
* Hoàn thành mười reminder.
* Feed năm nhóm đồ ăn khác nhau.
* Chơi co-op ba ngày.
* Duy trì mood trên 70.

Phần thưởng:

* Coin.
* XP.
* Cosmetic fragment.
* Trứng.
* Vật phẩm tăng tốc.
* Badge.

Nhiệm vụ được định nghĩa bằng cấu hình backend để có thể thay đổi mà không phát hành lại app.

# 14. Community

MVP chỉ triển khai community ở mức an toàn và đơn giản:

* Xem pet của người khác.
* Like phòng hoặc outfit.
* Chia sẻ ảnh pet dưới dạng generated card.
* Theo dõi người dùng khác.
* Bảng xếp hạng tuần theo điểm chăm pet.

Chưa triển khai chat tự do giữa người lạ trong MVP.

Nếu có nội dung do người dùng tải lên:

* Có report.
* Có block.
* Có moderation.
* Không hiển thị email hoặc thông tin riêng tư.
* Thiết lập tài khoản mặc định là riêng tư.

# 15. Kinh tế trong game

Sử dụng hai loại tiền:

## Coin

Kiếm được qua:

* Daily quest.
* Mini game.
* Reminder.
* Streak.
* Chăm pet.

Dùng để:

* Mua item phổ thông.
* Mua đồ chơi.
* Mua food item cơ bản.
* Mua trứng phổ thông.

## Gem

Kiếm được hạn chế hoặc mua bằng tiền thật.

Dùng để:

* Tăng tốc hatch.
* Mua cosmetic đặc biệt.
* Mua trứng sự kiện.
* Mua room theme.
* Mở một số slot bổ sung.

Không tạo cơ chế ép buộc người dùng trả tiền để pet không bị mất hoặc chết.

Pet không chết vĩnh viễn do người dùng không mở app. Khi bị bỏ quên, pet chỉ buồn, bẩn hoặc ngủ nhiều hơn và có thể hồi phục thông qua chăm sóc.

# 16. Rewarded ads

Rewarded ads có thể dùng để:

* Giảm thời gian ấp.
* Nhận coin.
* Nhận thêm lượt mini game.
* Nhận một lần reroll gợi ý món ăn.
* Nhân đôi phần thưởng nhiệm vụ trong giới hạn.

Quy định:

* Tối đa 10 rewarded ads mỗi ngày.
* Có server-side verification nếu ad network hỗ trợ.
* Không hiển thị quảng cáo xen kẽ trong lúc pet đang tương tác cảm xúc.
* Không hiển thị quảng cáo bắt buộc trong onboarding.
* Trẻ vị thành niên phải được xử lý theo chính sách phù hợp.

# 17. Màn hình chính

Xây dựng các màn hình:

1. Splash screen.
2. Onboarding.
3. Login và register.
4. Chọn trứng hoặc pet.
5. Home room.
6. Pet detail.
7. Feed pet.
8. Camera food scan.
9. Food analysis result.
10. Manual food selection.
11. Egg incubation.
12. Hatch result.
13. Pet collection.
14. Wardrobe.
15. Room decoration.
16. Mini game list.
17. Reminder list.
18. Create reminder.
19. Reminder detail.
20. Co-op invite.
21. Co-op activity.
22. Daily quests.
23. Shop.
24. Inventory.
25. Community feed.
26. Public profile.
27. User profile.
28. Settings.
29. Notification settings.
30. Privacy settings.

# 18. Thiết kế giao diện

Phong cách:

* Dễ thương.
* Ấm áp.
* Màu pastel.
* Bo góc lớn.
* Animation nhẹ.
* Không quá trẻ con.
* Phù hợp cả người dùng trẻ và người trưởng thành.
* Tạo cảm giác thư giãn và đồng hành.

Home room cần hiển thị:

* Pet ở trung tâm.
* Mood hoặc biểu cảm.
* Hunger.
* Energy.
* Các hành động nhanh.
* Reminder gần nhất.
* Co-parent status.
* Daily quest progress.
* Coin và gem.
* Notification khi pet cần chăm.

Thiết kế **web responsive theo mobile-first**, hỗ trợ:

* Responsive breakpoint (mobile → tablet → desktop).
* PWA: web app manifest, icon placeholder, cài lên home screen.
* Dark mode trong tương lai.
* Font scaling và zoom trình duyệt.
* Screen reader và semantic HTML.
* Reduced motion (`prefers-reduced-motion`).
* Touch target và con trỏ chuột đủ lớn cho cả cảm ứng lẫn desktop.

Triển khai UI bằng **Tailwind CSS + shadcn/ui**, nhưng vẫn tạo một **design system với design tokens riêng** (không hard-code style lặp lại trong page/component):

* Color tokens.
* Typography.
* Spacing.
* Radius.
* Shadows.
* Button variants.
* Card variants.
* Status colors.
* Rarity styles.

Các màn hình ở mục 17 là **route/page của Next.js App Router**; "Splash screen" trên web là màn hình loading/landing ban đầu.

# 19. Database schema

Hãy thiết kế SQL migration đầy đủ cho các bảng tối thiểu sau:

* profiles
* user_settings
* pet_species
* pet_personalities
* pet_color_variants
* eggs
* egg_types
* hatch_probability_configs
* pets
* pet_caregivers
* pet_state_snapshots
* pet_action_logs
* pet_dialogue_logs
* food_categories
* food_catalog
* food_scans
* food_scan_candidates
* virtual_food_items
* pet_feeding_logs
* inventory_items
* item_catalog
* pet_equipped_items
* rooms
* room_equipped_items
* reminders
* reminder_schedules
* reminder_completions
* habit_streaks
* quests
* quest_progress
* currencies
* currency_transactions
* ad_reward_logs
* purchases
* subscriptions
* coop_invites
* coop_activity_logs
* mini_game_sessions
* mini_game_rewards
* notifications
* user_follows
* community_posts
* community_likes
* reports
* app_config
* feature_flags

Mỗi bảng cần:

* Primary key.
* Foreign key.
* Index cần thiết.
* Created timestamp.
* Updated timestamp nếu phù hợp.
* Constraint.
* Enum hoặc check constraint.
* Row Level Security policy.
* Soft delete nếu cần.

Tạo trigger cập nhật `updated_at`.

Tạo transaction hoặc PostgreSQL function cho:

* Hatch egg.
* Feed pet.
* Perform pet action.
* Claim quest reward.
* Claim ad reward.
* Join co-op.
* Complete reminder.
* Spend currency.
* Buy item.

Không để client tự cộng coin, gem, XP hoặc thay đổi rarity.

# 20. API và Edge Functions

Thiết kế các Edge Function:

* analyze-food-image
* confirm-food-scan
* hatch-egg
* speed-up-hatch
* perform-pet-action
* feed-pet
* calculate-pet-state
* create-coop-invite
* accept-coop-invite
* complete-reminder
* claim-quest-reward
* claim-ad-reward
* start-mini-game-session
* finish-mini-game-session
* generate-pet-dialogue
* create-community-post
* report-content

Mỗi API cần:

* Authentication.
* Authorization.
* Input validation.
* Rate limiting.
* Idempotency.
* Error handling.
* Logging.
* Response schema.
* Không tiết lộ stack trace cho client.

# 21. Bảo mật

Bắt buộc triển khai hoặc mô tả rõ:

* Supabase Row Level Security.
* Private storage bucket cho ảnh đồ ăn.
* Signed URL có thời hạn.
* Không đưa AI API key vào mobile app.
* Không tin tưởng timestamp phía client.
* Không tin tưởng reward phía client.
* Rate limit food scan.
* Rate limit AI chat.
* Rate limit invite.
* Idempotency key cho giao dịch.
* Transaction cho currency.
* Audit log cho giao dịch quan trọng.
* Kiểm tra quyền của co-parent.
* Xử lý deep link an toàn.
* Sanitize user-generated text.
* File size limit.
* MIME type validation.
* Xóa metadata EXIF khỏi ảnh nếu phù hợp.
* Chính sách xóa tài khoản và dữ liệu.
* Chống replay request cho reward.

# 22. Analytics

Chuẩn bị analytics event naming convention.

Các event quan trọng:

* onboarding_started
* onboarding_completed
* signup_completed
* starter_egg_selected
* egg_incubation_started
* egg_hatched
* hatch_speedup_used
* food_scan_started
* food_scan_succeeded
* food_scan_failed
* food_scan_corrected
* pet_fed
* pet_action_completed
* reminder_created
* reminder_completed
* reminder_skipped
* coop_invite_sent
* coop_invite_accepted
* daily_quest_completed
* item_purchased
* cosmetic_equipped
* rewarded_ad_completed
* subscription_started
* day_1_retained
* day_7_retained
* day_30_retained

Không gửi ảnh đồ ăn hoặc nội dung nhạy cảm vào analytics.

# 23. Tiêu chí MVP

MVP phải hoàn thành được luồng end-to-end:

1. Người dùng đăng ký.
2. Chọn một quả trứng.
3. Bắt đầu ấp trứng.
4. Hatch pet.
5. Xem pet tại home room.
6. Vuốt ve và chơi với pet.
7. Chụp ảnh đồ ăn.
8. AI nhận diện hoặc cho phép chọn thủ công.
9. Feed pet.
10. Tạo reminder.
11. Nhận notification (in-app; Web Push nếu đã cấp quyền).
12. Hoàn thành reminder.
13. Mời một người cùng chăm pet.
14. Người thứ hai có thể tương tác với cùng pet.
15. Dữ liệu được đồng bộ realtime.
16. Kiếm coin.
17. Mua và mặc một cosmetic item.

Các tính năng community nâng cao, AI chat mở rộng và payment thật có thể để ở phase sau.

# 24. Cấu trúc code

Hãy tổ chức source code theo domain hoặc feature, không đặt toàn bộ logic vào page hoặc React component. Cấu trúc web-first (đã duyệt) tách rõ **domain** (tái sử dụng cho mobile) khỏi **UI** và khỏi **browser API** (bọc qua adapter):

```
src/
  app/            # Next.js App Router: route, layout, page (chỉ lắp ráp UI)
  components/     # UI dùng chung (kèm shadcn/ui)
  features/       # Ghép UI + hook theo feature (auth, onboarding, pets, eggs,
                  #   feeding, food-scan, coop, reminders, quests, inventory,
                  #   shop, mini-games, community)
  domain/         # Business logic thuần, KHÔNG phụ thuộc React/Next/browser
                  #   (pet-state, hatch, feeding, currency, reminder, coop...)
  services/       # Tích hợp ngoài: supabase, ai, analytics, notifications, purchases, ads
  adapters/       # Bọc browser API: camera(getUserMedia), storage, push/service worker,
                  #   clipboard, geolocation... để mobile thay implementation khác
  hooks/          # Hook dùng chung
  stores/         # Zustand client state
  schemas/        # Zod schema (env, AI response, form, API contract)
  types/          # TypeScript types & API contracts dùng chung
  utils/          # Helper thuần
  config/         # Cấu hình runtime (đọc env, feature flags client)
  design-system/  # Tokens (color, typography, spacing, radius, shadow), variants

supabase/
  migrations/     # SQL migrations
  functions/      # Edge Functions
  seed.sql        # Seed data

public/
  manifest/       # Web app manifest (PWA)
  icons/          # Icon placeholder
  assets/         # Mock pet/food/room assets
```

**Ranh giới bắt buộc (để tái sử dụng cho mobile ở Phase 10):**

* Business logic không được đặt trực tiếp trong page hoặc component.
* Tách **domain logic**, **validation schema (Zod)**, **API contracts** và **types** khỏi UI.
* Các module **pet state, hatch egg, feeding, currency, reminder, co-op** phải nằm trong `domain/` và có thể import lại từ Expo app mà không sửa.
* **Không** dùng API chỉ có trên trình duyệt (window, document, navigator, service worker...) bên trong `domain/`.
* Mọi browser API phải đi qua `adapters/` (interface + web implementation); mobile sẽ cung cấp implementation riêng.

Mỗi feature nên có:

* Components.
* Hooks.
* API service (gọi domain + services).
* Types.
* Schema.
* Tests.
* Route/page tương ứng trong `app/`.

# 25. Code quality

Yêu cầu:

* TypeScript strict mode.
* Không sử dụng `any` trừ trường hợp được giải thích rõ.
* Không hard-code secret.
* Không hard-code business configuration quan trọng.
* Có loading state.
* Có empty state.
* Có error state.
* Có retry phù hợp.
* Có optimistic update ở nơi an toàn.
* Có rollback khi optimistic update thất bại.
* Có unit test cho business logic.
* Có integration test cho API quan trọng.
* Có test cho hatch probability.
* Có test cho pet state calculation.
* Có test cho currency transaction.
* Có test cho co-op concurrency.
* Có test cho AI response parser.

Sử dụng ESLint, Prettier và Husky nếu phù hợp.

# 26. Mock assets

Do chưa có bộ hình ảnh chính thức, hãy tạo:

* Placeholder pet component.
* Simple SVG hoặc shape-based pet.
* Asset manifest.
* Interface để thay thế bằng Lottie, Spine hoặc sprite sheet sau.
* Mock food icon.
* Mock room background.
* Mock cosmetic layers.

Không dùng tài sản có bản quyền từ app hoặc game khác.

# 27. Seed data

Tạo seed data gồm:

* 6 loài pet.
* Tối thiểu 8 tính cách.
* 5 cấp độ hiếm.
* 10 màu pet.
* 15 food category hoặc food item mẫu.
* 20 cosmetic item.
* 10 room item.
* 10 daily quest.
* 5 weekly quest.
* 10 dialogue template cho mỗi tính cách hoặc một cấu trúc seed hợp lý.
* Cấu hình rewarded ad.
* Cấu hình hatch probability.
* Cấu hình giảm chỉ số pet.

# 28. Cách làm việc

Không cố viết toàn bộ ứng dụng trong một câu trả lời duy nhất nếu giới hạn output không cho phép.

Hãy thực hiện theo từng phase và bảo đảm mỗi phase có thể chạy:

## Phase 1: Product architecture cho web

Xuất:

* Product requirement summary.
* User flow.
* System architecture (web-first).
* Database ERD dạng Mermaid.
* Folder structure (web + domain tái sử dụng).
* Danh sách package.
* Environment variables.
* Technical risks.
* Phạm vi MVP và phần để sau (gồm mobile chuyển sang Phase 10).

## Phase 2: Next.js project foundation

Tạo:

* Next.js (App Router) + TypeScript strict project.
* Tailwind CSS + shadcn/ui.
* Design system + design tokens.
* Supabase client (browser + server).
* Authentication (email/password; interface sẵn cho Google/Apple).
* Layout & routing (App Router).
* Error boundary.
* Environment validation (Zod).
* Cấu trúc `domain/` và `adapters/` khởi đầu.
* Basic tests.
* README.

## Phase 3: Supabase database và authentication

Tạo:

* SQL migrations.
* Enum.
* Table.
* Index.
* Trigger.
* RLS.
* Seed data.
* Database functions.
* Tích hợp Supabase Auth với web (session server-side, middleware).

## Phase 4: Pet core, egg, hatch và home room

Tạo:

* Egg selection.
* Incubation.
* Hatch.
* Home room.
* Pet state (domain thuần).
* Pet action.
* Inventory.
* Cosmetic.

## Phase 5: AI food scan trên web

Tạo:

* Camera web qua `MediaDevices.getUserMedia` (bọc trong adapter).
* Upload ảnh từ thiết bị (luôn có, kể cả khi không dùng camera).
* AI provider interface (`FoodVisionProvider`).
* MockVisionProvider (development) + Gemini Vision (staging/prod).
* Vision prompt.
* Response schema (Zod).
* Edge Function.
* Confirmation screen.
* Manual fallback (bắt buộc).
* Feed transaction.
* Food history.

## Phase 6: Reminder và notification

Tạo:

* Reminder CRUD.
* Repeat schedule.
* In-app reminder (bắt buộc MVP, không phụ thuộc timer trong tab).
* NotificationProvider (adapter) + Web Push qua service worker.
* Browser notification permission (chỉ bật sau khi cấp quyền).
* Completion.
* Reward (có cap).
* Streak.

## Phase 7: Co-op và realtime

Tạo:

* Invite.
* Link mời / deep link web (và cấu trúc cho deep link mobile sau).
* Accept invite.
* Shared pet.
* Realtime activity (Supabase Realtime).
* Permission (owner/co-parent).
* Concurrency protection.

## Phase 8: Quest, mini game, inventory và shop

Tạo:

* Daily quest.
* Mini game.
* Currency.
* Inventory.
* Shop.
* Reward cap.
* Mock rewarded ads (mock adapter).

## Phase 9: PWA, testing, security và deployment

Tạo:

* Web app manifest + icon placeholder + cài lên home screen.
* Service worker (Web Push; offline nâng cao để sau).
* Unit test.
* Integration test.
* RLS test.
* Error handling.
* Performance review.
* Security checklist.
* Build & deployment instructions (web).

## Phase 10 (tương lai): Expo mobile app

Chưa triển khai ở giai đoạn hiện tại. Sẽ dùng React Native + Expo, **tái sử dụng chung** backend Supabase, database schema và `domain/` (pet state, hatch, feeding, currency, reminder, co-op). Chỉ cần viết lại UI và các `adapters/` cho môi trường mobile (camera, notification/push, storage). Không được sửa domain rules khi làm mobile.

Sau mỗi phase:

1. Liệt kê file được tạo hoặc thay đổi.
2. Cung cấp code hoàn chỉnh cho từng file.
3. Giải thích ngắn gọn quyết định quan trọng.
4. Đưa lệnh cài đặt.
5. Đưa lệnh chạy.
6. Đưa cách kiểm thử.
7. Ghi rõ phần nào đang mock.
8. Không tự chuyển sang phase tiếp theo cho đến khi phase hiện tại có cấu trúc đầy đủ.

# 29. Quy tắc trả lời

* Không chỉ trả về bản mô tả sản phẩm.
* Không dùng pseudo-code cho các thành phần cốt lõi.
* Không bỏ qua database hoặc RLS.
* Không giả định client đáng tin cậy.
* Không đưa API key vào code.
* Không tạo một file quá lớn chứa toàn bộ app.
* Không viết component có business logic phức tạp trực tiếp trong UI.
* Khi thiếu asset, sử dụng placeholder có thể thay thế.
* Khi một dịch vụ bên ngoài chưa được cấu hình, tạo adapter và mock provider.
* Khi có nhiều lựa chọn kỹ thuật, chọn phương án hợp lý nhất cho MVP và giải thích trong tối đa ba câu.
* Mọi code phải thống nhất tên biến, type và schema.
* Các đoạn code nối tiếp nhau phải tương thích, không được thay đổi kiến trúc tùy tiện giữa các phase.
* Luôn sử dụng phiên bản package ổn định và tương thích với Next.js/React hiện hành (Expo chỉ áp dụng ở Phase 10 tương lai).
* Trước khi đề xuất version package, hãy kiểm tra tài liệu chính thức hoặc yêu cầu tôi chạy lệnh kiểm tra version nếu bạn không có khả năng truy cập internet.
* Giữ `domain/` độc lập với UI và browser API; mọi truy cập browser API phải qua `adapters/` để tái sử dụng cho mobile.

# 30. Bắt đầu

Bắt đầu với **Phase 1: Product architecture**.

Trong Phase 1, hãy cung cấp:

1. Tóm tắt phạm vi MVP.
2. Danh sách user story có acceptance criteria.
3. Luồng onboarding.
4. Luồng hatch egg.
5. Luồng AI food scan.
6. Luồng co-op.
7. Luồng reminder.
8. Kiến trúc hệ thống.
9. Mermaid ERD.
10. Cấu trúc thư mục.
11. Danh sách package.
12. Danh sách environment variable.
13. Rủi ro kỹ thuật và phương án xử lý.
14. Kế hoạch triển khai từ Phase 2 đến Phase 9 (và ghi chú Phase 10 mobile ở tương lai).

Sau đó tạo ngay các file khởi đầu cần thiết cho Phase 2 (web), bao gồm ít nhất:

* `README.md`
* `.env.example`
* `package.json`
* `next.config.js`
* `tsconfig.json`
* `tailwind.config.ts`
* `src/services/supabase/client.ts`
* `src/config/config.ts`
* `src/schemas/env.ts`
* Cấu trúc Next.js App Router ban đầu (`src/app/layout.tsx`, `src/app/page.tsx`).
* `public/manifest/` (web app manifest) và `public/icons/` (icon placeholder).

Mọi file phải được trình bày với đường dẫn file rõ ràng và nội dung đầy đủ.

Khi sử dụng với Claude Code, nên đặt prompt này trong file `CLAUDE.md` của repository để Claude duy trì kiến trúc và quy tắc xuyên suốt quá trình lập trình.
