# art-production/ — working files (AI art pipeline)

Workflow and rules: `docs/art-production/AumMon_Art_Production_Workflow.md`.

| Folder                       | Holds                                                              | Status of files                            |
| ---------------------------- | ------------------------------------------------------------------ | ------------------------------------------ |
| `references/`                | style references, mood boards, approved Style Bible sample images  | reference only                             |
| `concepts/`                  | character concept candidates (Stage 3)                             | Concept / Review                           |
| `character-sheets/`          | character reference sheets (Stage 4)                               | Review → Approved copy goes to `approved/` |
| `card-art/`                  | card artwork candidates (Stage 5A)                                 | In Production / Review                     |
| `emotes/`, `animations/`     | emotes and animated-emote frames / sprite sheets                   | In Production / Review                     |
| `ui-assets/`, `backgrounds/` | UI graphics, backgrounds, themes                                   | In Production / Review                     |
| `approved/`                  | owner-approved masters (never overwritten; new version = new file) | Approved                                   |
| `rejected/`                  | failed or replaced candidates kept for history                     | Revision Required / Archived               |

File name = Asset ID in lowercase, e.g. `ama-card-am001-v01.png` (see Asset Catalog §1).
Game-ready exports (resized, WebP) go to `public/assets/…` only at the Integrated stage.
