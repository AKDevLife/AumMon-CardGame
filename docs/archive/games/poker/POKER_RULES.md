# Poker — Texas Hold'em Rules (ruleset "1")

> Status: implemented in `packages/game-engine/src/poker/` (GC5). **Play-money only**: chips have no monetary value; no purchase, deposit, withdrawal, cash-out or transfer between players. Values in §4 are defaults chosen for short matches — approved by the owner on 2026-11-23 (basic rules for now); a change means a new ruleset version.

## 1. Format

No-Limit Texas Hold'em, 2–8 seats, **sit-and-go match**: every seat starts with the same table stack; the match ends when one player holds all chips or after the hand limit (highest stack wins; equal stacks share the win).

## 2. Hand

1. Dealer button moves one seat clockwise each hand (first dealer random). Busted players are skipped.
2. Blinds: small blind left of the dealer, big blind next. **Heads-up:** the dealer posts the small blind and acts first preflop, last after the flop.
3. Two hole cards each. Betting rounds: preflop (first to act: left of the big blind), flop (3 cards), turn (1), river (1); one burn card before each street. Postflop the first active seat left of the dealer acts first.
4. Actions: fold, check (nothing to call), call, bet/raise to an amount, all-in.
5. Minimum raise = the size of the last full raise (preflop: the big blind). An all-in for less than a full raise does not reopen raising for players who already acted; they may only call or fold.
6. The big blind may check or raise when everyone only called (option).
7. A round ends when every player who can act has acted and matched the highest bet. If at most one player can still act, remaining cards are dealt without betting.
8. If everyone else folds, the last player wins all chips without showing cards.
9. Showdown: best five of seven cards (standard ranking, A-2-3-4-5 is the lowest straight). Side pots: each pot is won by the best hand among players who contributed to it; ties split equally; an odd chip goes to the first winner left of the dealer.

## 3. Timers and absence

- 30 s per decision; on timeout: check if free, otherwise fold.
- Online: 2 timeouts in a row → the server plays the seat until the player acts again. A player who leaves is replaced by a bot (platform rule).

## 4. Defaults (ruleset "1")

| Setting        | Value                            |
| -------------- | -------------------------------- |
| Starting stack | 1,000 chips                      |
| Blinds         | 10 / 20, doubling every 10 hands |
| Hand limit     | 40                               |
| Decision time  | 30 s                             |

## 5. Privacy

Hole cards are visible only to their owner (`getPokerView`); they become public only at showdown. Deck order and RNG stay server-side.
