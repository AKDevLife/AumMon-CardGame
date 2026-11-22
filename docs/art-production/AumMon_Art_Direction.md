# AumMon — Art Direction (Stage 1)

> Status: **Pending owner approval** — proposals only. Nothing here is a production standard until the owner picks a direction (task 13.2).
> Inputs: `aummon_game_spec.md` (casual 2–8 player discard game, Thai, mobile first, VIP/cosmetic gacha later, no pay-to-win), `docs/discard/AumMon_Card_Library.md` (16 Everyday Objects), `docs/color_design_system.md` (approved UI Theme A: Playful Cartoon / Candy Fantasy, deep-purple `#2A1650` outlines, sticker shadows).

## 1. What the art must do

| Need                                           | Why                                                               |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| Read at ~80 px wide (compact cards on a phone) | 2–8 players, small table cards, pile view                         |
| Object recognizable in < 1 s                   | the card identity _is_ the object (Rubber Band, Key…)             |
| Friendly for all ages, Thai casual players     | family / friends party game                                       |
| Collectible appeal                             | future cosmetic gacha (card skins, frames, emotes)                |
| Matches the existing UI                        | Theme A tokens, thick outlines, sticker look are already approved |
| Producible by AI consistently                  | owner has no design skills; 16 characters × many assets           |

## 2. Three directions

### Direction A — "Candy Vinyl Sticker" (recommended)

- **Visual:** soft 3D vinyl-toy characters (like collectible designer toys) with a **thick deep-purple outline** and a white sticker border, flat pastel background shapes.
- **Character philosophy:** the object _is_ the body; tiny stubby arms/legs grow from it; the face sits on the object's main surface.
- **Color:** each object keeps its real-world color, pushed to candy saturation; shared Theme A accents (yellow, pink, sky blue, mint, orange).
- **Material / texture:** smooth matte vinyl, subtle soft-touch sheen; no gritty texture.
- **Lighting:** soft top-left key light, gentle rim light, no harsh shadows.
- **Shape language:** rounded, chunky, slightly squashed; sharp objects (Scissors, Key) get rounded tips.
- **Faces:** big glossy oval eyes with one highlight, small simple mouth; expressions exaggerated like stickers.
- **Mobile fit:** excellent — outline + simple shapes survive downscaling.
- **Card art fit:** excellent — centered character, clean silhouette, easy to cut out.
- **Pros:** matches approved UI; AI tools render "vinyl toy, sticker outline" very consistently; easy transparent cut-outs; strong merch/gacha potential.
- **Cons:** popular look (less unique); needs strict outline rules or AI drifts to thin lines.

### Direction B — "Storybook Gouache"

- **Visual:** hand-painted 2D illustration, gouache texture, visible brush strokes, warm paper grain.
- **Character philosophy:** objects drawn like picture-book heroes in a cozy desk world.
- **Color:** warm muted palette, cream backgrounds.
- **Material:** painterly, textured.
- **Lighting:** warm afternoon light, painted soft shadows.
- **Shape language:** organic, slightly wobbly lines.
- **Faces:** dot eyes, rosy cheeks, gentle expressions.
- **Mobile fit:** medium — texture and low contrast blur at small sizes.
- **Card art fit:** good for full-bleed art, weaker for cut-outs/emotes.
- **Pros:** charming, distinctive, premium storybook feel.
- **Cons:** clashes with the bright sticker UI; AI texture varies a lot between images (hard consistency); emotes/animation harder.

### Direction C — "Neon Arcade Toon"

- **Visual:** bold 2D cel-shaded cartoon, flat colors, hard shadows, neon glow effects, dark backgrounds.
- **Character philosophy:** objects as energetic arcade fighters with attitude.
- **Color:** high-contrast neon on deep purple/navy.
- **Material:** flat cel shading, glossy highlights.
- **Lighting:** colored rim lights (pink/cyan).
- **Shape language:** dynamic, angular, action poses.
- **Faces:** sharp anime-style eyes, big grins.
- **Mobile fit:** very good contrast.
- **Card art fit:** good, action-oriented.
- **Pros:** exciting, readable, good for effects.
- **Cons:** feels competitive rather than casual/family; dark scenes fight the light UI; more aggressive tone than the brand.

## 3. Comparison

| Criterion                   | A Candy Vinyl Sticker | B Storybook Gouache | C Neon Arcade Toon |
| --------------------------- | :-------------------: | :-----------------: | :----------------: |
| Matches approved UI Theme A |          ★★★          |          ★          |         ★★         |
| Small-size readability      |          ★★★          |         ★★          |        ★★★         |
| AI consistency              |          ★★★          |          ★          |         ★★         |
| Casual / family tone        |          ★★★          |         ★★★         |         ★          |
| Emotes + animation          |          ★★★          |          ★          |         ★★         |
| Cosmetic / gacha appeal     |          ★★★          |         ★★          |         ★★         |

## 4. Recommendation

**Direction A — Candy Vinyl Sticker.** It is the only option that matches the already-approved UI without redesign, stays readable on small phone cards, and is the most repeatable with AI generators (important for a non-designer producing 16 characters and many assets). Uniqueness comes from the character designs themselves (Character Library), not from an unusual rendering style.

## 5. Owner decision (fill in)

| Item              | Value                       |
| ----------------- | --------------------------- |
| Chosen direction  | _pending_ (A / B / C / mix) |
| Changes requested | _pending_                   |
| Approved on       | _pending_                   |

How to validate before deciding: generate the 3 test images with prompt **IMG-DIR-01** (Prompt Library) for one character (AM013 กุญแจ) in each direction and compare them side by side.
