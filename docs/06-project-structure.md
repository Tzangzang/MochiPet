# 06 — Project Structure (Web-first)

> Quy ước tổ chức code cho MochiPet **web-first** (Next.js App Router). Tách **domain** (tái sử dụng cho mobile) khỏi **UI** và khỏi **browser API** (bọc qua adapter). Đây là kế hoạch cấu trúc (Phase 1) — chưa khởi tạo project.

## 1. Cấu trúc thư mục (đã duyệt)

```
MochiPet/
├── CLAUDE.md
├── docs/                      # Tài liệu (Phase 1)
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── .env.example
│
├── public/
│   ├── manifest/              # Web app manifest (PWA)
│   ├── icons/                 # Icon placeholder (PWA + favicon)
│   └── assets/                # Mock pet / food / room assets
│
├── src/
│   ├── app/                   # Next.js App Router (route, layout, page)
│   │   ├── layout.tsx         # Root layout: providers, error boundary
│   │   ├── page.tsx           # Landing / splash / redirect theo auth
│   │   ├── (auth)/            # login, register
│   │   ├── (onboarding)/      # các bước onboarding
│   │   ├── (app)/             # khu vực sau đăng nhập
│   │   │   ├── home/          # Home room
│   │   │   ├── pet/           # detail, collection, wardrobe, room
│   │   │   ├── food/          # camera scan, result, manual select
│   │   │   ├── egg/           # incubation, hatch result
│   │   │   ├── reminders/     # list, create, detail
│   │   │   ├── coop/          # invite, activity
│   │   │   ├── quests/        # daily/weekly quests
│   │   │   ├── mini-games/    # game list + game
│   │   │   ├── shop/          # shop + inventory
│   │   │   ├── community/     # feed, public profile
│   │   │   └── settings/      # settings, notification, privacy
│   │   └── api/               # (tùy chọn) route handler mỏng, ủy quyền cho Edge Function
│   │
│   ├── components/            # UI dùng chung (bao gồm shadcn/ui wrappers)
│   │
│   ├── features/              # Ghép UI + hook theo feature (KHÔNG chứa domain rules)
│   │   ├── auth/ onboarding/ pets/ eggs/ feeding/ food-scan/
│   │   ├── coop/ reminders/ quests/ inventory/ shop/
│   │   ├── mini-games/ community/
│   │
│   ├── domain/               # ⬅ Business logic THUẦN, tái sử dụng cho mobile
│   │   ├── pet-state/         # lazy calculation chỉ số
│   │   ├── hatch/             # roll rarity, kết quả hatch (rule)
│   │   ├── feeding/           # tác động food category lên chỉ số
│   │   ├── currency/          # rule cộng/trừ, reward cap
│   │   ├── reminder/          # tính lịch, streak logic
│   │   └── coop/              # quyền owner/co-parent, concurrency rule
│   │
│   ├── services/             # Tích hợp ngoài
│   │   ├── supabase/          # client (browser + server), queries, realtime
│   │   ├── ai/                # FoodVisionProvider + mock + gemini adapter
│   │   ├── analytics/         # event naming + tracker
│   │   ├── notifications/     # NotificationProvider (web push + in-app)
│   │   ├── purchases/         # IAP/subscription adapter (mock)
│   │   └── ads/               # rewarded ad adapter (mock)
│   │
│   ├── adapters/             # ⬅ Bọc browser API sau interface
│   │   ├── camera/            # getUserMedia wrapper
│   │   ├── storage/           # localStorage/secureStorage wrapper
│   │   ├── push/              # service worker + Web Push
│   │   └── clipboard/ ...
│   │
│   ├── hooks/                # Hook dùng chung
│   ├── stores/               # Zustand stores (client state)
│   ├── schemas/              # Zod schemas (env, AI response, forms, API contract)
│   ├── types/                # TypeScript types & API contracts dùng chung
│   ├── utils/                # Helper thuần
│   ├── config/              # Cấu hình runtime (đọc env), feature flags client
│   └── design-system/        # tokens (color, typography, spacing, radius, shadow), variants
│
└── supabase/
    ├── config.toml
    ├── migrations/           # SQL migrations (Phase 3)
    ├── functions/            # Edge Functions (Deno/TS)
    │   ├── _shared/          # auth guard, validation, AI provider, response helpers
    │   ├── analyze-food-image/  confirm-food-scan/
    │   ├── hatch-egg/  speed-up-hatch/
    │   ├── perform-pet-action/  feed-pet/  calculate-pet-state/
    │   ├── create-coop-invite/  accept-coop-invite/
    │   ├── complete-reminder/  claim-quest-reward/  claim-ad-reward/
    │   ├── start-mini-game-session/  finish-mini-game-session/
    │   ├── generate-pet-dialogue/  create-community-post/  report-content/
    └── seed.sql              # Seed data (Phase 3)
```

### Quy ước mỗi feature
Mỗi thư mục trong `features/<name>/`:
```
features/<name>/
├── components/     # UI riêng của feature
├── hooks/          # use... (data + wiring; gọi domain + services)
├── api.ts          # gọi Edge Function / query Supabase
├── types.ts        # types riêng feature
├── schema.ts       # Zod schema riêng feature
└── __tests__/      # test wiring
```
**Business rule không nằm ở đây** — đặt trong `domain/<name>/` và có `__tests__` riêng. Route/page trong `src/app/...` chỉ **lắp ráp** UI + gọi hook của feature.

## 2. Cấu trúc Supabase (backend, dùng chung web + mobile)

- `supabase/migrations/` — SQL migrations (enum, table, index, trigger `updated_at`, RLS).
- `supabase/functions/` — Edge Functions (danh sách theo mục 20 `CLAUDE.md`).
- `supabase/seed.sql` — seed data.
- Backend **không thay đổi** khi thêm mobile; mobile chỉ đổi client + adapters.

## 3. Quy tắc tổ chức code theo feature

1. **Ba lớp tách bạch**: `app/`/`features/`/`components/` (UI) → `domain/` (rule thuần) → `services/`+`adapters/` (I/O & browser API).
2. **Hướng phụ thuộc một chiều**: UI → domain + services; **domain không import** UI, React, Next, hay browser API.
3. **Browser API luôn qua `adapters/`**: camera, push/service worker, storage, clipboard… có interface + web implementation; mobile (Phase 10) cấp implementation khác.
4. **Schema là hợp đồng**: env, AI response, form, API contract định nghĩa bằng Zod trong `schemas/` (hoặc `features/*/schema.ts`); type suy ra từ schema.
5. **Client state vs server state**: Zustand cho UI/ephemeral; TanStack Query cho dữ liệu server + cache + optimistic update.
6. **Không hard-code business config/secret/style**: config từ `config/` (đọc env) + `app_config`/`feature_flags` backend; style qua design tokens/variants, không lặp trong page.
7. **Mock có thể thay thế**: AI, ads, purchases, notification đều qua interface; có mock mặc định khi thiếu cấu hình.
8. **Đặt tên nhất quán** giữa web, mobile và server (cùng food category enum, rarity enum, API contract).
9. **Test cạnh code**: ưu tiên test cho hatch probability, pet state, currency, co-op concurrency, AI parser — đặt trong `domain/*/__tests__`.

## 4. Vì sao tách `domain/` và `adapters/`
Đây là điều kiện để **Phase 10 (Expo mobile)** dùng lại toàn bộ business rules mà không viết lại: mobile chỉ cần UI mới + implementation adapter mới (Expo Camera thay `getUserMedia`, Expo Notifications thay Web Push, secure store thay localStorage), còn `domain/` + Supabase giữ nguyên.
