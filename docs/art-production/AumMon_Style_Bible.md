# AumMon — Style Bible (Stage 2)

> Status: **Draft for Direction A — Pending owner approval** (locks in task 13.3 after the Art Direction is approved). If the owner picks another direction, this file is rewritten before any production.
> Every image prompt copies the **Style Block** (§17) verbatim. No single generated image may change these rules; changes need owner approval and a new Style Bible version.

Version: 0.1 (draft) · Direction: A — Candy Vinyl Sticker

## 1. Overall style

Soft 3D vinyl designer-toy characters, rendered cleanly, with a thick deep-purple outline and an optional white sticker border. Cute, friendly, playful; never scary, gross or realistic.

## 2. Proportions

- The object is the body (no separate torso). The object's real shape is kept and slightly squashed/chunky (≈ 85–95 % of real height-to-width).
- Head-to-body: there is no separate head; the **face occupies the upper 40–55 %** of the main surface.
- Overall character fits a square: height ≈ 1.0–1.3 × width. Tall objects (Ruler, Hourglass, Umbrella, Key) are shortened to stay within 1.6 × width.

## 3. Limbs

Short stubby rounded arms and legs, same color as the object's darkest main color or white gloves-like nubs; no fingers except a rounded thumb when holding something; legs ≤ 25 % of total height; feet are rounded ovals. Limbs never cover the face.

## 4. Eyes

Large vertical oval eyes, solid dark purple `#2A1650` pupils filling most of the eye, **one** white round highlight top-left and one tiny secondary highlight. Eye height ≈ 18–22 % of character height. Eyes placed on the upper half of the main surface, spacing ≈ one eye-width apart.

## 5. Mouth

Small simple shapes: line smile, open "D" smile with a tongue in pink `#FF4F9A`, small "o". No teeth rows, no lips.

## 6. Expressions

Sticker-like exaggeration: eyebrows are short rounded strokes floating above the eyes; blush ovals in soft pink on cheeks for happy/shy. Allowed expression set: neutral, happy, laughing, angry, sad, crying, surprised, confused, celebrating, taunting (playful, never mean).

## 7. Materials

Smooth matte vinyl/plastic with a soft satin sheen. Metal parts (Scissors blades, Key, Magnet tips, Alarm bells) are rendered as **smooth toy-like chrome-pastel**, not realistic metal. Paper/cardboard (Box) is smooth with minimal texture. Glass (Magnifier lens, Hourglass) is glossy, simplified, with sparkly highlights.

## 8. Surface details

Few details: only what identifies the object (ruler tick marks — no numbers; tape roll hole; box flaps and one tape strip). No logos, no text, no numbers, no brand marks.

## 9. Outline

Thick deep-purple outline `#2A1650` around the full silhouette (≈ 2.5–3 % of image width at 1024 px), thinner inner lines for major parts. Optional white sticker border outside the outline for emotes and cut-outs.

## 10. Lighting and shadows

Soft key light from top-left, soft fill, gentle rim light. One soft contact shadow under the feet (for full scenes) or none (for transparent cut-outs). No dramatic shadows, no strong cast shadows across the face.

## 11. Color palette

- Each character keeps its real object color, made candy-bright (see Character Library "Main colors").
- Shared accents (from `docs/color_design_system.md`): Golden Yellow `#FFC83D`, Candy Pink `#FF4F9A`, Sky Blue `#55C9F4`, Mint `#65D69A`, Orange `#FF914D`, Lilac `#E9DFFF`, Cream `#FFFBEB`, Outline `#2A1650`.
- Avoid: pure black, grey-dominant images, muddy browns (Cardboard Box uses warm caramel `#E0A86B`).

## 12. Backgrounds

- Card art: simple soft gradient (cream → pastel of the character's accent) with 2–4 floating rounded shapes or desk props; no busy scenes.
- Cut-outs / emotes: transparent background.
- UI backgrounds: soft, low-contrast, blurred toy-desk world in Theme A pastels.

## 13. Camera and composition

Front or slight three-quarter view, eye-level, centered. Card art: character occupies the middle 60–70 % of the frame, **top 15 % and bottom 25 % kept free** for UI (name band and ability text are rendered by the game, not the image).

## 14. Image quality

Clean, sharp, high detail at 1024–2048 px, no noise, no blur, no extra limbs, no deformed faces, no text or watermarks.

## 15. Consistency rules

1. Always attach the approved reference sheet of the character when generating anything after Stage 4.
2. Always paste the Style Block and the Character Block (Character Library) unchanged.
3. Same eye style, outline, lighting and palette for all 16 characters.
4. One character per image unless the prompt says otherwise.
5. If an image looks better but different, it is still rejected — style changes go through the owner.

## 16. Do / Don't

| Do                            | Don't                           |
| ----------------------------- | ------------------------------- |
| Chunky, rounded, cute         | Realistic, scary, sharp-edged   |
| Object instantly recognizable | Generic blob with eyes          |
| Thick purple outline          | Thin black lines, sketchy lines |
| Empty space for UI            | Text, numbers, logos inside art |

## 17. Style Block (copy into every image prompt)

```text
Style: AumMon "Candy Vinyl Sticker" — cute soft 3D vinyl designer-toy character, smooth matte plastic with satin sheen, chunky rounded proportions, the everyday object itself is the body with tiny stubby arms and legs, large glossy vertical oval eyes with dark purple pupils and a white highlight, small simple mouth, thick deep purple (#2A1650) outline around the silhouette, soft top-left studio lighting, gentle rim light, candy-bright pastel colors, clean high-quality render, friendly for all ages, no text, no numbers, no logos.
```

Negative (copy into every image prompt that supports it):

```text
text, letters, numbers, watermark, logo, signature, realistic photo, horror, creepy, gore, human body, human hands with fingers, extra limbs, extra eyes, deformed face, thin black lineart, sketch, blurry, noisy, low resolution, grey dull colors, dark scene, cropped character, multiple characters
```

## 18. Owner approval

| Version | Approved on | Notes                 |
| ------- | ----------- | --------------------- |
| 0.1     | _pending_   | draft for Direction A |
