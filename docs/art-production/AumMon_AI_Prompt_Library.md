# AumMon — AI Prompt Library

> Two kinds of prompts, never mixed:
>
> - **CL-** = **Claude Prompts** — paste into Claude (this project chat) for planning, specs, QA, tracking, integration.
> - **IMG-** = **Image Generator Prompts** — paste into an external image tool. The tool cannot see the repository: always upload the listed reference images yourself.
>
> Placeholders: `{STYLE_BLOCK}` = Style Bible §17 (text + negative), `{CHARACTER_BLOCK}` = the character's block in the Character Library, `{ASSET_ID}` = Asset Catalog ID.
> Prompt ID format: `IMG-<STAGE>-<NN>` / `CL-<STAGE>-<NN>`, version `vN` (bump when wording changes; record the version used in the Asset Catalog).

## 0. Recommended tools

| Tool                                                                                            | Use for                                                | Why                                                                                                               |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| **ChatGPT (image generation)** — primary                                                        | concepts, reference sheets, card art, edits            | accepts uploaded reference images, conversational fixes ("make the outline thicker"), good at keeping a character |
| Midjourney (alternative)                                                                        | exploring directions, backgrounds                      | strong style; use character/style reference upload features                                                       |
| Background remover (e.g. remove.bg, Photoroom, or the generator's own "transparent background") | cut-outs, emotes                                       | transparent PNG                                                                                                   |
| Squoosh (squoosh.app)                                                                           | resize + WebP export                                   | free, in browser                                                                                                  |
| Claude (this project)                                                                           | everything CL-* , QA of results, tracking, integration | reads the repo, updates docs/code                                                                                 |

Settings shown below are targets; if a tool cannot set them, pick the closest size and ratio.

---

## IMG-DIR-01 v1 — Art Direction test

- **Tool:** ChatGPT image / Midjourney · **Purpose:** compare directions A/B/C on one character
- **Input:** none · **References:** none
- **Main prompt:**

```text
Create a game character illustration for a casual mobile card game called AumMon, where everyday objects are cute characters. Character: an old-fashioned golden key standing upright, the round bow on top is its head with a face, rounded teeth are its feet, tiny stubby arms, calm cool personality, small knowing smile.
Art style: {DIRECTION}
Centered, full body, front three-quarter view, simple soft pastel background, no text.
```

`{DIRECTION}` = one of:

- A: `soft 3D vinyl designer-toy, smooth matte plastic, thick deep purple outline, candy-bright pastel colors, soft studio light`
- B: `hand-painted storybook gouache illustration, visible brush strokes, warm paper texture, muted warm colors`
- C: `bold 2D cel-shaded arcade cartoon, flat colors, hard shadows, neon pink and cyan rim lights, dark navy background`
- **Negative:** `text, letters, numbers, watermark, logo, realistic photo, horror, extra limbs, deformed face, multiple characters`
- **Output:** 3 images (one per direction) · **Ratio:** 1:1 · **Resolution:** 1024×1024 · **Format:** PNG
- **Naming:** `ama-dir-am013-a-v01.png` (b / c) → `art-production/references/`
- **Use:** run once per direction, send the 3 images to Claude with CL-QA-01.
- **Checklist:** object obvious? cute and friendly? readable when shrunk to 80 px? fits the yellow/purple UI?

## IMG-STY-01 v1 — Style Bible sample sheet

- **Tool:** ChatGPT image · **Purpose:** one image proving the Style Bible before locking it
- **Input:** approved direction · **References:** best IMG-DIR-01 image
- **Main prompt:**

```text
Using the attached image as the style reference, create a style sample sheet with 4 different AumMon characters in a row on a cream background: a golden key, a pink rubber band, a mint green trash bin, a sky blue tape roll. All share exactly the same rendering style, eye style, outline thickness and lighting.
{STYLE_BLOCK}
```

- **Negative:** Style Bible negative
- **Output:** 1 sheet · **Ratio:** 16:9 · **Resolution:** 1792×1024 (or 1536×1024) · **Format:** PNG
- **Naming:** `ama-sty-sample-v01.png` → `art-production/references/`
- **Checklist:** same eyes / outline / light across all 4? no text? colors match palette?

## IMG-CHR-01 v1 — Character Concept

- **Tool:** ChatGPT image · **Purpose:** 1 concept per character (Stage 3)
- **Input:** Character Block · **References:** approved style sample `ama-sty-sample-vNN.png` (style only)
- **Main prompt:**

```text
Create a character concept for the mobile card game AumMon. Match the attached style reference exactly (style only, not the characters).
{CHARACTER_BLOCK}
Full body, front three-quarter view, standing in its signature pose, centered with empty space around it, plain cream (#FFFBEB) background, one character only.
{STYLE_BLOCK}
```

- **Negative:** Style Bible negative
- **Output:** 2–4 variants · **Ratio:** 1:1 · **Resolution:** 1024×1024 · **Format:** PNG
- **Naming:** `ama-chr-am0nn-v01.png` (variants `-v01a`, `-v01b`) → `art-production/concepts/`
- **Use:** generate, pick the best 1–2, send to Claude with CL-QA-01. Do not move on until the owner approves.
- **Checklist:** Art QA Guidelines §2 (identity) + §3 (visual quality).

## IMG-REF-01 v1 — Character Reference Sheet

- **Tool:** ChatGPT image · **Purpose:** turnaround + expressions (Stage 4); becomes the master reference
- **Input:** Character Block · **References:** the **approved concept** of this character (required)
- **Main prompt:**

```text
Create a character reference sheet of the attached character. Keep the exact same design, colors, proportions, face and outline as the attached image.
{CHARACTER_BLOCK}
Layout on a plain white background, evenly spaced, no labels, no text:
Row 1: front view, three-quarter view, side view, back view (full body, same size, neutral expression).
Row 2: face close-ups: neutral, happy, angry, sad, surprised.
Row 3: one large signature pose.
{STYLE_BLOCK}
```

- **Negative:** Style Bible negative + `different character, inconsistent design, labels, text`
- **Output:** 1 sheet · **Ratio:** 3:2 · **Resolution:** 1536×1024 (or larger) · **Format:** PNG
- **Naming:** `ama-ref-am0nn-v01.png` → `art-production/character-sheets/`; approved copy → `art-production/approved/`
- **Use:** if one view is wrong, fix with IMG-REV-01 instead of regenerating everything. If the tool cannot do the whole sheet, generate rows separately with the same references (`-r1`, `-r2`, `-r3`).
- **Checklist:** all views same character? colors identical? back view plausible? no text?

## IMG-CRD-01 v1 — Card Artwork

- **Tool:** ChatGPT image · **Purpose:** art for card `Dnn` (Stage 5A). Card name, points and text are drawn by the game, **not** the image.
- **Input:** Character Block · **References:** approved reference sheet (required)
- **Main prompt:**

```text
Create card artwork of the attached character for a mobile card game. Keep the character exactly as in the reference sheet.
{CHARACTER_BLOCK}
Pose: its signature pose, dynamic but readable, full body visible.
Composition: portrait card art, character centered and filling the middle 65% of the image; keep the top 15% and bottom 25% calm and empty (UI text will be placed there by the game); soft gradient background from cream to the character's accent pastel with 2–3 small floating rounded shapes; clear silhouette.
{STYLE_BLOCK}
```

- **Negative:** Style Bible negative + `card frame, border, title, numbers, UI elements`
- **Output:** 2 variants · **Ratio:** 3:4 · **Resolution:** 1152×1536 (or 1024×1365) · **Format:** PNG master → WebP 600×800 game export
- **Naming:** master `ama-card-am0nn-v01.png` → `art-production/card-art/`; game `public/assets/cards/am0nn.webp`
- **Checklist:** QA §2–§5; shrink test at 80 px and 120 px width.

## IMG-FRM-01 v1 — Card Frame (optional)

- **Tool:** ChatGPT image · **Purpose:** decorative frame overlay. Current game UI draws the frame in code (`CardView.tsx`, Theme A tokens) — only produce this if the owner wants a painted frame.
- **References:** 2 approved card artworks (style)
- **Main prompt:**

```text
Create an empty decorative card frame for a cute mobile card game, portrait, rounded corners, thick deep purple (#2A1650) outline, cream (#FFFBEB) inner border, small golden yellow (#FFC83D) corner ornaments shaped like tiny stars and buttons, completely transparent/empty center window, empty top banner and empty bottom text panel, flat clean vector-like toy style, no text.
```

- **Negative:** `text, letters, numbers, character, artwork in the center, watermark`
- **Output:** 1 · **Ratio:** 3:4 · **Resolution:** 1152×1536 · **Format:** PNG with transparent center (remove background after)
- **Naming:** `ama-ui-cardframe-std-v01.png` → `art-production/ui-assets/`
- **Checklist:** center fully transparent, edges symmetric, readable text areas left empty.

## IMG-BCK-01 v1 — Card Back

- **Tool:** ChatGPT image · **References:** style sample
- **Main prompt:**

```text
Create the back design of a playing card for the cute mobile card game AumMon: deep purple (#30205B) background with a subtle diagonal stripe pattern, a centered round golden yellow (#FFC83D) emblem made of tiny everyday objects (key, umbrella, scissors, tape) arranged in a circle, thick deep purple outline, soft vinyl-toy rendering, symmetric, no text, no letters.
```

- **Negative:** `text, letters, numbers, logo, watermark, asymmetric, cluttered`
- **Output:** 1 · **Ratio:** 3:4 · **Resolution:** 1152×1536 · **Format:** PNG → WebP 300×400
- **Naming:** `ama-ui-cardback-v01.png`; game `public/assets/ui/card-back.webp`
- **Checklist:** reads as a card back at 28×40 px (table view), symmetric, no text.

## IMG-EMO-01 v1 — Emote (static)

- **Tool:** ChatGPT image + background remover · **References:** approved reference sheet (required)
- **Main prompt:**

```text
Create a sticker-style emote of the attached character. Keep the exact design from the reference sheet.
{CHARACTER_BLOCK}
Emotion: {EMOTION} — {EMOTION_DETAIL}.
Upper body or full body, big readable expression, thick white sticker border around the deep purple outline, transparent background, centered, one character only.
{STYLE_BLOCK}
```

`{EMOTION}`: happy · laughing (eyes closed, tears of joy) · crying (big tears) · angry (puffed cheeks, steam) · surprised (wide eyes, "o" mouth) · confused (question-mark swirl shape, no text) · celebrating (arms up, confetti) · taunting (playful tongue out, wink — friendly, not rude)

- **Negative:** Style Bible negative + `background, scenery, rude gesture, middle finger`
- **Output:** 1 per emotion · **Ratio:** 1:1 · **Resolution:** 1024×1024 · **Format:** transparent PNG → WebP 256×256
- **Naming:** `ama-emo-am0nn-happy-v01.png` → `art-production/emotes/`; game `public/assets/emotes/am0nn-happy.webp`
- **Checklist:** readable at 48 px, transparent edges clean, emotion obvious without text.

## IMG-ANI-01 v1 — Animated Emote key poses

- **Tool:** ChatGPT image (key poses) → optional AI video/animation tool for in-betweens · **References:** approved emote + reference sheet
- **Spec (fill per emote, see Workflow §5D):** concept · action · key poses (3–4) · frame count 8–12 · 12 fps · loop (yes/ping-pong/no) · transparent background · sprite sheet 4 columns × N rows, each cell 256×256 · export PNG sprite sheet + WebP animated preview
- **Main prompt (one image per key pose):**

```text
Create key pose {N} of {TOTAL} for a short looping emote animation of the attached character: {ACTION}. Pose {N}: {POSE_DESCRIPTION}. Same size, same position and same camera as the previous poses so frames line up; transparent background; thick white sticker border.
{CHARACTER_BLOCK}
{STYLE_BLOCK}
```

- **Negative:** Style Bible negative + `motion blur, camera change, different size`
- **Naming:** `ama-ani-am0nn-celebrate-k1-v01.png` … ; sheet `ama-ani-am0nn-celebrate-sheet-v01.png` → `art-production/animations/`; game `public/assets/animations/am0nn-celebrate.png`
- **Checklist:** frames aligned (same size/position), loop has no jump, character consistent in every frame.

## IMG-UI-01 v1 — UI asset (icon / button art / panel / profile frame / avatar / VIP element / empty state)

- **Tool:** ChatGPT image · **References:** style sample + screenshot of the current screen (ask Claude for one)
- **Main prompt:**

```text
Create a {UI_ELEMENT} for the cute mobile card game AumMon: {DESCRIPTION}. Flat soft vinyl-toy look matching the attached style, thick deep purple (#2A1650) outline, Theme colors golden yellow #FFC83D, candy pink #FF4F9A, sky blue #55C9F4, mint #65D69A, lilac #E9DFFF, cream #FFFBEB. Simple shapes readable at small size, centered, transparent background, no text.
```

- **Negative:** `text, letters, numbers, watermark, realistic, clutter, thin lines`
- **Output:** · **Ratio:** 1:1 (icons, avatars, frames) or as specified · **Resolution:** 1024×1024 → export 128/256 px WebP or SVG-like PNG · **Format:** transparent PNG
- **Naming:** `ama-ui-<element>-<name>-v01.png` → `art-production/ui-assets/`; game `public/assets/ui/<element>-<name>.webp`
- **Rule:** buttons and panels with text stay as code (StickerButton, Tailwind); only decorative art is generated.

## IMG-BG-01 v1 — Background / theme

- **Tool:** ChatGPT image or Midjourney · **References:** style sample
- **Main prompt:**

```text
Create a {SCREEN} background for the cute mobile card game AumMon: {SCENE}. Soft, low-contrast pastel toy-desk world in vinyl-toy style, slightly blurred depth, gentle light, calm center area with no details where the game table/cards/UI will sit, colors from deep purple #30205B, lilac #E9DFFF, cream #FFFBEB with small golden yellow and pink accents. {THEME}. No characters in the center, no text.
```

`{SCREEN}`: main menu / lobby / room / game table · `{THEME}`: default / Songkran / Loy Krathong / New Year / Halloween / event name

- **Negative:** `text, letters, watermark, busy center, high contrast clutter, dark scene, characters in the center`
- **Output:** · **Ratio:** 9:16 (phone portrait) + 16:9 (desktop) · **Resolution:** 1024×1792 and 1792×1024 · **Format:** PNG → WebP (≤ 300 KB)
- **Naming:** `ama-bg-<screen>-<theme>-v01.png` → `art-production/backgrounds/`; game `public/assets/backgrounds/<screen>-<theme>.webp`
- **Checklist:** UI text stays readable on top (Claude checks contrast), center calm.

## IMG-REV-01 v1 — Revision (edit an existing image)

- **Tool:** ChatGPT image (edit/upload) · **References:** the image to fix + the approved reference sheet
- **Main prompt:**

```text
Edit the first attached image. Keep everything the same except: {FIXES}. The character must match the second attached image (approved reference) exactly in design, colors, face and outline. Keep the style: thick deep purple outline, soft vinyl-toy rendering, no text.
```

`{FIXES}` = the numbered defect list Claude gives in its QA report (e.g. "1. make the outline thicker; 2. remove the extra finger on the left hand; 3. move the character down so the top 15% is empty").

- **Output:** same size/ratio as the original · **Naming:** bump version `-v02`
- **Checklist:** only the listed fixes changed; re-run QA.

---

## CL-QA-01 v1 — Claude: image QA (paste into Claude with the image attached)

```text
QA this AumMon image. Asset ID: {ASSET_ID} (or "new: <type> <character ID>"). Prompt used: {PROMPT_ID vN}.
Check it against docs/art-production/AumMon_Style_Bible.md, the character in AumMon_Character_Library.md and its approved reference sheet, and AumMon_Art_QA_Guidelines.md.
Give: QA result (Pass / Pass with Minor Revision / Fail), the checklist with ✓/✗, numbered defects, and a ready IMG-REV-01 revision prompt if needed. Then save the file to the right folder, update AumMon_Asset_Catalog.md (status Review, never Approved without my confirmation).
```

## CL-PLAN-01 v1 — Claude: start a production task

```text
Start art task for {ASSET TYPE} of {CHARACTER ID or screen}. Give me the task card from AumMon_Art_Production_Workflow.md §3 (Task ID, Asset ID, objective, references to upload, tool, exact prompt filled in, negative prompt, settings, expected output, save location, QA checklist, next step) and add the asset to the Asset Catalog as In Production.
```

## CL-APR-01 v1 — Claude: record owner approval

```text
I approve {ASSET_ID} (version vNN). Move it to art-production/approved/, set status Approved in the Asset Catalog with today's date and my notes: {NOTES}. Keep older versions in history.
```

## CL-INT-01 v1 — Claude: integrate approved assets into the game

```text
Integrate approved assets {ASSET_IDs} into the game: export the game-size WebP into public/assets/…, wire them into the UI (e.g. card art in src/features/game/CardView.tsx with emoji fallback), run pnpm check + E2E, open a PR, and set status Integrated with the final file path in the Asset Catalog.
```

## CL-STY-01 v1 — Claude: create / update Style Bible or character spec

```text
Update {AumMon_Style_Bible.md | character AM0nn in AumMon_Character_Library.md} with these approved decisions: {DECISIONS}. Bump the version, keep the change history, and update every affected prompt in AumMon_AI_Prompt_Library.md.
```

## Prompt change log

| Prompt | Version | Date       | Change          |
| ------ | ------- | ---------- | --------------- |
| all    | v1      | 2026-11-22 | initial library |
