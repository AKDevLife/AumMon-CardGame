import { discard } from "@aummon/game-engine";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { Spinner } from "../../components/Spinner.tsx";
import { CardView } from "./CardView.tsx";
import { CardBack } from "./GameIcons.tsx";

type View = discard.SeatView;

const ICON_BTN =
  "am-sticker am-pressable grid h-10 w-10 shrink-0 place-items-center !rounded-xl bg-am-deco-purple text-base";

/** Top bar: whose turn, time left, direction + rules / cards / settings. */
export function GameHeader({
  turnLabel,
  mine,
  seconds,
  direction,
  onOpen,
}: {
  turnLabel: string;
  mine: boolean;
  seconds: number | null;
  direction: 1 | -1;
  onOpen: (p: "rules" | "cards" | "settings") => void;
}) {
  const low = seconds !== null && seconds <= 5;
  return (
    <header className="flex shrink-0 items-center gap-1.5 bg-am-brand px-2.5 py-2 text-am-inverse">
      <div
        role="status"
        className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-full border-2 border-am-ink px-3 py-1.5 font-display font-bold ${mine ? "bg-am-title text-am-text" : "bg-am-card text-am-text"}`}
      >
        <span className="truncate text-sm">{turnLabel}</span>
        <span
          aria-label={direction === 1 ? "ทิศทางตามเข็มนาฬิกา" : "ทิศทางทวนเข็มนาฬิกา"}
          className="ml-auto shrink-0 text-base"
        >
          {direction === 1 ? "↻" : "↺"}
        </span>
      </div>
      {seconds !== null && (
        <span
          aria-label={`เวลาเหลือ ${String(seconds)} วินาที`}
          className={`grid h-10 min-w-10 shrink-0 place-items-center rounded-full border-2 border-am-ink px-1 font-display text-base font-bold ${low ? "bg-am-red text-am-inverse am-bump" : "bg-am-card text-am-text"}`}
        >
          {seconds}
        </span>
      )}
      <button
        type="button"
        aria-label="กติกา"
        onClick={() => {
          onOpen("rules");
        }}
        className={ICON_BTN}
      >
        📖
      </button>
      <button
        type="button"
        aria-label="การ์ดทั้งหมด"
        onClick={() => {
          onOpen("cards");
        }}
        className={ICON_BTN}
      >
        🗂️
      </button>
      <button
        type="button"
        aria-label="ตั้งค่า"
        onClick={() => {
          onOpen("settings");
        }}
        className={ICON_BTN}
      >
        ⚙️
      </button>
    </header>
  );
}

/** Other players: one row up to 4, two rows of 4 for 5–7 opponents. Active seat glows. */
export function Opponents({
  view,
  seats,
  name,
  isBot,
  thinking,
}: {
  view: View;
  seats: number[];
  name: (s: number) => string;
  isBot: (s: number) => boolean;
  thinking: boolean;
}) {
  const cols = seats.length <= 4 ? seats.length : 4;
  const compact = seats.length > 3;
  const finished = view.status === "finished";
  return (
    <ul
      aria-label="ผู้เล่น"
      className="grid shrink-0 gap-1.5 px-2 pt-2"
      style={{ gridTemplateColumns: `repeat(${String(Math.max(cols, 1))}, minmax(0, 1fr))` }}
    >
      {seats.map((i) => {
        const active = i === view.acting && !finished;
        const p = view.players[i];
        return (
          <li
            key={p?.playerId ?? i}
            aria-current={active ? "true" : undefined}
            className={`am-sticker relative flex min-w-0 items-center gap-1.5 !rounded-2xl px-1.5 py-1 ${active ? "am-active bg-am-title" : "bg-am-card"} ${view.winner === i ? "bg-am-green" : ""}`}
          >
            {!compact && (
              <span
                aria-hidden="true"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-am-ink bg-am-deco-purple text-sm font-bold"
              >
                {isBot(i) ? "🤖" : (name(i).trim()[0] ?? "?")}
              </span>
            )}
            <span className={`min-w-0 flex-1 ${compact ? "flex items-center gap-1" : ""}`}>
              <span className="block min-w-0 truncate font-display text-[13px] font-bold leading-tight">
                {name(i)}
              </span>
              <span className="flex shrink-0 items-center gap-1 text-[12px] font-semibold leading-tight">
                <span
                  aria-label={`ไพ่ในมือ ${String(p?.handCount ?? 0)} ใบ`}
                  className="rounded-full bg-am-brand px-1.5 font-display text-am-inverse"
                >
                  {p?.handCount ?? 0}
                </span>
                {view.glue === i && <span title="ติดกาว: ห้ามลงแต้ม 1–3">🧴</span>}
                {view.ruler?.seat === i && <span title="ต้องลงแต้ม 5">📏</span>}
                {p?.handCount === 1 && !finished && (
                  <span className="rounded-full border-2 border-am-ink bg-am-pink px-1.5 text-[11px] font-bold text-am-text">
                    เหลือ 1 ใบ!
                  </span>
                )}
                {active && thinking && (
                  <span role="img" aria-label="กำลังคิด" className="ml-auto flex gap-0.5">
                    <i className="am-dot h-1 w-1 rounded-full bg-am-text" />
                    <i className="am-dot h-1 w-1 rounded-full bg-am-text [animation-delay:.2s]" />
                    <i className="am-dot h-1 w-1 rounded-full bg-am-text [animation-delay:.4s]" />
                  </span>
                )}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Chip({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <li
      className={`rounded-full border-2 border-am-ink px-2.5 py-0.5 text-[13px] font-semibold ${tone}`}
    >
      {children}
    </li>
  );
}

/** Center: draw pile, discard pile (top card large, recent cards fanned), active effects, last action. */
export function CenterTable({
  view,
  name,
  landKey,
  lastAction,
  dense,
}: {
  dense: boolean;
  view: View;
  name: (s: number) => string;
  landKey: number;
  lastAction: string | null;
}) {
  const top = view.top;
  const under = view.pileRecent.slice(0, -1).slice(-2);
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-2 px-2 py-2">
      {lastAction && (
        <p
          key={lastAction}
          className={`max-w-full truncate rounded-full bg-am-card px-3 py-1 text-[13px] font-semibold ${dense ? "[@media(max-height:700px)]:hidden" : ""}`}
        >
          {lastAction}
        </p>
      )}
      <div className="flex items-center justify-center gap-6 rounded-[2rem] border-[3px] border-dashed border-am-purple/40 bg-am-lavender/60 px-6 py-2.5">
        <div className="flex flex-col items-center gap-1">
          <div className="relative h-[var(--am-card-h-sm)] w-[var(--am-card-w-sm)]">
            <span className="absolute left-1.5 top-1.5">
              <CardBack pile />
            </span>
            <span className="absolute left-0 top-0">
              <CardBack pile />
            </span>
            <span
              key={view.drawCount}
              aria-label={`กองจั่วเหลือ ${String(view.drawCount)} ใบ`}
              className="am-bump absolute -bottom-1 -right-1 grid h-8 min-w-8 place-items-center rounded-full border-2 border-am-ink bg-am-card px-1 font-display text-sm font-bold"
            >
              {view.drawCount}
            </span>
          </div>
        </div>
        <div aria-label="กองกลาง" className="flex flex-col items-center gap-1">
          <div className="relative grid h-[var(--am-card-h-sm)] w-[var(--am-card-w-sm)] place-items-center">
            {under.map((c, i) => (
              <span
                key={`${c}-${String(i)}`}
                aria-hidden="true"
                className="absolute"
                style={{ transform: `rotate(${String(i === 0 ? -10 : 7)}deg) translateY(4px)` }}
              >
                <CardView cardId={c} size="sm" />
              </span>
            ))}
            {top ? (
              <span key={landKey} className="am-land relative">
                <CardView cardId={top} size="sm" className="ring-4 ring-am-title" />
              </span>
            ) : (
              <span className="text-am-muted">ว่าง</span>
            )}
          </div>
        </div>
      </div>
      <ul aria-label="สถานะกองกลาง" className="flex flex-wrap justify-center gap-1.5">
        {view.open ? (
          <Chip tone="bg-am-green text-am-success-text">🆕 กองใหม่ — ลงแต้มไหนก็ได้</Chip>
        ) : (
          top && (
            <Chip tone="bg-am-card">
              ลงแต้ม ≥ <b>{discard.getDiscardCard(top).points}</b> · ยางลบลงได้ทุกเมื่อ
            </Chip>
          )
        )}
        {view.ruler && <Chip tone="bg-am-title">📏 {name(view.ruler.seat)} ต้องลงแต้ม 5 เท่านั้น</Chip>}
        {view.glue !== null && (
          <Chip tone="bg-am-deco-purple">🧴 {name(view.glue)} ห้ามลงแต้ม 1–3</Chip>
        )}
        {view.reaction && (
          <Chip tone="bg-am-blue text-am-info-text">
            ☂️ {name(view.reaction.target)} กำลังตัดสินใจใช้ร่ม
          </Chip>
        )}
      </ul>
    </div>
  );
}

/** End of game: winner banner with confetti and a way home. */
export function WinOverlay({
  title,
  pending = false,
  onRematch,
  onLobby,
  onHome,
}: {
  title: string;
  pending?: boolean;
  onRematch?: () => void;
  /** Online: back to the room — everyone presses ready again for the next round. */
  onLobby?: () => void;
  /** Online: leave the room and go home (instead of the plain link). */
  onHome?: () => void;
}) {
  const colors = ["bg-am-title", "bg-am-pink", "bg-am-blue", "bg-am-green", "bg-am-orange"];
  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden="false">
      {Array.from({ length: 18 }, (_, i) => (
        <i
          key={i}
          aria-hidden="true"
          className={`am-confetti absolute top-0 h-3 w-2 rounded-sm ${colors[i % colors.length] ?? ""}`}
          style={{
            left: `${String((i * 37) % 100)}%`,
            animationDelay: `${String((i % 6) * 0.15)}s`,
          }}
        />
      ))}
      <div className="pointer-events-auto absolute inset-x-4 top-1/3 mx-auto max-w-sm">
        <div role="status" className="am-sticker am-land bg-am-title p-4 text-center">
          <h1 className="font-display text-3xl font-bold">{title}</h1>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {onRematch && (
              <button
                type="button"
                disabled={pending}
                onClick={onRematch}
                className="am-sticker am-pressable bg-am-green px-5 py-2 font-display font-bold text-am-success-text disabled:opacity-60"
              >
                {pending && <Spinner className="mr-2" />}
                เล่นอีกรอบ
              </button>
            )}
            {onLobby && (
              <button
                type="button"
                onClick={onLobby}
                className="am-sticker am-pressable bg-am-green px-5 py-2 font-display font-bold text-am-success-text"
              >
                กลับห้อง (เล่นอีกรอบ)
              </button>
            )}
            {onHome ? (
              <button
                type="button"
                onClick={onHome}
                className="am-sticker am-pressable bg-am-card px-5 py-2 font-display font-bold"
              >
                ออกจากห้อง
              </button>
            ) : (
              <Link
                to="/"
                className="am-sticker am-pressable inline-block bg-am-card px-5 py-2 font-display font-bold"
              >
                กลับหน้าหลัก
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
