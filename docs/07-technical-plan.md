# 07 — Technical Plan (Web-first)

> Danh sách package dự kiến, environment variables, rủi ro kỹ thuật + phương án, và kế hoạch Phase 2→9 (+ Phase 10 mobile tương lai).
>
> **Định hướng: WEB-FIRST** (Next.js App Router). Mobile (Expo) ở Phase 10, dùng chung backend + `domain/`.
>
> **Lưu ý version**: Chưa pin version cứng ở đây. Khi khởi tạo (Phase 2), dùng `npx create-next-app@latest` + `npm install` các package tương thích, kiểm tra tài liệu chính thức trước khi chốt. Các dòng dưới chỉ là **danh sách dự kiến**.

## 1. Danh sách package dự kiến (web)

### Core / runtime
- `next` — framework (App Router).
- `react`, `react-dom`.
- `typescript` — strict mode.

### State & data
- `zustand` — client state.
- `@tanstack/react-query` — server state, cache, optimistic update.
- `@supabase/supabase-js` — client Supabase (auth, db, storage, realtime).
- `@supabase/ssr` — session server-side cho Next.js (cookie, middleware).

### Form & validation
- `react-hook-form` — quản lý form.
- `zod` — schema validation (env, AI response, form, API contract).
- `@hookform/resolvers` — nối zod với react-hook-form.

### UI, animation, media
- `tailwindcss` (+ `postcss`, `autoprefixer`) — styling.
- `shadcn/ui` — component primitives (cài qua CLI, sinh code vào `components/`).
- `class-variance-authority`, `tailwind-merge`, `clsx` — quản lý variant/token.
- `lucide-react` — icon.
- `framer-motion` — animation giao diện.
- `lottie-react` (hoặc placeholder component) — pet animation.
- Camera: **Web API `MediaDevices.getUserMedia`** (không cần package), bọc trong `adapters/camera`.
- `browser-image-compression` (hoặc canvas thuần) — nén/resize/xóa EXIF phía client.

### PWA & notification
- `next-pwa` **hoặc** service worker tự viết — manifest + Web Push (đánh giá ở Phase 9; MVP có thể dùng SW tối giản).
- `web-push` (phía Edge Function/server) — gửi Web Push.

### Backend/tooling (dev)
- `supabase` (CLI) — migrations, functions, seed.
- Edge Functions chạy Deno runtime của Supabase (import qua URL, không nằm trong package.json web).

### Chất lượng
- `eslint`, `eslint-config-next`, `prettier`, `@typescript-eslint/*`.
- `husky` + `lint-staged` — git hooks (nếu phù hợp).
- `vitest` **hoặc** `jest` + `@testing-library/react` + `@testing-library/jest-dom` — test (ưu tiên Vitest cho tốc độ; chốt ở Phase 2).
- `playwright` — e2e (Phase 9).

### Monetization (mock ở MVP, thêm khi tích hợp thật)
- Web billing (Stripe…) / RevenueCat — để phase sau; MVP dùng mock adapter.

## 2. Environment variables

### Client (Next.js — prefix `NEXT_PUBLIC_`, chỉ chứa giá trị public)
| Biến | Mô tả |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (public, RLS bảo vệ) |
| `NEXT_PUBLIC_APP_ENV` | `development` / `staging` / `production` |
| `NEXT_PUBLIC_APP_URL` | Base URL web (dùng cho link mời co-op) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public key cho Web Push |

### Server (Supabase secrets / server env — KHÔNG vào client bundle)
| Biến | Mô tả |
|------|-------|
| `SUPABASE_SERVICE_ROLE_KEY` | service role cho Edge Function |
| `AI_PROVIDER` | `mock` (dev) / `gemini` (staging, prod) / `openai` (tương lai) |
| `GEMINI_API_KEY` | key Gemini Vision |
| `OPENAI_API_KEY` | key OpenAI (tương lai) |
| `AI_CONFIDENCE_THRESHOLD` | ngưỡng fallback thủ công |
| `AI_REQUEST_TIMEOUT_MS` | timeout gọi AI |
| `FOOD_SCAN_DAILY_LIMIT` | rate limit scan/ngày |
| `AD_REWARD_DAILY_LIMIT` | mặc định 10 |
| `VAPID_PRIVATE_KEY` | private key Web Push |

> `.env.example` (Phase 2) chỉ liệt kê biến `NEXT_PUBLIC_*`; secret server cấu hình bằng `supabase secrets set` hoặc env của host.

## 3. Rủi ro kỹ thuật & phương án xử lý

