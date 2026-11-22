# AumMon — Color Design System (Theme A · Balanced)

> Approved by the owner 2026-11-21. **Theme A — Playful Cartoon / Candy Fantasy, Balanced saturation.**
> Single source of truth for colors in code: `src/styles/index.css` (`:root` tokens + Tailwind `@theme`).
> Components never hard-code HEX: they use Tailwind classes `bg-am-*`, `text-am-*`, `border-am-*` or `var(--color-*)`.
> Display-only system: no game rule, card ID/stat, keyword, recipe or `ruleset_version` is affected.

## 1. Identity

| Role                       | Color                   | Rule                                   |
| -------------------------- | ----------------------- | -------------------------------------- |
| Brand Identity             | Deep Purple `#30205B`   | headers, hero panel, primary text      |
| Primary Highlight / CTA    | Golden Yellow `#FFC83D` | Play buttons, selection                |
| Liveliness                 | Candy Pink `#FF4F9A`    | decoration                             |
| Info                       | Sky Blue `#55C9F4`      | info, reactions                        |
| Healing / Success / Growth | Mint Green `#65D69A`    | confirm, heal, Evolution, valid target |
| Attack / Boost             | Orange `#FF914D`        | ATK, Haste, attack effects             |
| Damage / Danger / Error    | Red `#ED4966`           | damage, danger buttons, errors         |

Never put every bright color in one area: one highlight per area; backgrounds stay soft.

Identity kept unchanged: border `3px solid #2A1650` (`--border-color`), sticker shadow `0 5px 0 #2A1650`, pressed `0 2px 0 #2A1650` + `translateY(3px)`.

## 2. Master palette (tokens → HEX)

| Token                   | HEX       | Tailwind                        |
| ----------------------- | --------- | ------------------------------- |
| `--color-brand-primary` | `#30205B` | `am-brand`, `am-text`           |
| `--color-brand-deep`    | `#24143F` | `am-brand-deep`                 |
| `--color-brand-accent`  | `#FFC83D` | `am-title`                      |
| `--color-purple`        | `#8064C8` | `am-purple`                     |
| `--color-pink`          | `#FF4F9A` | `am-pink`, `am-round`           |
| `--color-blue`          | `#55C9F4` | `am-blue`                       |
| `--color-green`         | `#65D69A` | `am-green`, `am-confirm`        |
| `--color-orange`        | `#FF914D` | `am-orange`                     |
| `--color-red`           | `#ED4966` | `am-red`, `am-danger`           |
| `--color-soft-purple`   | `#E9DFFF` | `am-deco-purple`, `am-field`    |
| `--color-lavender`      | `#D8C6FA` | `am-lavender`                   |
| `--color-cream`         | `#FFFBEB` | `am-card` (surface)             |
| `--color-bg-main`       | `#F6F0FF` | `am-bg`, `am-slot`              |
| `--border-color`        | `#2A1650` | `am-ink` (borders/shadows only) |

### Text

| Token                    | HEX       | Tailwind          | Use                    |
| ------------------------ | --------- | ----------------- | ---------------------- |
| `--color-text-primary`   | `#30205B` | `am-text`         | body, titles           |
| `--color-text-secondary` | `#75658F` | `am-muted`        | descriptions, hints    |
| `--color-text-muted`     | `#8B809A` | `am-faint`        | placeholders, disabled |
| `--color-text-inverse`   | `#FFFBEB` | `am-inverse`      | on purple              |
| `--color-text-accent`    | `#5B2FB8` | `am-accent`       | links, focus ring      |
| `--color-text-danger`    | `#B9284A` | `am-danger-text`  | error messages         |
| `--color-text-success`   | `#164E35` | `am-success-text` | text on green          |
| `--color-text-info`      | `#173C55` | `am-info-text`    | text on blue           |

Legacy aliases (`--am-*`) still exist and point at these tokens, so older components keep working.

## 3. Lobby

| Component                  | HEX                                   | Where                             |
| -------------------------- | ------------------------------------- | --------------------------------- |
| Main background            | `#F6F0FF`                             | page `body`                       |
| Secondary background       | `#E9DFFF`                             | secondary buttons, rules pill     |
| Decoration                 | `#D8C6FA` / pink / blue (low opacity) | hero bubbles                      |
| Card surface               | `#FFFBEB`                             | panels, cards                     |
| Main header                | `#30205B`                             | home hero panel                   |
| Header highlight           | `#FFC83D`                             | "AumMon" title, Play mode buttons |
| Accent pink / blue / green | `#FF4F9A` / `#55C9F4` / `#65D69A`     | decoration, register (green)      |

## 4. Game table

| Element          | HEX       | Usage                                   |
| ---------------- | --------- | --------------------------------------- |
| Table background | `#FFFBEB` | play area                               |
| Current turn     | `#FFC83D` | yellow ring on the acting player        |
| Playable card    | `#65D69A` | green ring on cards the player may play |
| Reaction prompt  | `#55C9F4` | Umbrella reaction bar                   |

## 5. Card frame (`src/features/game/CardView.tsx`)

