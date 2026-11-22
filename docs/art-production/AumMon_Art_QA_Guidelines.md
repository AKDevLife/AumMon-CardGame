# AumMon — Art QA Guidelines

> Used by Claude (CL-QA-01) on every image and by the owner as a quick check. Result per asset: **Pass**, **Pass with Minor Revision**, or **Fail**. Only the owner turns a Pass into **Approved**.

## 1. How to run QA

1. Owner sends the image to Claude with prompt CL-QA-01 (Asset ID + prompt used).
2. Claude checks §2–§5, lists numbered defects, gives the result and (if needed) an IMG-REV-01 prompt.
3. Claude saves the file (`art-production/<stage>/`) and sets the Asset Catalog row to **Review** or **Revision Required**.
4. Owner looks at the image + report and replies "อนุมัติ" (CL-APR-01) or asks for changes.

## 2. Character identity

- [ ] Object recognizable in under 1 second (ask: "what object is this?")
- [ ] Matches the approved reference sheet (shape, colors, face, accessories)
- [ ] Proportions follow the Style Bible §2–§3
- [ ] Personality readable from pose / expression
- [ ] Recognition points from the Character Library visible

## 3. Visual quality

- [ ] Clean, polished render; no noise or blur
- [ ] No malformed shapes, extra/missing limbs, broken eyes, melted parts
- [ ] No text, numbers, logos, watermarks
- [ ] Outline thick deep purple, lighting top-left soft, palette matches §11

## 4. Game usability

- [ ] Shrink test: still readable at the in-game size (card 80 px / 112 px wide, emote 48 px, card back 28 px)
- [ ] Composition fits the asset type (card art: top 15 % / bottom 25 % calm)
- [ ] Nothing important hidden by UI
- [ ] Background suitable (card: soft gradient; emote/cut-out: transparent; UI background: calm center)
- [ ] Text placed on top by the game stays readable (contrast checked by Claude)

## 5. Technical quality

- [ ] Dimensions and aspect ratio as in the prompt
- [ ] Format (PNG master; WebP export) and transparency where required
- [ ] File name = Asset ID lowercase + version
- [ ] Saved in the correct folder
- [ ] Game export size ≤ 200 KB (cards/emotes), ≤ 300 KB (backgrounds)

## 6. Result rules

| Result                   | When                                                                                  | Next                                     |
| ------------------------ | ------------------------------------------------------------------------------------- | ---------------------------------------- |
| Pass                     | all items ✓                                                                           | owner approval                           |
| Pass with Minor Revision | only small issues (e.g. color slightly off, small artifact) that IMG-REV-01 can fix   | revise once, or owner may approve as is  |
| Fail                     | any identity ✗, text in image, deformed anatomy, wrong style, unreadable at game size | Revision Required → regenerate or revise |

A beautiful image that breaks the Style Bible is still **Fail**.

## 7. Consistency validation (after all 16 reference sheets)

Claude builds a side-by-side lineup check: same eye size ratio, outline thickness, lighting direction, saturation, and height scale across all 16. Outliers go back to Revision Required before card art starts (task 13.5 acceptance).