| # | Rủi ro | Ảnh hưởng | Phương án |
|---|--------|-----------|-----------|
| R1 | AI nhận diện sai / độ tin thấp | Trải nghiệm feed kém | Ngưỡng confidence + fallback thủ công (bắt buộc); luôn cho sửa; AI lỗi không chặn luồng |
| R2 | Chi phí & latency AI Vision | Tốn tiền, chậm | Nén ảnh trước upload; timeout + retry giới hạn; cache theo ảnh; rate limit/ngày; mock provider cho dev |
| R3 | Gian lận thời gian (đổi giờ máy) | Ấp trứng/cooldown bị lách | Mọi thời gian tính phía server (`hatch_at`, cooldown); không tin client timestamp |
| R4 | Gian lận reward/currency | Kinh tế game vỡ | Currency qua transaction + `currency_transactions`; reward cap; idempotency; client không tự cộng |
| R5 | Co-op concurrency (double reward) | Trùng thưởng, sai state | Idempotency key + optimistic locking / transaction; server là nguồn sự thật |
| R6 | Rò rỉ khóa/bí mật | Lộ AI key, bypass RLS | Key chỉ ở Edge Function/secret; RLS mọi bảng; chỉ `NEXT_PUBLIC_*` (anon) ở client |
| R7 | RLS cấu hình sai | Lộ/mất dữ liệu người dùng | Viết RLS test (Phase 9); policy theo `auth.uid()` + quan hệ caregiver |
| R8 | Web Push không đáng tin (quyền, iOS Safari hạn chế, tab đóng) | Bỏ lỡ reminder | **In-app reminder bắt buộc** không phụ thuộc push; lịch tính từ server, không dựa `setTimeout` trong tab; service worker + scheduled push; hướng dẫn cấp quyền |
| R9 | Realtime scale / mất kết nối | Feed co-op trễ/lỗi | Fallback poll qua TanStack Query; reconcile khi reconnect; DB là chuẩn, realtime là lớp cập nhật |
| R10 | Privacy ảnh đồ ăn | Lộ ảnh riêng tư | Private bucket + signed URL ngắn hạn; xóa EXIF; không gửi ảnh vào analytics |
| R11 | Domain layer bị "nhiễm" browser API | Không tái dùng được cho mobile | Lint ranh giới `domain/` (không import react/next/window); browser API chỉ qua `adapters/`; review theo mục 24 CLAUDE.md |
| R12 | SSR/hydration & secret leak trong Next.js | Lỗi hydrate, lộ biến server | Tách server/client component rõ; chỉ `NEXT_PUBLIC_*` ra client; dùng `@supabase/ssr` cho session |
| R13 | Lạm dụng nội dung community | An toàn người dùng | Mặc định riêng tư; report/block/moderation; không lộ email |
| R14 | Lỗ hổng dependency gián tiếp (postcss trong Next.js) | 2 cảnh báo moderate khi `npm audit` | **Chấp nhận tạm thời** (rủi ro build-time thấp); theo dõi và nâng trong nhánh Next 16.x khi có bản vá. Chi tiết ở mục 3.1 |

### 3.1 Security dependency log — postcss (GHSA-qx2v-qp2m-jg93)

**Ngày ghi nhận:** 2026-07-10 (Phase 2, sau scaffold Next.js 16.2.10).

**Bối cảnh:** `npm audit` báo **2 cảnh báo mức moderate**, thực chất từ **một lỗ hổng gốc duy nhất**:

- Package dính lỗi: **`postcss` 8.4.31**, được **bundle bên trong Next.js** tại `node_modules/next/node_modules/postcss`.
- Loại phụ thuộc: **gián tiếp (transitive)** — không có trong `dependencies`/`devDependencies` của dự án. `next` (direct) bị liệt kê vì phụ thuộc bản postcss này.
- Phạm vi ảnh hưởng: `postcss < 8.5.10`. Lỗ hổng: XSS qua `</style>` không escape trong CSS Stringify output (CVSS 6.1, CWE-79).
- postcss ở **root-level** (do Tailwind v4 / `@tailwindcss/postcss`) là **8.5.16 — KHÔNG dính lỗi**. Chỉ bản bundle trong Next mới dính.
- Đánh giá rủi ro thực tế: **thấp** — postcss này chỉ chạy ở **build-time** trên CSS của chính dự án, không xử lý CSS từ nguồn không tin cậy lúc runtime.
- Bản vá tương thích qua npm: **chưa có**; `npm audit fix` chỉ đề xuất hạ `next` về `9.3.3` (semver-major, breaking) → không chấp nhận.

**Quyết định (đã duyệt — phương án (a)):**

- Giữ nguyên dependency hiện tại; **không** thêm `overrides` cho postcss.
- **Không** chạy `npm audit fix`; **không** chạy `npm audit fix --force`.
- Tạm chấp nhận 2 cảnh báo moderate vì nằm trong dependency gián tiếp của Next.js và rủi ro thực tế hiện được đánh giá thấp.
- Sẽ nâng cấp trong **cùng nhánh Next.js 16.x** khi có bản vá tương thích chính thức (bump postcss ≥ 8.5.10), sau đó chạy lại `npm audit` + build để xác minh.

## 4. Quyết định kỹ thuật đã duyệt

> Trạng thái: **ĐÃ DUYỆT**. Ràng buộc cho các phase sau.

- **D1 — AI provider** ✅
  - **development**: `MockVisionProvider`.
  - **staging & production**: **Gemini Vision** (provider thật đầu tiên).
  - Giữ **abstraction** `FoodVisionProvider` để thêm OpenAI sau **mà không sửa business logic**.
  - **Chưa có key** → toàn bộ luồng AI chạy được bằng mock (không chặn feed).
  - Env: `AI_PROVIDER` (`mock` dev, `gemini` staging/prod); `GEMINI_API_KEY` chỉ ở server.

