# AumMon — AI Art Production Workflow

> คู่มือหลักสำหรับเจ้าของ (ไม่ต้องวาดเอง): Claude วางแผน เขียน Prompt ตรวจภาพ และนำเข้าเกม — เจ้าของแค่ **คัดลอก Prompt ไปสร้างภาพ → ส่งภาพกลับมา → อนุมัติหรือขอแก้**
> Claude สร้างภาพเองไม่ได้ในโปรเจกต์นี้ (ไม่มีเครื่องมือสร้างภาพ) จึงใช้ AI สร้างภาพภายนอก เช่น ChatGPT (ดู Prompt Library §0)

Documents: Art Direction → Style Bible → Character Library → Prompt Library → QA Guidelines → Asset Catalog → Handoff (all in `docs/art-production/`).

## 1. Stages and gates

| #    | Stage                                   | Output                      | Prompt                  | Gate (must be true before next stage)          |
| ---- | --------------------------------------- | --------------------------- | ----------------------- | ---------------------------------------------- |
| 1    | Art Direction                           | choose A/B/C                | IMG-DIR-01              | owner approves a direction (13.2)              |
| 2    | Style Bible                             | locked style + sample sheet | IMG-STY-01, CL-STY-01   | owner approves Style Bible v1.0 (13.3)         |
| 3    | Character Concept                       | 16 concepts                 | IMG-CHR-01              | each concept Approved (13.4)                   |
| 4    | Reference Sheets                        | 16 sheets + lineup check    | IMG-REF-01              | each sheet Approved + consistency check (13.5) |
| 5A   | Card artwork                            | 16 card arts                | IMG-CRD-01              | Approved                                       |
| 5B   | Card back / frame                       | card back (frame optional)  | IMG-BCK-01 / IMG-FRM-01 | Approved                                       |
| 5E/F | Core UI art + backgrounds               | menu, lobby, room, table    | IMG-UI-01, IMG-BG-01    | Approved                                       |
| 6    | QA                                      | report per image            | CL-QA-01                | —                                              |
| 7    | Asset management                        | catalog rows                | CL-APR-01               | —                                              |
| 8    | Integration                             | assets in game, PR merged   | CL-INT-01               | Integrated                                     |
| 5C/D | Emotes / animated emotes, VIP, seasonal | Priority 4                  | IMG-EMO-01 / IMG-ANI-01 | only after Priority 1–3 Integrated             |

Small batches: produce 1 character end-to-end first (pilot: AM013 กุญแจ), then the remaining 15 in groups of 4.

## 2. ขั้นตอนของเจ้าของ (ทุกงานเหมือนกัน)

1. พิมพ์หา Claude: CL-PLAN-01 (เช่น "เริ่มงานภาพ card art ของ AM013") → Claude ส่ง **Task Card** (§3) ที่เติม Prompt ให้พร้อมแล้ว
2. เปิด ChatGPT → อัปโหลดภาพอ้างอิงตามที่ Task Card ระบุ (โหลดจาก GitHub หรือที่ Claude ส่งให้) → วาง Prompt → สร้างภาพ
3. ดาวน์โหลดภาพ → ส่งกลับมาให้ Claude พร้อม CL-QA-01
4. Claude ตรวจ (Pass / Minor / Fail) — ถ้าต้องแก้ จะได้ Prompt แก้ (IMG-REV-01) ไปวางต่อในแชทเดิมของ ChatGPT
5. พอใจแล้วพิมพ์ "อนุมัติ {Asset ID}" (CL-APR-01) → Claude เก็บเป็นต้นฉบับ
6. เมื่อภาพชุดหนึ่งอนุมัติครบ → "นำเข้าเกม" (CL-INT-01) → Claude ทำ PR ตามปกติ

ถ้าผลไม่ดี: ไม่ต้องแก้ภาพเอง — ส่งให้ Claude แล้วรับ Prompt แก้ ลองได้ 3 รอบ; ถ้ายังไม่ได้ Claude จะปรับ Prompt หลัก (เพิ่มเวอร์ชัน) หรือแนะนำเปลี่ยนเครื่องมือ

## 3. Task Card template (Claude fills this for every task)

```text
Task ID:        13.x
Asset ID:       AMA-…            File: ama-…-vNN.png
Objective:      …
References:     upload → art-production/approved/…  (style only / exact character)
AI tool:        ChatGPT image (alt: …)
Prompt:         IMG-…-NN vN, filled in, ready to copy
Negative:       …
Settings:       ratio …, size …, variants …, transparent yes/no
Expected:       …
Save to:        art-production/<folder>/  (Claude saves it when you send it)
QA:             AumMon_Art_QA_Guidelines.md §2–§5 (+ shrink test …)
Next step:      …
```

## 4. Revision workflow

QA Fail / owner reject → row = Revision Required → Claude writes IMG-REV-01 with numbered fixes → new file `-v(NN+1)` → QA again. If the same defect repeats 3 times, Claude updates the main prompt (new prompt version, logged in the Prompt Library change log). Old versions move to `art-production/rejected/`.

## 5. Asset-type specs

### 5A Card artwork

3:4 master 1152×1536 PNG → game WebP 600×800. Top 15 % / bottom 25 % calm; game draws name, points, ability text and frame (`src/features/game/CardView.tsx`). Must read at 80 px wide (compact) and 112 px (hand).

### 5B Card frame / back

Frame is code today (Theme A tokens); a painted frame is optional. Card back 3:4, symmetric, readable at 28×40 px; replaces `CardBack` in `src/features/game/GameIcons.tsx` at integration.

### 5C Emotes

Order per character: happy → celebrating → angry → crying → surprised → laughing → confused → taunting. Start with 4 (happy, celebrating, angry, crying) for all 16 only after core assets are Integrated. 1:1, transparent, white sticker border, game WebP 256×256. (Emote sending in multiplayer is a future feature — needs its own roadmap task.)

### 5D Animated emotes

Spec per animation: concept · character action · 3–4 key poses · 8–12 frames · 12 fps · loop type · transparent background · sprite sheet 4 columns, 256×256 cells, PNG · preview animated WebP. Key poses from IMG-ANI-01; in-between frames from an AI animation tool or by duplicating key poses (simple pop animation is acceptable).

### 5E UI graphics

Generated: decorative art only (icons, avatar frames, profile frames, VIP badges, loading illustration, empty-state illustrations). Code-rendered: buttons, panels, text, numbers. Icons 1024 master → 128/256 px WebP.

### 5F Backgrounds and themes

Phone 9:16 1024×1792 + desktop 16:9 1792×1024, WebP ≤ 300 KB, calm center. Themes reuse the same base scene with seasonal props (Songkran, Loy Krathong, New Year …) — Priority 4.

## 6. Integration path (stage 8)

1. Export WebP at game size (Claude can resize with a script; or squoosh.app).
2. Save under `public/assets/…` with the catalog path.
3. Code: card art map `cardId (Dnn) → /assets/cards/am0nn.webp` with the current emoji (`CARD_ART` in `src/features/game/labels.ts`) as fallback while art is missing.
4. Tests + E2E + visual screenshot check; PR → CI → merge.
5. Catalog row → Integrated (final path, source file, prompt version).

## 7. Approval boundaries

Claude may propose and prepare everything. Owner approval is required to: lock the Art Direction, lock the Style Bible, finalize each character design, replace any Approved asset, or change the visual identity.
