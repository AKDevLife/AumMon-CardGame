# AumMon — UI/UX Guidelines v2 (15.5 — approved)

> **APPROVED by owner 2026-11-25** (U1–U3 after prototype review; claim buttons show option text). Extends `docs/color_design_system.md` (Theme A, light, EDO) with a **dark party theme** for v2 / BLUFF. Clickable prototype: `/prototype/bluff` on the Vercel preview (mock data, no backend).

## 1. Principles

- Mobile first (360 × 640 baseline), one hand, thumb zone: primary action fixed at the bottom.
- One decision per screen; text short and playful (tagline _"Say Less. Bluff More. Troll Your Friends."_ stays English, everything else Thai).
- Always show the timer and who is still deciding; never show hidden choices before Reveal.
- Touch targets ≥ 48 px; focus ring visible; `prefers-reduced-motion` turns animations off.

## 2. Dark party theme (tokens, class `.theme-party`)

| Token                    | HEX       | Use                             |
| ------------------------ | --------- | ------------------------------- |
| `--party-bg`             | `#140B26` | page background                 |
| `--party-surface`        | `#22143F` | cards, panels                   |
| `--party-surface-raised` | `#2E1C55` | selected / hover panels         |
| `--party-border`         | `#4A3480` | panel borders                   |
| `--party-text`           | `#F6F0FF` | body text (contrast 16:1 on bg) |
| `--party-muted`          | `#B9A9DD` | hints (≥ 7:1 on bg)             |
| `--party-accent`         | `#FFC83D` | primary button, timer, scores   |
| `--party-pink`           | `#FF4F9A` | bluff / claim highlights        |
| `--party-blue`           | `#55C9F4` | prediction                      |
| `--party-green`          | `#65D69A` | correct / locked                |
| `--party-red`            | `#FF6B85` | wrong / negative points         |

- Brand colours stay the same as Theme A (accent, pink, blue, green) so EDO and v2 feel related.
- Text on the accent button uses `--party-bg` (contrast ≥ 10:1).

## 3. Screens (MVP)

| Screen  | Key elements                                                                                |
| ------- | ------------------------------------------------------------------------------------------- |
| Home    | logo + tagline, nickname field (guest), "สร้างห้อง", "เข้าห้องด้วยโค้ด"                           |
| Lobby   | big room code + share link, player chips with ready state, host settings (M1), start button |
| Read    | situation + options A–D, phase timer                                                        |
| Claim   | preset claims "ฉันเลือก A–D" + taunts; live claim feed                                        |
| Lock    | three rows: คำตอบของฉัน · ห้องจะเลือกอะไร · เดิมพัน 0/1/2; "ล็อก" button; who-locked chips        |
| Reveal  | votes per option, each player's claim vs real answer ("โกหก!" stamp), narration line        |
| Score   | round points with reasons, scoreboard, final round ×2 banner                                |
| Results | podium, "อ่านใจถูก X ครั้ง" per player (P2), rematch, share                                     |

## 4. Copy & tone

- Teasing, never insulting; no rude slang. Narration examples: "ห้องนี้โกหกเก่งกว่าที่คิด", "มีคนพูดจริง… แต่ไม่มีใครเชื่อ".
- Numbers use tabular figures; points shown with sign (+3 / −1).

## 5. Owner review (prototype)

| ID    | Question                                                                      |
| ----- | ----------------------------------------------------------------------------- |
| U1 ✅ | Dark party theme colours and feel OK?                                         |
| U2 ✅ | Screen flow Home → Lobby → Read → Claim → Lock → Reveal → Score → Results OK? |
| U3 ✅ | Lock screen (answer + prediction + wager on one screen) easy enough on phone? |
