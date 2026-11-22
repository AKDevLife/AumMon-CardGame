# AumMon — Asset Catalog & Tracker

> Single tracker for every art asset. Claude updates it after each step (CL-QA-01 / CL-APR-01 / CL-INT-01). Workflow: `AumMon_Art_Production_Workflow.md`.
> How to see progress: read the **Summary** below, or ask Claude "สรุปสถานะงานภาพ".

## 1. Conventions

| Item         | Format                                                                                                                                                                                                   | Example                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Character ID | `AM` + 3 digits                                                                                                                                                                                          | `AM013`                                                          |
| Asset ID     | `AMA-<TYPE>-<SUBJECT>[-<VARIANT>]` (no version)                                                                                                                                                          | `AMA-CARD-AM013`, `AMA-EMO-AM016-HAPPY`, `AMA-BG-LOBBY-SONGKRAN` |
| Asset types  | `DIR` direction test · `STY` style sample · `CHR` concept · `REF` reference sheet · `CARD` card art · `UI` UI asset (incl. card back/frame) · `EMO` emote · `ANI` animated emote · `BG` background/theme |                                                                  |
| Version      | `-vNN` on the **file**, never on the ID; every new generation = new number                                                                                                                               | `ama-card-am013-v03.png`                                         |
| File name    | Asset ID lowercase + version + extension                                                                                                                                                                 | `ama-emo-am016-happy-v01.png`                                    |
| Prompt ID    | `IMG-<STAGE>-<NN> vN` / `CL-<STAGE>-<NN> vN`                                                                                                                                                             | `IMG-CRD-01 v1`                                                  |
| Task ID      | roadmap task (`13.x`)                                                                                                                                                                                    | `13.6`                                                           |
| Game export  | `public/assets/<cards                                                                                                                                                                                    | emotes                                                           | animations | ui  | backgrounds>/<subject>.webp` | `public/assets/cards/am013.webp` |

## 2. Statuses and approval

| Status            | Meaning                                                                | Who moves it        |
| ----------------- | ---------------------------------------------------------------------- | ------------------- |
| Concept           | planned / idea only                                                    | Claude              |
| In Production     | prompt handed out, owner generating                                    | Claude (CL-PLAN-01) |
| Review            | image received, QA done, waiting for the owner                         | Claude (CL-QA-01)   |
| Revision Required | QA Fail or owner rejected → back to its stage with a revision prompt   | Claude / owner      |
| Approved          | **owner confirmed** — becomes the master in `art-production/approved/` | owner (CL-APR-01)   |
| Integrated        | used in the game; path + source version recorded                       | Claude (CL-INT-01)  |
| Archived          | replaced or dropped; file kept in `rejected/`                          | Claude              |

Rules: only Approved assets feed later stages · an Approved asset is never overwritten — a replacement is a new version that goes through Review again and needs owner approval · Integrated rows keep source file + prompt version · history is kept in §4.

## 3. Tracker

Columns: Asset ID · Task · Type · Character · Name · Prompt · Priority · Stage · Status · Approval · Current file (path, size, ratio, format) · Usage · Next action

