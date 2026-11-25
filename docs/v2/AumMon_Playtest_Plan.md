# AumMon — Closed Playtest Plan (15.12)

> Owner-run session on real phones. URL: https://aum-mon-card-game-git-playtest-aum-mon.vercel.app (Dev backend). All 150 BLUFF items approved by the owner (2026-11-25).

## 1. Sessions

| #   | Players | Room settings         | Goal                                             |
| --- | ------: | --------------------- | ------------------------------------------------ |
| 1   |       2 | default               | 2-player ruleset "2" feels fair, no claim points |
| 2   |       4 | default               | core loop, claims / taunts used                  |
| 3   |       8 | slow ×1.5, `group` on | timers, crowd scoring, phone layout with 8 names |

Each session = one full match (5 rounds, ~7–10 min) + one rematch ("กลับห้อง").

## 2. How

1. Host opens the URL → ชื่อเล่น → สร้างห้อง → แชร์ลิงก์.
2. Friends open the link on their own phones (iOS Safari / Android Chrome), no sign-up.
3. Play; at least once: one player closes the browser mid-round and comes back; one player never claims.
4. After the match: tap แชร์ผล once; one player tries โปรไฟล์ → บันทึกบัญชี.

## 3. What to send back (chat)

- Screenshots of anything confusing or broken (as before).
- 1–5 per question: fun? easy to understand? timers OK? (each player).
- Questions that felt bad or too obvious (round number or text).

## 4. What Claude reads afterwards (Dev data, no personal data)

- Per match: players, rounds finished, timeouts per phase (AFK), claim usage %, lock time vs deadline.
- Per item: vote spread (dominant option > 60 % or a 0 % option → rewrite), reports.
- Win rate of players who never claimed (balance check from 15.4).
