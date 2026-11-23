import type { pokerGame } from "@aummon/game-engine";
import { useState } from "react";
import { useParams } from "react-router";
import { PlayingCard } from "../../components/PlayingCard.tsx";
import { cardLabel } from "../../components/playing-card.ts";
import { StickerButton } from "../../components/StickerButton.tsx";
import { gameById } from "../../platform/games.ts";
import { MatchShell } from "../../platform/MatchShell.tsx";
import { useMatch } from "../../platform/useMatch.ts";

type View = pokerGame.PokerView;
const game = gameById("poker");
const CATEGORY: Record<string, string> = {
  high_card: "ไพ่สูง",
  pair: "หนึ่งคู่",
  two_pair: "สองคู่",
  three_of_a_kind: "ตอง",
  straight: "เรียง",
  flush: "ดอกเดียวกัน",
  full_house: "ฟูลเฮาส์",
  four_of_a_kind: "โฟร์การ์ด",
  straight_flush: "สเตรทฟลัช",
};

/** Texas Hold'em table (play-money chips only). The server validates every action. */
export function PokerPage() {
  const { matchId = "" } = useParams();
  const m = useMatch<View>(matchId);
  const [raise, setRaise] = useState<number | null>(null);
  if (!game) return null;
  const v = m.data?.view;
  const legal = v?.legal ?? null;
  const amount = legal ? Math.min(legal.maxTo, Math.max(legal.minTo, raise ?? legal.minTo)) : 0;
  const send = (cmd: Record<string, unknown>) =>
    void m.send(cmd).then(() => {
      setRaise(null);
    });

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
          <p className="text-center text-sm text-am-muted">
            มือที่ {v.hand} · Blind {v.smallBlind}/{v.bigBlind} · ชิปจำลอง ไม่มีมูลค่าเงินจริง
          </p>
          <section
            aria-label="กลางโต๊ะ"
            className="am-sticker flex flex-col items-center gap-2 bg-am-green/40 p-3"
          >
            <div className="flex gap-1">
              {v.board.length === 0 && <span className="text-sm">ยังไม่เปิดไพ่กลาง</span>}
              {v.board.map((c) => (
                <PlayingCard key={c} code={c} />
              ))}
            </div>
            <p className="font-display text-xl font-bold">กองกลาง {v.pot} ชิป</p>
          </section>

          <ul aria-label="ผู้เล่น" className="grid grid-cols-2 gap-2">
            {v.players.map((p, i) => (
              <li
                key={p.playerId}
                className={`am-sticker bg-am-card px-3 py-2 text-sm ${v.acting === i ? "ring-4 ring-am-blue" : ""} ${p.folded || p.out ? "opacity-50" : ""}`}
              >
                <span className="font-semibold">
                  {m.data?.names[i] ?? `ผู้เล่น ${String(i + 1)}`}
                  {i === v.seat && " (คุณ)"}
                  {i === v.dealer && " Ⓓ"}
                </span>
                <br />
                {p.stack} ชิป{p.bet > 0 && ` · ลง ${String(p.bet)}`}
                {p.folded && !p.out && " · หมอบ"}
                {p.allIn && " · All-in"}
                {p.out && " · หมดชิป"}
              </li>
            ))}
          </ul>

          <section aria-label="ไพ่ของคุณ" className="flex flex-col items-center gap-2">
            <div role="group" aria-label="Hand" className="flex gap-2">
              {v.myCards.map((c) => (
                <PlayingCard key={c} code={c} />
              ))}
            </div>
          </section>

          {legal && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap justify-center gap-2">
                <StickerButton
                  variant="danger"
                  disabled={m.busy}
                  onClick={() => {
                    send({ type: "fold" });
                  }}
                >
                  หมอบ
                </StickerButton>
                {legal.canCheck ? (
                  <StickerButton
                    disabled={m.busy}
                    onClick={() => {
                      send({ type: "check" });
                    }}
                  >
                    ผ่าน
                  </StickerButton>
                ) : (
                  <StickerButton
                    disabled={m.busy}
                    onClick={() => {
                      send({ type: "call" });
                    }}
                  >
                    ตาม {legal.toCall}
                  </StickerButton>
                )}
                <StickerButton
                  disabled={m.busy}
                  onClick={() => {
                    send({ type: "all_in" });
                  }}
                >
                  All-in
                </StickerButton>
              </div>
              {legal.canRaise && legal.minTo < legal.maxTo && (
                <div className="flex items-center gap-2">
                  <label className="flex flex-1 items-center gap-2 font-semibold">
                    เพิ่มเป็น
                    <input
                      type="range"
                      min={legal.minTo}
                      max={legal.maxTo}
                      step={v.bigBlind > 0 ? Math.max(1, Math.floor(v.bigBlind / 2)) : 1}
                      value={amount}
                      onChange={(e) => {
                        setRaise(Number(e.target.value));
                      }}
                      className="flex-1"
                    />
                  </label>
                  <StickerButton
                    variant="confirm"
                    disabled={m.busy}
                    onClick={() => {
                      send({ type: "raise", to: amount });
                    }}
                  >
                    {v.currentBet === 0 ? "เดิมพัน" : "เพิ่ม"} {amount}
                  </StickerButton>
                </div>
              )}
            </div>
          )}

          {v.lastHand && (
            <section aria-label="มือที่แล้ว" className="am-sticker bg-am-card p-3 text-sm">
              <h2 className="font-semibold">มือที่ {v.lastHand.hand}</h2>
              {v.lastHand.shown.map((s) => (
                <p key={s.seat}>
                  {m.data?.names[s.seat]}: {s.cards.map(cardLabel).join(" ")} (
                  {CATEGORY[s.category] ?? s.category})
                </p>
              ))}
              {v.lastHand.wins.map((w) => (
                <p key={w.seat} className="font-semibold">
                  {m.data?.names[w.seat]} ได้ {w.amount} ชิป
                </p>
              ))}
            </section>
          )}

          {v.status === "finished" && (
            <section aria-label="ผลการแข่ง" className="am-sticker bg-am-card p-4">
              <h2 className="font-display text-xl font-bold">
                {v.winners.includes(v.seat ?? -1) ? "คุณชนะ! 🎉" : "จบเกม"}
              </h2>
              <ol>
                {v.players.map((p, i) => (
                  <li key={p.playerId}>
                    {m.data?.names[i]}: {p.stack} ชิป {v.winners.includes(i) && "🏆"}
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