| Asset ID             | Task | Type              | Char  | Name       | Prompt        | Prio | Stage           | Status  | Approval | File | Usage                                        | Next                        |
| -------------------- | ---- | ----------------- | ----- | ---------- | ------------- | ---- | --------------- | ------- | -------- | ---- | -------------------------------------------- | --------------------------- |
| AMA-DIR-AM013-A      | 13.2 | direction test    | AM013 | กุญแจ       | IMG-DIR-01 v1 | P1   | 1 Art Direction | Concept | Pending  | —    | references                                   | owner generates A/B/C tests |
| AMA-DIR-AM013-B      | 13.2 | direction test    | AM013 | กุญแจ       | IMG-DIR-01 v1 | P1   | 1 Art Direction | Concept | Pending  | —    | references                                   | —                           |
| AMA-DIR-AM013-C      | 13.2 | direction test    | AM013 | กุญแจ       | IMG-DIR-01 v1 | P1   | 1 Art Direction | Concept | Pending  | —    | references                                   | —                           |
| AMA-STY-SAMPLE       | 13.3 | style sample      | —     | —          | IMG-STY-01 v1 | P1   | 2 Style Bible   | Concept | Pending  | —    | references                                   | after direction approved    |
| AMA-CHR-AM001        | 13.4 | character concept | AM001 | หนังยาง     | IMG-CHR-01 v1 | P2   | 3 Concept       | Concept | Pending  | —    | concepts                                     | after Style Bible locked    |
| AMA-CHR-AM002        | 13.4 | character concept | AM002 | กาวน้ำ      | IMG-CHR-01 v1 | P2   | 3 Concept       | Concept | Pending  | —    | concepts                                     | after Style Bible locked    |
| AMA-CHR-AM003        | 13.4 | character concept | AM003 | ยางลบ      | IMG-CHR-01 v1 | P2   | 3 Concept       | Concept | Pending  | —    | concepts                                     | after Style Bible locked    |
| AMA-CHR-AM004        | 13.4 | character concept | AM004 | กรรไกร     | IMG-CHR-01 v1 | P2   | 3 Concept       | Concept | Pending  | —    | concepts                                     | after Style Bible locked    |
| AMA-CHR-AM005        | 13.4 | character concept | AM005 | กล่องกระดาษ | IMG-CHR-01 v1 | P2   | 3 Concept       | Concept | Pending  | —    | concepts                                     | after Style Bible locked    |
| AMA-CHR-AM006        | 13.4 | character concept | AM006 | นาฬิกาปลุก   | IMG-CHR-01 v1 | P2   | 3 Concept       | Concept | Pending  | —    | concepts                                     | after Style Bible locked    |
| AMA-CHR-AM007        | 13.4 | character concept | AM007 | แม่เหล็ก     | IMG-CHR-01 v1 | P2   | 3 Concept       | Concept | Pending  | —    | concepts                                     | after Style Bible locked    |
| AMA-CHR-AM008        | 13.4 | character concept | AM008 | แว่นขยาย    | IMG-CHR-01 v1 | P2   | 3 Concept       | Concept | Pending  | —    | concepts                                     | after Style Bible locked    |
| AMA-CHR-AM009        | 13.4 | character concept | AM009 | ไม้บรรทัด    | IMG-CHR-01 v1 | P2   | 3 Concept       | Concept | Pending  | —    | concepts                                     | after Style Bible locked    |
| AMA-CHR-AM010        | 13.4 | character concept | AM010 | เทปกาว     | IMG-CHR-01 v1 | P2   | 3 Concept       | Concept | Pending  | —    | concepts                                     | after Style Bible locked    |
| AMA-CHR-AM011        | 13.4 | character concept | AM011 | ถังขยะ      | IMG-CHR-01 v1 | P2   | 3 Concept       | Concept | Pending  | —    | concepts                                     | after Style Bible locked    |
| AMA-CHR-AM012        | 13.4 | character concept | AM012 | ไฟฉาย      | IMG-CHR-01 v1 | P2   | 3 Concept       | Concept | Pending  | —    | concepts                                     | after Style Bible locked    |
| AMA-CHR-AM013        | 13.4 | character concept | AM013 | กุญแจ       | IMG-CHR-01 v1 | P2   | 3 Concept       | Concept | Pending  | —    | concepts                                     | after Style Bible locked    |
| AMA-CHR-AM014        | 13.4 | character concept | AM014 | พัดลม       | IMG-CHR-01 v1 | P2   | 3 Concept       | Concept | Pending  | —    | concepts                                     | after Style Bible locked    |
| AMA-CHR-AM015        | 13.4 | character concept | AM015 | นาฬิกาทราย  | IMG-CHR-01 v1 | P2   | 3 Concept       | Concept | Pending  | —    | concepts                                     | after Style Bible locked    |
| AMA-CHR-AM016        | 13.4 | character concept | AM016 | ร่ม         | IMG-CHR-01 v1 | P2   | 3 Concept       | Concept | Pending  | —    | concepts                                     | after Style Bible locked    |
| AMA-REF-AM001        | 13.5 | reference sheet   | AM001 | หนังยาง     | IMG-REF-01 v1 | P2   | 4 Reference     | Concept | Pending  | —    | character-sheets                             | after concept approved      |
| AMA-REF-AM002        | 13.5 | reference sheet   | AM002 | กาวน้ำ      | IMG-REF-01 v1 | P2   | 4 Reference     | Concept | Pending  | —    | character-sheets                             | after concept approved      |
| AMA-REF-AM003        | 13.5 | reference sheet   | AM003 | ยางลบ      | IMG-REF-01 v1 | P2   | 4 Reference     | Concept | Pending  | —    | character-sheets                             | after concept approved      |
| AMA-REF-AM004        | 13.5 | reference sheet   | AM004 | กรรไกร     | IMG-REF-01 v1 | P2   | 4 Reference     | Concept | Pending  | —    | character-sheets                             | after concept approved      |
| AMA-REF-AM005        | 13.5 | reference sheet   | AM005 | กล่องกระดาษ | IMG-REF-01 v1 | P2   | 4 Reference     | Concept | Pending  | —    | character-sheets                             | after concept approved      |
| AMA-REF-AM006        | 13.5 | reference sheet   | AM006 | นาฬิกาปลุก   | IMG-REF-01 v1 | P2   | 4 Reference     | Concept | Pending  | —    | character-sheets                             | after concept approved      |
| AMA-REF-AM007        | 13.5 | reference sheet   | AM007 | แม่เหล็ก     | IMG-REF-01 v1 | P2   | 4 Reference     | Concept | Pending  | —    | character-sheets                             | after concept approved      |
| AMA-REF-AM008        | 13.5 | reference sheet   | AM008 | แว่นขยาย    | IMG-REF-01 v1 | P2   | 4 Reference     | Concept | Pending  | —    | character-sheets                             | after concept approved      |
| AMA-REF-AM009        | 13.5 | reference sheet   | AM009 | ไม้บรรทัด    | IMG-REF-01 v1 | P2   | 4 Reference     | Concept | Pending  | —    | character-sheets                             | after concept approved      |
| AMA-REF-AM010        | 13.5 | reference sheet   | AM010 | เทปกาว     | IMG-REF-01 v1 | P2   | 4 Reference     | Concept | Pending  | —    | character-sheets                             | after concept approved      |
| AMA-REF-AM011        | 13.5 | reference sheet   | AM011 | ถังขยะ      | IMG-REF-01 v1 | P2   | 4 Reference     | Concept | Pending  | —    | character-sheets                             | after concept approved      |
| AMA-REF-AM012        | 13.5 | reference sheet   | AM012 | ไฟฉาย      | IMG-REF-01 v1 | P2   | 4 Reference     | Concept | Pending  | —    | character-sheets                             | after concept approved      |
| AMA-REF-AM013        | 13.5 | reference sheet   | AM013 | กุญแจ       | IMG-REF-01 v1 | P2   | 4 Reference     | Concept | Pending  | —    | character-sheets                             | after concept approved      |
| AMA-REF-AM014        | 13.5 | reference sheet   | AM014 | พัดลม       | IMG-REF-01 v1 | P2   | 4 Reference     | Concept | Pending  | —    | character-sheets                             | after concept approved      |
| AMA-REF-AM015        | 13.5 | reference sheet   | AM015 | นาฬิกาทราย  | IMG-REF-01 v1 | P2   | 4 Reference     | Concept | Pending  | —    | character-sheets                             | after concept approved      |
| AMA-REF-AM016        | 13.5 | reference sheet   | AM016 | ร่ม         | IMG-REF-01 v1 | P2   | 4 Reference     | Concept | Pending  | —    | character-sheets                             | after concept approved      |
| AMA-CARD-AM001       | 13.6 | card art          | AM001 | หนังยาง     | IMG-CRD-01 v1 | P3   | 5A Card art     | Concept | Pending  | —    | card D01 → public/assets/cards/am001.webp    | after sheet approved        |
| AMA-CARD-AM002       | 13.6 | card art          | AM002 | กาวน้ำ      | IMG-CRD-01 v1 | P3   | 5A Card art     | Concept | Pending  | —    | card D02 → public/assets/cards/am002.webp    | after sheet approved        |
| AMA-CARD-AM003       | 13.6 | card art          | AM003 | ยางลบ      | IMG-CRD-01 v1 | P3   | 5A Card art     | Concept | Pending  | —    | card D03 → public/assets/cards/am003.webp    | after sheet approved        |
| AMA-CARD-AM004       | 13.6 | card art          | AM004 | กรรไกร     | IMG-CRD-01 v1 | P3   | 5A Card art     | Concept | Pending  | —    | card D04 → public/assets/cards/am004.webp    | after sheet approved        |
| AMA-CARD-AM005       | 13.6 | card art          | AM005 | กล่องกระดาษ | IMG-CRD-01 v1 | P3   | 5A Card art     | Concept | Pending  | —    | card D05 → public/assets/cards/am005.webp    | after sheet approved        |
| AMA-CARD-AM006       | 13.6 | card art          | AM006 | นาฬิกาปลุก   | IMG-CRD-01 v1 | P3   | 5A Card art     | Concept | Pending  | —    | card D06 → public/assets/cards/am006.webp    | after sheet approved        |
| AMA-CARD-AM007       | 13.6 | card art          | AM007 | แม่เหล็ก     | IMG-CRD-01 v1 | P3   | 5A Card art     | Concept | Pending  | —    | card D07 → public/assets/cards/am007.webp    | after sheet approved        |
| AMA-CARD-AM008       | 13.6 | card art          | AM008 | แว่นขยาย    | IMG-CRD-01 v1 | P3   | 5A Card art     | Concept | Pending  | —    | card D08 → public/assets/cards/am008.webp    | after sheet approved        |
| AMA-CARD-AM009       | 13.6 | card art          | AM009 | ไม้บรรทัด    | IMG-CRD-01 v1 | P3   | 5A Card art     | Concept | Pending  | —    | card D09 → public/assets/cards/am009.webp    | after sheet approved        |
| AMA-CARD-AM010       | 13.6 | card art          | AM010 | เทปกาว     | IMG-CRD-01 v1 | P3   | 5A Card art     | Concept | Pending  | —    | card D10 → public/assets/cards/am010.webp    | after sheet approved        |
| AMA-CARD-AM011       | 13.6 | card art          | AM011 | ถังขยะ      | IMG-CRD-01 v1 | P3   | 5A Card art     | Concept | Pending  | —    | card D11 → public/assets/cards/am011.webp    | after sheet approved        |
| AMA-CARD-AM012       | 13.6 | card art          | AM012 | ไฟฉาย      | IMG-CRD-01 v1 | P3   | 5A Card art     | Concept | Pending  | —    | card D12 → public/assets/cards/am012.webp    | after sheet approved        |
| AMA-CARD-AM013       | 13.6 | card art          | AM013 | กุญแจ       | IMG-CRD-01 v1 | P3   | 5A Card art     | Concept | Pending  | —    | card D13 → public/assets/cards/am013.webp    | after sheet approved        |
| AMA-CARD-AM014       | 13.6 | card art          | AM014 | พัดลม       | IMG-CRD-01 v1 | P3   | 5A Card art     | Concept | Pending  | —    | card D14 → public/assets/cards/am014.webp    | after sheet approved        |
| AMA-CARD-AM015       | 13.6 | card art          | AM015 | นาฬิกาทราย  | IMG-CRD-01 v1 | P3   | 5A Card art     | Concept | Pending  | —    | card D15 → public/assets/cards/am015.webp    | after sheet approved        |
| AMA-CARD-AM016       | 13.6 | card art          | AM016 | ร่ม         | IMG-CRD-01 v1 | P3   | 5A Card art     | Concept | Pending  | —    | card D16 → public/assets/cards/am016.webp    | after sheet approved        |
| AMA-UI-CARDBACK      | 13.6 | card back         | —     | —          | IMG-BCK-01 v1 | P3   | 5B Frame/back   | Concept | Pending  | —    | public/assets/ui/card-back.webp              | after Style Bible locked    |
| AMA-BG-MENU-DEFAULT  | 13.8 | background        | —     | —          | IMG-BG-01 v1  | P3   | 5F Background   | Concept | Pending  | —    | public/assets/backgrounds/menu-default.webp  | after card art              |
| AMA-BG-LOBBY-DEFAULT | 13.8 | background        | —     | —          | IMG-BG-01 v1  | P3   | 5F Background   | Concept | Pending  | —    | public/assets/backgrounds/lobby-default.webp | after card art              |
| AMA-BG-ROOM-DEFAULT  | 13.8 | background        | —     | —          | IMG-BG-01 v1  | P3   | 5F Background   | Concept | Pending  | —    | public/assets/backgrounds/room-default.webp  | after card art              |
| AMA-BG-TABLE-DEFAULT | 13.8 | background        | —     | —          | IMG-BG-01 v1  | P3   | 5F Background   | Concept | Pending  | —    | public/assets/backgrounds/table-default.webp | after card art              |

Emotes, animations, VIP cosmetics and seasonal themes (Priority 4) are added after the core assets are Integrated.

## 4. Revision history

| Date | Asset ID | Version | Change | QA  | Decision |
| ---- | -------- | ------- | ------ | --- | -------- |
| —    | —        | —       | —      | —   | —        |

## Summary

| Stage                 | Total | Approved | Integrated |
| --------------------- | ----: | -------: | ---------: |
| 1–2 Direction + Style |     4 |        0 |          — |
| 3 Concepts            |    16 |        0 |          — |
| 4 Reference sheets    |    16 |        0 |          — |
| 5 Card art + back     |    17 |        0 |          0 |
| 5 Backgrounds         |     4 |        0 |          0 |