| Part             | HEX                           |
| ---------------- | ----------------------------- |
| Surface / border | `#FFFBEB` / `#2A1650`         |
| Title band       | `#E9DFFF` (Thai name)         |
| Points badge     | `#FFC83D` with `#30205B` text |
| Ability text     | `#30205B` / `#75658F`         |

## 6. Buttons (`src/components/StickerButton.tsx`)

| Variant             | Background | Text                        |
| ------------------- | ---------- | --------------------------- |
| `primary`           | `#FFC83D`  | `#30205B`                   |
| `secondary`         | `#E9DFFF`  | `#30205B`                   |
| `confirm` (success) | `#65D69A`  | `#164E35`                   |
| `info`              | `#55C9F4`  | `#173C55`                   |
| `danger`            | `#ED4966`  | `#FFFFFF` (large bold only) |
| `default` (neutral) | `#FFFBEB`  | `#30205B`                   |
| disabled            | `#DDD6E8`  | `#8B809A`, no shadow        |

States: hover `#FFE36E` · pressed `translateY(3px)` + pressed shadow · focus `3px` ring `#5B2FB8` (global `:focus-visible`) · loading = button text changes ("กำลังส่ง…") and the button is disabled, never shown as success. Small danger actions (admin) use `#FFE0EF` + `#B9284A` text.

## 7. Feedback & effects

| Event                | Primary               | Secondary             | Implemented as                                  |
| -------------------- | --------------------- | --------------------- | ----------------------------------------------- |
| Attack               | `#FF914D`             | `#FFC83D`             | board pulse (`am-fx-attack`) + sound            |
| Damage               | `#ED4966`             | —                     | heart shake + red pulse (`am-fx-damage`)        |
| Heal                 | `#65D69A`             | `#DDF8E9`             | heart green pulse (`am-fx-heal`)                |
| Draw card            | `#8064C8`             | `#E9DFFF`             | Draw/Search badge                               |
| Evolution            | `#65D69A`             | `#FFC83D`             | green top stripe + sound                        |
| Fusion               | `#FFC83D`             | `#8064C8`             | purple top stripe + sound                       |
| Guard block / Flying | `#65D69A` / `#55C9F4` | `#55C9F4` / `#FFFFFF` | keyword badges                                  |
| Victory              | `#FFC83D`             | `#FF4F9A`             | yellow result panel                             |
| Defeat               | `#ED4966`             | `#30205B`             | soft red panel, red text                        |
| Error                | `#ED4966`             | `#FFE0EF`             | alert: `#FFE0EF` bg, red stripe, `#B9284A` text |
| Notification         | `#FF4F9A`             | `#FFFFFF`             | turn badge                                      |

Effects use only `transform`/`box-shadow`, last ≤ 700 ms, never cover card text, and are disabled under `prefers-reduced-motion`.

## 8. Typography

- **Fredoka** (English, numbers, headings) + **Kanit** (Thai, body) — Google Fonts, SIL Open Font License 1.1, loaded in `index.html` with `display=swap`.
- `--font-display`: Fredoka → Kanit · `--font-body`: Kanit → Fredoka.
- Hierarchy: page title `text-3xl` display bold · section `text-xl` · card name `13px` bold · card text `11px` · stats `text-sm` bold tabular numbers.
- Thai card names use the full title width with `word-break: keep-all` so they wrap at word boundaries.

## 9. Accessibility (measured contrast, WCAG 2.1)

| Pair                              |         Ratio | Result                                              |
| --------------------------------- | ------------: | --------------------------------------------------- |
| Primary text on main bg / cream   | 12.69 / 13.65 | AA                                                  |
| Secondary text on main bg / cream |   4.69 / 5.04 | AA                                                  |
| Secondary text on soft purple     |          4.10 | large text only → use primary text on `#E9DFFF`     |
| Muted text on cream               |          3.58 | non-essential / large only                          |
| Disabled text on disabled bg      |          2.63 | allowed for disabled controls (WCAG exempt)         |
| Primary text on yellow (CTA)      |          9.16 | AA                                                  |
| Success text on green             |          5.35 | AA                                                  |
| Info text on blue                 |          6.09 | AA                                                  |
| White on danger red               |          3.65 | large bold only (danger buttons are `text-xl` bold) |
| Primary text on Candy Pink        |          4.61 | AA                                                  |
| Danger text on error bg           |          4.95 | AA                                                  |
| Inverse text on exhausted         |          5.04 | AA                                                  |

No white text on yellow, light blue or light pink. Every state has an icon or text in addition to color. Axe (WCAG 2.1 AA) runs in E2E (`tests/e2e/a11y.spec.ts`).

## 10. Usage guidelines

1. Add a new color only as a token in `src/styles/index.css` + a row in this document, with a reason.
2. Choose by **role** (`am-player`, `am-danger-text`), not by hue.
3. One highlight per area; decoration stays behind content and below 50 % opacity.
4. Keep the border + sticker shadow on interactive surfaces.
5. Test on iPhone width (390 px) and desktop; Thai text must not clip.
