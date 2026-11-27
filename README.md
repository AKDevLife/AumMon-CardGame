# AumMon

AumMon Party Game Platform — เกม AumMon BLUFF (ปาร์ตี้ทายใจ 2–8 คน) และ AumMon Object Battle Card (เกมไพ่ 2–8 คน)
Server-authoritative · guest-first · ธีมเดียวทั้งเว็บ

## เอกสารหลัก

| ขอบเขต                    | Spec                                                                     | Roadmap                                                                        |
| ------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Platform (ฟังก์ชันกลาง)      | [`docs/platform/PLATFORM_SPEC.md`](./docs/platform/PLATFORM_SPEC.md)     | [`docs/platform/ROADMAP.md`](./docs/platform/ROADMAP.md)                       |
| AumMon BLUFF              | [`docs/games/bluff/SPEC.md`](./docs/games/bluff/SPEC.md)                 | [`docs/games/bluff/ROADMAP.md`](./docs/games/bluff/ROADMAP.md)                 |
| AumMon Object Battle Card | [`docs/games/object-battle/SPEC.md`](./docs/games/object-battle/SPEC.md) | [`docs/games/object-battle/ROADMAP.md`](./docs/games/object-battle/ROADMAP.md) |

สถานะรวม: [`docs/DEVELOPMENT_PROGRESS.md`](./docs/DEVELOPMENT_PROGRESS.md) · ประวัติ: [`docs/DEVELOPMENT_CHANGELOG.md`](./docs/DEVELOPMENT_CHANGELOG.md)

## Tech stack

React 19 + Vite + TypeScript (strict) · Tailwind CSS v4 · Supabase (Auth, PostgreSQL, Edge Functions, Realtime) · Vitest · Playwright · ESLint + Prettier · pnpm workspaces · Vercel (hosting)

## โครงสร้าง Repository

```text
src/                     # Frontend (React)
packages/game-engine/    # Pure TypeScript game engine — ZERO framework/Supabase deps
supabase/                # migrations, Edge Functions (game-*, rooms-*, admin-api), pgTAP tests
tests/architecture/      # Guard tests (engine isolation)
tests/e2e/               # Playwright
scripts/check-secrets.mjs
docs/
.github/workflows/ci.yml
```

## เริ่มต้นใช้งาน

ต้องมี Node.js ≥ 22 และ pnpm 10 (`corepack enable`)

```bash
pnpm install
cp .env.example .env.local   # ใส่ค่า PUBLIC ของ Supabase Dev project (ไม่บังคับใน Phase 1)
pnpm dev                     # http://localhost:5173
```

## คำสั่ง

| คำสั่ง                                | หน้าที่                                     |
| ----------------------------------- | ---------------------------------------- |
| `pnpm typecheck`                    | TypeScript project references (`tsc -b`) |
| `pnpm lint`                         | ESLint (รวมกฎแยก Game Engine)            |
| `pnpm format` / `pnpm format:check` | Prettier                                 |
| `pnpm test`                         | Vitest: `engine`, `architecture`, `web`  |
| `pnpm test:e2e`                     | Playwright (build + preview อัตโนมัติ)      |
| `pnpm build`                        | Production build → `dist/`               |
| `pnpm check:secrets`                | ตรวจ secret ใน repo และ `dist/`          |
| `pnpm check`                        | รันทุกอย่างข้างต้น (ยกเว้น e2e)                |

Supabase local (ต้องมี Docker): `pnpm exec supabase start`

## กฎสำคัญ

- **Game Engine isolation:** `packages/game-engine` ห้าม import React, Supabase, `node:*`, โค้ดใน `src/` หรือ `supabase/` และห้ามใช้ `Math.random`/`Date.now` — บังคับด้วย ESLint, tsconfig (`lib: ES2022`, `types: []`) และ architecture test
- **Server-authoritative:** Client ส่งเฉพาะเจตนา (card instance, target, choice, idempotency key) — ห้ามคำนวณผลเกมฝั่ง Client
- **Secrets:** ตัวแปร `VITE_*` ถูก bundle ไปที่ Browser — ใส่ได้เฉพาะค่า public; Secret/Service-role key อยู่ฝั่ง Edge Functions เท่านั้น; ห้าม commit ไฟล์ `.env*` (ยกเว้น `.env.example`)
- **กติกาที่ล็อก:** การเปลี่ยนกติกาที่กระทบผลเกมต้องได้รับอนุมัติและเพิ่ม `ruleset_version`
- **Git:** ห้าม push ตรงเข้า `main`; ใช้ feature branch + Pull Request ที่ผ่าน CI

## Roadmap

ดูตารางเอกสารหลักด้านบน (`pnpm progress` = % รวมทุก roadmap)

## Supabase Dev project (`AumMon-Dev`)

- Ref `yaxtzdhryctfjaspxvix` — **development only**; production is a separate project (task 6.8/7.8).
- Migrations: applied in order from `supabase/migrations/` and recorded in `supabase_migrations.schema_migrations`; never edit an applied migration.
- Edge Functions: `pnpm sync:engine && supabase functions deploy --remote=<ref> --use-api` (`verify_jwt = false` + import map are set per function in `config.toml`; functions verify JWTs themselves).
- Function secret `ALLOWED_ORIGINS` = Vercel preview pattern `https://*-aum-mon.vercel.app` + localhost.
- Playtest URL (always latest `main`): https://aum-mon-card-game-git-playtest-aum-mon.vercel.app
- Vercel **Preview** env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (publishable key only).
