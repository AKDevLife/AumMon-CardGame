import { dummyGame } from "@aummon/game-engine";
import { useState } from "react";
import { useParams } from "react-router";
import { PlayingCard } from "../../components/PlayingCard.tsx";
import { cardLabel } from "../../components/playing-card.ts";
import { StickerButton } from "../../components/StickerButton.tsx";
import { gameById } from "../../platform/games.ts";
import { MatchShell } from "../../platform/MatchShell.tsx";
import { useMatch } from "../../platform/useMatch.ts";
import { useHandDrag } from "./useHandDrag.ts";

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
  type: "fed" | "full_discard";
  seat: number;
  card: string;
  penalty: number;
}
const isFed = (e: { type: string }): e is FedEvent => e.type === "fed" || e.type === "full_discard";

/** Dummy table: the server validates every meld, pick and discard; the UI only builds intents. */
export function DummyPage() {
  const { matchId = "" } = useParams();
  const m = useMatch<View>(matchId);
  const [picked, setPicked] = useState<string[]>([]);
  const [pile, setPile] = useState<number | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("suit");
  const [order, setOrder] = useState<string[]>([]);
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
  const drag = useHandDrag(sorted, (next) => {
    setOrder(next);
    setSortMode("own");
  });
  if (!game) return null;
  /** Cards above the chosen pile card (they come to the hand and may join the meld). */
  const above = v && pile !== null ? v.discard.slice(pile + 1) : [];
  /** Only cards that are really available now (drops stale selections). */
  const usable = picked.filter((c) => hand.includes(c) || above.includes(c));
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
              key={`${e.type}-${String(e.seat)}-${e.card}`}
              role="status"
              className="rounded-lg border-l-4 border-am-red bg-am-error-bg px-2 py-1 text-sm font-semibold text-am-danger-text"
            >
              {e.type === "fed" ? "ทิ้งโง่!" : "ทิ้งเต็ม!"} {m.data?.names[e.seat] ?? "ผู้เล่น"} ทิ้ง{" "}
              {cardLabel(e.card)}
              {e.type === "fed" ? " ให้คนอื่นเก็บ" : " ครบชุดกับกองทิ้ง"} −{e.penalty} แต้ม
            </p>
          ))}

          <section aria-label="กองจั่ว" className="flex items-center gap-3">
            {(() => {
              const canDraw = myTurn && v.phase === "draw" && !m.busy && v.stockCount > 0;
              const pileCls = `relative flex h-20 w-14 shrink-0 items-center justify-center rounded-lg border-[3px] border-am-ink bg-am-brand font-display text-2xl text-am-inverse shadow-[3px_3px_0_var(--am-ink)] ${canDraw ? "am-pressable am-active ring-4 ring-am-blue" : "opacity-70"}`;
              return (
                <button
                  type="button"
                  disabled={!canDraw}
                  aria-label={`จั่วไพ่ (กองจั่วเหลือ ${String(v.stockCount)} ใบ)`}
                  onClick={() => {
                    send({ type: "draw" });
                  }}
                  className={pileCls}
                >
                  <span aria-hidden="true">🂠</span>
                </button>
              );
            })()}
            <p className="text-sm">
              <b>กองจั่ว</b> เหลือ {v.stockCount} ใบ
              {myTurn && v.phase === "draw" && (
                <span className="block font-semibold">แตะกองจั่วเพื่อจั่ว หรือเลือกเก็บจากกองทิ้ง</span>
              )}
            </p>
          </section>

          <section aria-label="กองทิ้ง" className="flex flex-col gap-1">
            <h2 className="font-semibold">
              กองทิ้ง (เลือกใบที่จะเก็บ แล้วเลือกไพ่ในมือหรือใบที่อยู่ทับเพื่อเกิด) · พื้นเหลือง = หัว
            </h2>
            <div className="flex flex-wrap gap-1">
              {v.discard.map((c, i) => (
                <PlayingCard
                  key={c}
                  code={c}
                  small
                  head={c === v.head}
                  selected={pile !== null && (i === pile || usable.includes(c))}
                  {...(myTurn &&
                    v.phase === "draw" && {
                      onClick: () => {
                        // Above the chosen card: use it in the meld; otherwise choose / clear the pile card.
                        if (pile !== null && i > pile) toggle(c);
                        else setPile(pile === i ? null : i);
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
                onClick={() => {
                  setTarget(target === i ? null : i);
                }}
                className={`flex flex-col items-start gap-1 rounded-lg p-1 text-left ${target === i ? "ring-4 ring-am-blue" : ""}`}
              >
                <span className="text-xs font-semibold text-am-muted">
                  ของ {m.data?.names[meld.owner] ?? `ผู้เล่น ${String(meld.owner + 1)}`}
                  {meld.owner === v.seat && " (คุณ)"}
                </span>
                <span className="flex flex-wrap gap-1">
                  {meld.cards.map((c) => (
                    <PlayingCard key={c} code={c} small head={c === v.head} />
                  ))}
                </span>
              </button>
            ))}
          </section>

          <section aria-label="ไพ่ในมือ" className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">
                ไพ่ในมือ ({v.myHand.length}){" "}
                <span className="text-xs font-normal text-am-muted">กดค้างแล้วลากเพื่อจัดเรียง</span>
              </h2>
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
              </div>
            </div>
            <div role="group" aria-label="Hand" className="flex flex-wrap gap-1 pt-2">
              {sorted.map((c) => (
                <span
                  key={c}
                  {...drag.handlers(c)}
                  className={`touch-none select-none [-webkit-touch-callout:none] ${drag.dragging === c ? "scale-110 opacity-70" : ""}`}
                >
                  <PlayingCard
                    code={c}
                    selected={picked.includes(c)}
                    {...(myTurn && {
                      onClick: () => {
                        if (!drag.consumeDrag()) toggle(c);
                      },
                    })}
                  />
                </span>
              ))}
            </div>
          </section>

          {myTurn && v.phase === "draw" && (
            <div className="flex flex-wrap gap-2">
              <StickerButton
                variant="confirm"
                disabled={m.busy || pile === null || (usable.length < 2 && target === null)}
                onClick={() => {
                  if (pile === null) return;
                  const card = v.discard[pile] ?? "";
                  send(
                    target !== null && usable.length === 0
                      ? { type: "pick", index: pile, layoff: target }
                      : { type: "pick", index: pile, meld: [card, ...usable] },
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
                disabled={m.busy || usable.length < 3}
                onClick={() => {
                  send({ type: "meld", cards: usable });
                }}
              >
                เกิด
              </StickerButton>
              <StickerButton
                disabled={m.busy || usable.length === 0 || target === null}
                onClick={() => {
                  send({ type: "layoff", meld: target, cards: usable });
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
                  disabled={m.busy || usable.length !== 1}
                  onClick={() => {
                    send({ type: "discard", card: usable[0] });
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
