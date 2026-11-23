import { dummyGame } from "@aummon/game-engine";
import { useState } from "react";
import { useParams } from "react-router";
import { PlayingCard } from "../../components/PlayingCard.tsx";
import { cardLabel } from "../../components/playing-card.ts";
import { StickerButton } from "../../components/StickerButton.tsx";
import { gameById } from "../../platform/games.ts";
import { MatchShell } from "../../platform/MatchShell.tsx";
import { useMatch } from "../../platform/useMatch.ts";

type View = dummyGame.DummyView;
const game = gameById("dummy");

type SortMode = "suit" | "rank" | "own";
const bySuit = (a: string, b: string) =>
  (a[1] ?? "").localeCompare(b[1] ?? "") || dummyGame.rankNo(a) - dummyGame.rankNo(b);
const byRank = (a: string, b: string) =>
  dummyGame.rankNo(a) - dummyGame.rankNo(b) || (a[1] ?? "").localeCompare(b[1] ?? "");

/** Own order: keep cards already placed, append new ones (sorted by suit) at the end. */
function ownOrder(order: readonly string[], hand: readonly string[]): string[] {
  const kept = order.filter((c) => hand.includes(c));
  return [...kept, ...hand.filter((c) => !kept.includes(c)).sort(bySuit)];
}

interface FedEvent {
  type: "fed";
  seat: number;
  card: string;
  penalty: number;
}
const isFed = (e: { type: string }): e is FedEvent => e.type === "fed";

