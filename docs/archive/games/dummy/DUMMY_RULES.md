# Dummy (ดัมมี่) — Rules (ruleset "5")

> Status: implemented in `packages/game-engine/src/dummy/` (GC3). Built from common Thai Dummy rules with simple choices for a first version. Items marked ⚑ were reviewed: the owner approved these basic defaults on 2026-11-23 ("use basic rules for now"); changing one means a new ruleset version.

## 1. Setup

- 52 cards, 2–4 players, one round per match.
- Deal: 2 players 11 cards, 3 players 9, 4 players 7.
- The next card is turned face up as the first discard: the **head card (หัว)**. First player random; play goes clockwise.

## 2. Turn

1. **Take**, one of:
   - draw the top card of the stock; or
   - pick a card from the discard pile: take it **and every card above it**; the picked card must at once go into a new meld with cards from your hand (cards just taken above it may be used), or be laid off onto any meld on the table.
2. **Play** (optional, any number): put down new melds (เกิด) and lay off (ฝาก) cards onto any meld on the table.
3. **Discard** one card. If your hand is empty after any action, you **knock (น็อค)** and the round ends at once.

Melds: a **set** of 3–4 cards of one rank, or a **run** of 3+ consecutive cards of one suit. 2 is the lowest card and the ace only high: Q-K-A is a run, A-2-3 and K-A-2 are not (ruleset "5", owner 2026-11-23).

## 3. End of round

- Knock, or ⚑ the stock is empty when the next player must take (picking from the pile is then no longer possible).

## 4. Scoring

| Item                                                                                  | Points                              |
| ------------------------------------------------------------------------------------- | ----------------------------------- |
| Card on the table (own melds and lay-offs, credited to whoever placed it)             | + card value                        |
| Card left in hand                                                                     | − card value                        |
| Card values                                                                           | ⚑ A = 15; 10, J, Q, K = 10; 2–9 = 5 |
| Speto (สเปโต) 2♣ and Q♠                                                               | ⚑ 50 each (plus or minus)           |
| Picking up the head card from the bottom of the pile                                  | ⚑ +50                               |
| Knock                                                                                 | ⚑ +50                               |
| ทิ้งโง่: the next player picks only your last discard, melds it and knocks that turn     | −50 (speto −100)                    |
| ทิ้งเต็ม: your discard forms a set/run with any 2 cards in the pile (not the knock card) | −50 (speto −100)                    |

Highest total wins; equal totals share the win.

Ruleset "2" (owner 2026-11-23) added ทิ้งโง่: any other player (not only the next one) who picks your discard before your next turn costs you 50, a speto 100. Ruleset "3" (owner 2026-11-23) added ทิ้งเต็ม (above); drawing is done by tapping the stock pile. Ruleset "4" (owner 2026-11-23): ทิ้งโง่ narrowed to the case above (other pick-ups cost nothing). ⚑ Not in ruleset "4": "dummy"/"เต็ม" knocks for extra points, melding requirement before laying off, multi-round matches to a target score.

## 5. Timers and privacy

- 45 s per turn; on timeout the server draws (if needed) and discards the least useful card.
- Hands and stock order stay on the server; discard pile and melds are public.