- **D2 — Authentication** ✅
  - MVP: **email/password** trước.
  - Interface + cấu trúc sẵn cho Google Sign-In và Apple Sign-In.
  - Chưa tích hợp OAuth thật trong Phase 2 nếu chưa có credentials.

- **D3 — Styling** ✅ *(cập nhật cho web)*
  - Dùng **Tailwind CSS + shadcn/ui** (thay cho NativeWind).
  - **Đồng thời** duy trì **design tokens** riêng cho: màu sắc, typography, spacing, radius, shadow (trong `src/design-system/`).
  - **Không hard-code** style lặp lại trong page/component; style chung qua token/variant.

- **D4 — Payment & Ads** ✅
  - MVP dùng **mock adapter** cho rewarded ads, IAP và subscription.
  - Web billing/RevenueCat + ad network thật để phase sau.
  - Không triển khai thanh toán thật ở giai đoạn hiện tại.

### Quyết định nền tảng đã duyệt kèm theo
- **Định hướng WEB-FIRST**: Next.js App Router; mobile Expo ở **Phase 10**, dùng chung backend + `domain/`.
- **Routing**: **Next.js App Router** (thay Expo Router).
- **Notification**: **NotificationProvider** (adapter) + Web Push service worker; in-app reminder bắt buộc; không phụ thuộc timer trong tab.
- **PWA**: web app manifest + icon placeholder + cài home screen; offline nâng cao để sau.
- **Package version**: dùng `npx create-next-app` + `npm install`; kiểm tra tài liệu, không pin version thủ công thiếu căn cứ.
- **Quan hệ user ↔ pet**: nhiều-nhiều qua `pet_caregivers`; mỗi pet tối đa 2 caregiver (**Owner** + **Co-parent**).
- **Tái sử dụng cho mobile**: domain logic, Zod schema, API contracts, types tách khỏi UI; browser API bọc qua adapter.

## 5. Kế hoạch Phase 2 → Phase 9 (+ Phase 10)

| Phase | Mục tiêu | Đầu ra chính | Điều kiện hoàn thành |
|-------|----------|--------------|----------------------|
| **2 — Next.js foundation** | Khởi tạo nền tảng web | Next.js+TS strict, Tailwind+shadcn/ui, design tokens, Supabase client (browser+server), Auth email, App Router layout, error boundary, env validation (Zod), khung `domain/`+`adapters/`, tests, README | Web chạy, đăng nhập email, điều hướng cơ bản |
| **3 — Database & auth** | Schema + backend data | SQL migrations (enum, table, index, trigger, RLS), seed, DB functions, tích hợp Supabase Auth server-side | Migrate + seed sạch; RLS bật; session web hoạt động |
| **4 — Pet core** | Vòng đời pet | Egg selection, incubation, hatch, home room, pet state (`domain/`), pet action, inventory, cosmetic | Chọn→ấp→hatch→chăm pet→mặc item end-to-end trên web |
| **5 — AI food scan (web)** | Tính năng cốt lõi | Camera `getUserMedia` (adapter) + upload, `FoodVisionProvider` + mock + gemini, vision prompt, response schema, Edge Function, confirm screen, manual fallback, feed transaction, food history | Chụp/upload→(AI/thủ công)→feed→cập nhật chỉ số |
| **6 — Reminder & notification** | Nhắc việc & habit | Reminder CRUD, repeat schedule, in-app reminder, NotificationProvider + Web Push (service worker), permission flow, completion, reward cap, streak | Tạo→nhận in-app/push→hoàn thành→thưởng có giới hạn |
| **7 — Co-op & realtime** | Nuôi chung | Invite, link mời web, accept, shared pet, realtime activity, permission, concurrency protection | Hai tài khoản cùng chăm 1 pet, realtime, không double reward |
| **8 — Quest, mini game, inventory, shop** | Vòng lặp chơi | Daily quest, mini game (tap + memory), currency, inventory, shop, reward cap, mock rewarded ads | Kiếm coin→mua→mặc cosmetic; quest/mini game có cap |
| **9 — PWA, testing, security, deploy** | Ổn định & phát hành | Web app manifest + icons + install; service worker; unit/integration/RLS test; error handling; performance; security checklist; build & deployment (web) | Bộ test xanh; PWA cài được; checklist bảo mật đạt; deploy được |
| **10 — Expo mobile (tương lai)** | Mobile dùng chung | Expo app: UI mới + adapters mobile (Expo Camera, Expo Notifications, secure store), tái dùng Supabase + `domain/` | Mobile chạy các luồng MVP mà **không** sửa domain rules/backend |

### Nguyên tắc chuyển phase
Theo `CLAUDE.md` mục 28: sau mỗi phase liệt kê file thay đổi, cung cấp code đầy đủ, giải thích quyết định, đưa lệnh cài/chạy/kiểm thử, ghi rõ phần mock; **không** sang phase tiếp theo khi phase hiện tại chưa có cấu trúc đầy đủ.