/** Dummy table: the server validates every meld, pick and discard; the UI only builds intents. */
export function DummyPage() {
  const { matchId = "" } = useParams();
  const m = useMatch<View>(matchId);
  const [picked, setPicked] = useState<string[]>([]);
  const [pile, setPile] = useState<number | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("suit");
  const [order, setOrder] = useState<string[]>([]);
  if (!game) return null;
  const v = m.data?.view;
  const myTurn = v !== undefined && v.acting === v.seat && v.status === "active";
  const toggle = (c: string) => {
    setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  };
  const reset = () => {
    setPicked([]);
    setPile(null);
    setTarget(null);
  };
  const send = (cmd: Record<string, unknown>) => void m.send(cmd).then(reset);
  const hand = v?.myHand ?? [];
  const sorted =
    sortMode === "own"
      ? ownOrder(order, hand)
      : [...hand].sort(sortMode === "rank" ? byRank : bySuit);
  /** Move the one selected card left / right; switches to the player's own order. */
  const move = (dir: -1 | 1) => {
    const card = picked[0];
    if (picked.length !== 1 || card === undefined) return;
    const next = [...sorted];
    const i = next.indexOf(card);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j] ?? card, card];
    setOrder(next);
    setSortMode("own");
  };
  const fed = (m.data?.events ?? []).filter(isFed);
  const lastCard = hand.length === 1;

  return (
    <MatchShell
      game={game}
      data={m.data}
      error={m.error}
      seconds={m.seconds}
      finished={v?.status === "finished"}
      onLeave={m.leave}
      onRematch={m.rematch}
    >
      {v && m.data && (
        <>
          <ul aria-label="ผู้เล่น" className="grid grid-cols-2 gap-2">
            {v.players.map((p, i) => (
              <li
                key={p.playerId}
                className={`am-sticker bg-am-card px-3 py-2 text-sm ${v.acting === i ? "ring-4 ring-am-blue" : ""}`}
              >
                <span className="font-semibold">{m.data?.names[i] ?? `ผู้เล่น ${String(i + 1)}`}</span>
                {i === v.seat && " (คุณ)"} · ไพ่ {p.handCount} ใบ · {p.points} แต้ม
                {p.tookHead && " · เก็บหัว"}
              </li>
            ))}
          </ul>

          {fed.map((e) => (
            <p
              key={`${String(e.seat)}-${e.card}`}
              role="status"
              className="rounded-lg border-l-4 border-am-red bg-am-error-bg px-2 py-1 text-sm font-semibold text-am-danger-text"
            >
              ทิ้งโง่! {m.data?.names[e.seat] ?? "ผู้เล่น"} ทิ้ง {cardLabel(e.card)} ให้คนอื่นเก็บ −{e.penalty}{" "}
              แต้ม
            </p>
          ))}

          <section aria-label="กองทิ้ง" className="flex flex-col gap-1">
            <h2 className="font-semibold">กองทิ้ง (เลือกใบที่จะเก็บ) · กองจั่วเหลือ {v.stockCount} ใบ</h2>
            <div className="flex flex-wrap gap-1">
              {v.discard.map((c, i) => (
                <PlayingCard
                  key={c}
                  code={c}
                  small
                  selected={pile !== null && i >= pile}
                  {...(myTurn &&
                    v.phase === "draw" && {
                      onClick: () => {
                        setPile(pile === i ? null : i);
                      },
                    })}
                />
              ))}
            </div>
          </section>

          <section aria-label="ไพ่บนโต๊ะ" className="flex flex-col gap-1">
            <h2 className="font-semibold">ไพ่ที่เกิดแล้ว (แตะเพื่อเลือกที่ฝาก)</h2>
            {v.melds.length === 0 && <p className="text-sm text-am-muted">ยังไม่มี</p>}
            {v.melds.map((meld, i) => (
              <button
                type="button"
                key={`${String(i)}-${meld.cards.join()}`}
                aria-pressed={target === i}
                aria-label={`ชุดที่ ${String(i + 1)} ของ ${m.data?.names[meld.owner] ?? ""}`}
                onClick={() => {
                  setTarget(target === i ? null : i);
                }}
                className={`flex flex-wrap gap-1 rounded-lg p-1 ${target === i ? "ring-4 ring-am-blue" : ""}`}
              >
                {meld.cards.map((c) => (
                  <PlayingCard key={c} code={c} small />
                ))}
              </button>
            ))}
          </section>

          <section aria-label="ไพ่ในมือ" className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">ไพ่ในมือ ({v.myHand.length})</h2>
              <div role="group" aria-label="เรียงไพ่" className="flex flex-wrap gap-1 text-sm">
                {(
                  [
                    ["suit", "ตามดอก"],
                    ["rank", "ตามแต้ม"],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={sortMode === mode}
                    onClick={() => {
                      setSortMode(mode);
                    }}
                    className={`am-pressable rounded-full border-2 border-am-ink px-3 py-1 font-semibold ${sortMode === mode ? "bg-am-title" : "bg-am-card"}`}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label="ย้ายไพ่ที่เลือกไปซ้าย"
                  disabled={picked.length !== 1}
                  onClick={() => {
                    move(-1);
                  }}
                  className="am-pressable rounded-full border-2 border-am-ink bg-am-card px-3 py-1 font-semibold disabled:opacity-40"
                >
                  ◀
                </button>
                <button
                  type="button"
                  aria-label="ย้ายไพ่ที่เลือกไปขวา"
                  disabled={picked.length !== 1}
                  onClick={() => {
                    move(1);
                  }}
                  className="am-pressable rounded-full border-2 border-am-ink bg-am-card px-3 py-1 font-semibold disabled:opacity-40"
                >
                  ▶
                </button>
              </div>
            </div>
            <div role="group" aria-label="Hand" className="flex flex-wrap gap-1 pt-2">
              {sorted.map((c) => (
                <PlayingCard
                  key={c}
                  code={c}
                  selected={picked.includes(c)}
                  onClick={() => {
                    toggle(c);
                  }}
                />
              ))}
            </div>
          </section>

          {myTurn && v.phase === "draw" && (
            <div className="flex flex-wrap gap-2">
              <StickerButton
                disabled={m.busy}
                onClick={() => {
                  send({ type: "draw" });
                }}
              >
                จั่วไพ่
              </StickerButton>
              <StickerButton
                variant="confirm"
                disabled={m.busy || pile === null || (picked.length < 2 && target === null)}
                onClick={() => {
                  if (pile === null) return;
                  const card = v.discard[pile] ?? "";
                  send(
                    target !== null && picked.length === 0
                      ? { type: "pick", index: pile, layoff: target }
                      : { type: "pick", index: pile, meld: [card, ...picked] },
                  );
                }}
              >
                เก็บจากกองทิ้ง
              </StickerButton>
            </div>
          )}
          {myTurn && v.phase === "play" && (
            <div className="flex flex-wrap gap-2">
              <StickerButton
                variant="confirm"
                disabled={m.busy || picked.length < 3}
                onClick={() => {
                  send({ type: "meld", cards: picked });
                }}
              >
                เกิด
              </StickerButton>
              <StickerButton
                disabled={m.busy || picked.length === 0 || target === null}
                onClick={() => {
                  send({ type: "layoff", meld: target, cards: picked });
                }}
              >
                ฝาก
              </StickerButton>
              {lastCard ? (
                <StickerButton
                  variant="confirm"
                  disabled={m.busy}
                  onClick={() => {
                    send({ type: "discard", card: hand[0] });
                  }}
                >
                  น็อค!
                </StickerButton>
              ) : (
                <StickerButton
                  variant="danger"
                  disabled={m.busy || picked.length !== 1}
                  onClick={() => {
                    send({ type: "discard", card: picked[0] });
                  }}
                >
                  ทิ้ง
                </StickerButton>
              )}
            </div>
          )}

          {v.status === "finished" && v.scores && (
            <section aria-label="ผลการแข่ง" className="am-sticker bg-am-card p-4">
              <h2 className="font-display text-xl font-bold">
                {v.winners.includes(v.seat ?? -1) ? "คุณชนะ! 🎉" : "จบรอบ"}
                {v.knocker !== null && ` · ${m.data.names[v.knocker] ?? ""} น็อค`}
              </h2>
              <ol>
                {v.scores.map((s, i) => (
                  <li key={m.data?.names[i] ?? i}>
                    {m.data?.names[i]}: {s} แต้ม {v.winners.includes(i) && "🏆"}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}
    </MatchShell>
  );
}
