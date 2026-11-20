import { v2 } from "@aummon/game-engine";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { StickerButton } from "../../components/StickerButton.tsx";
import { ApiError, callFunction } from "../../lib/api.ts";
import { useAuth } from "../auth/auth-context.ts";
import { HandoffScreen } from "../passplay/HandoffScreen.tsx";
import {
  cardName,
  cardText,
  commandLabel,
  commandSubjects,
  describeEvent,
  KEYWORD_HELP,
  KEYWORD_LABEL,
  phaseLabel,
} from "./labels.ts";
import type { TcgResponse } from "./types.ts";

const POLL_MS = 2000;

function useCountdown(deadline: string | null): number | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => {
      setNow(Date.now());
    }, 500);
    return () => {
      clearInterval(id);
    };
  }, [deadline]);
  return deadline ? Math.max(0, Math.ceil((Date.parse(deadline) - now) / 1000)) : null;
}

function UnitTile({
  unit,
  selected,
  onSelect,
}: {
  unit: v2.UnitInstance;
  selected: boolean;
  onSelect?: () => void;
}) {
  const keywords = [...v2.unitKeywords(unit)];
  return (
    <button
      type="button"
      disabled={!onSelect}
      aria-pressed={selected}
      onClick={onSelect}
      className={`am-sticker am-pressable flex min-h-28 flex-col gap-0.5 p-2 text-left ${selected ? "bg-am-hover" : "bg-am-card"} ${unit.exhausted ? "opacity-70" : ""}`}
    >
      <span className="font-display text-sm font-bold leading-tight">{cardName(unit.cardId)}</span>
      <span className="font-display font-bold tabular-nums">
        ⚔️ {v2.unitAtk(unit)} · ❤️ {v2.unitHp(unit)}/{v2.unitMaxHp(unit)}
      </span>
      {keywords.length > 0 && (
        <span className="text-[11px] font-semibold text-am-accent">
          {keywords.map((k) => (
            <abbr key={k} title={KEYWORD_HELP[k]} className="mr-1 no-underline">
              {KEYWORD_LABEL[k]}
            </abbr>
          ))}
        </span>
      )}
      {unit.equipment.length > 0 && (
        <span className="text-[11px] text-am-muted">
          🔧 {unit.equipment.map((e) => cardName(e.cardId)).join(", ")}
        </span>
      )}
      {unit.exhausted && <span className="text-[11px] text-am-muted">💤 Exhausted</span>}
    </button>
  );
}

function HandCard({
  card,
  selected,
  marked,
  disabled,
  onSelect,
}: {
  card: v2.CardInstance;
  selected: boolean;
  marked?: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const def = v2.getCardDefinition(card.cardId);
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected || marked}
      onClick={onSelect}
      className={`am-sticker am-pressable flex min-h-28 flex-col gap-0.5 p-2 text-left disabled:opacity-60 ${selected || marked ? "bg-am-hover" : "bg-am-card"}`}
    >
      <span className="flex items-center justify-between gap-1">
        <span className="font-display text-sm font-bold leading-tight">{def.name}</span>
        <span
          aria-label={`Cost ${def.cost}`}
          className="rounded-full bg-am-title px-2 text-xs font-bold"
        >
          {def.cost}
        </span>
      </span>
      {def.cardType === "unit" ? (
        <span className="text-xs font-semibold">
          ⚔️ {def.atk} · ❤️ {def.hp} {def.keywords.map((k) => KEYWORD_LABEL[k]).join(" ")}
        </span>
      ) : (
        <span className="text-[11px] leading-tight text-am-muted">{cardText(card.cardId)}</span>
      )}
      {marked && <span className="text-[11px] font-bold">↩︎ เปลี่ยน</span>}
    </button>
  );
}

export function TcgMatchPage() {
  const { matchId = "" } = useParams();
  const auth = useAuth();
  const client = auth.mode === "live" ? auth.client : null;
  const [data, setData] = useState<TcgResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [mulligan, setMulligan] = useState<Set<string>>(new Set());
  const idem = useRef<{ key: string; body: string } | null>(null);
  const passPlay = useRef(false);
  const seconds = useCountdown(data?.deadline ?? null);

  const refresh = useCallback(
    async (reveal = false) => {
      if (!client) return;
      try {
        const next = await callFunction<TcgResponse>(client, "tcg-view", { matchId, reveal });
        passPlay.current = next.mode === "pass_play";
        setData(next);
        setError(null);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "โหลดเกมไม่สำเร็จ");
      }
    },
    [client, matchId],
  );

  useEffect(() => {
    const first = setTimeout(() => void refresh(), 0);
    // Pass & Play: no remote players or timers; polling would also hide a revealed hand.
    const id = setInterval(() => {
      if (!passPlay.current) void refresh();
    }, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [refresh]);

  // Server applies the turn timeout when asked after the deadline.
  useEffect(() => {
    if (seconds !== 0) return;
    const id = setTimeout(() => void refresh(), 300);
    return () => {
      clearTimeout(id);
    };
  }, [seconds, refresh]);

  if (!client) return <p className="text-center text-am-muted">ต้องเชื่อมระบบก่อนเล่น (Preview)</p>;
  if (!data) return <p className="text-center text-am-muted">{error ?? "กำลังโหลด…"}</p>;

  const { view } = data;
  const mySeat = data.seat ?? view.seat;
  const foeSeat: v2.Seat = mySeat === 0 ? 1 : 0;
  const me = view.players[mySeat];
  const foe = view.players[foeSeat];
  const finished = view.status === "finished";
  const handoff =
    data.mode === "pass_play" && !finished && data.seat === null && data.actingSeat !== null;
  const myTurn = data.legal.length > 0;
  const choices = data.legal.filter(
    (c) => selected !== null && commandSubjects(c).includes(selected),
  );
  const endTurn = data.legal.find((c) => c.type === "end_turn");
  const canMulligan = data.legal.some((c) => c.type === "mulligan");
  const playableIds = new Set(data.legal.flatMap(commandSubjects));

  const send = async (command: Record<string, unknown>) => {
    setPending(true);
    const body = JSON.stringify(command);
    // Retries of the same command reuse the key (idempotency); a new command gets a new key.
    if (idem.current?.body !== body) idem.current = { key: crypto.randomUUID(), body };
    try {
      const next = await callFunction<TcgResponse>(client, "tcg-command", {
        matchId,
        expectedVersion: data.version,
        idempotencyKey: idem.current.key,
        command,
      });
      setData(next);
      setSelected(null);
      setMulligan(new Set());
      idem.current = null;
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "ส่งคำสั่งไม่สำเร็จ");
      if (e instanceof ApiError && e.status >= 400 && e.status < 500) idem.current = null;
      if (!passPlay.current) void refresh();
    } finally {
      setPending(false);
    }
  };

  const log = data.events
    .map((e) => describeEvent(e, data.names))
    .filter((line): line is string => line !== null)
    .slice(-10);

  const winner = view.result && "winner" in view.result ? view.result.winner : null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-am-round px-3 py-1 text-sm font-bold text-am-ink">
          เทิร์น {view.turn}
        </span>
        <span className="font-semibold">{phaseLabel(view)}</span>
        {seconds !== null && (
          <span className="font-display font-bold tabular-nums">⏱ {seconds}s</span>
        )}
      </div>

      {finished && (
        <div role="status" className="am-sticker bg-am-title p-4 text-center">
          <h1 className="font-display text-3xl font-bold">
            {winner === null
              ? "เสมอ!"
              : data.mode !== "pass_play" && winner === mySeat
                ? "คุณชนะ! 🎉"
                : `${data.names[winner]} ชนะ`}
          </h1>
          <Link to="/" className="mt-2 inline-block font-semibold text-am-accent underline">
            กลับหน้าหลัก
          </Link>
        </div>
      )}

      <div
        aria-label="Opponent"
        className="am-sticker flex flex-wrap items-center justify-between gap-2 bg-am-deco-purple p-3"
      >
        <span className="font-display font-bold">{data.names[foeSeat]}</span>
        <span className="font-display font-bold">❤️ {Math.max(0, foe.hp)}</span>
        <span className="text-sm">
          ✋ {foe.handCount} · 🂠 {foe.deckCount} · ⚡ {foe.spark}/{foe.maxSpark}
        </span>
      </div>
      <div role="group" aria-label="Opponent units" className="grid min-h-28 grid-cols-3 gap-2">
        {foe.units.map((u) => (
          <UnitTile key={u.instanceId} unit={u} selected={false} />
        ))}
      </div>

      <div
        role="group"
        aria-label="Your units"
        className="grid min-h-28 grid-cols-3 gap-2 border-t-[3px] border-dashed border-am-muted pt-3"
      >
        {me.units.map((u) => (
          <UnitTile
            key={u.instanceId}
            unit={u}
            selected={selected === u.instanceId}
            {...(!handoff &&
              playableIds.has(u.instanceId) && {
                onSelect: () => {
                  setSelected(u.instanceId);
                },
              })}
          />
        ))}
      </div>

      <div
        aria-label="You"
        className="am-sticker flex flex-wrap items-center justify-between gap-2 bg-am-deco-green p-3"
      >
        <span className="font-display font-bold">
          {data.mode === "pass_play" ? data.names[mySeat] : `${data.names[mySeat]} (คุณ)`}
        </span>
        <span className="font-display font-bold">❤️ {Math.max(0, me.hp)}</span>
        <span className="font-display font-bold">
          ⚡ SPARK {me.spark}/{me.maxSpark}
        </span>
        <span className="text-sm">🂠 {me.deckCount}</span>
      </div>

      {handoff && data.actingSeat !== null && (
        <HandoffScreen
          name={data.names[data.actingSeat]}
          pending={pending}
          onReveal={() => {
            setPending(true);
            void refresh(true).finally(() => {
              setPending(false);
            });
          }}
        />
      )}

      {!handoff && (
        <div>
          <h2 className="mb-2 font-display text-lg font-semibold">
            การ์ดในมือ ({view.myHand.length}/{v2.RULESET_V2.maxHand})
          </h2>
          <div role="group" aria-label="Hand" className="grid grid-cols-3 gap-2">
            {view.myHand.map((c) => (
              <HandCard
                key={c.instanceId}
                card={c}
                selected={selected === c.instanceId}
                marked={mulligan.has(c.instanceId)}
                disabled={pending || (!canMulligan && !playableIds.has(c.instanceId))}
                onSelect={() => {
                  if (canMulligan) {
                    const next = new Set(mulligan);
                    if (next.has(c.instanceId)) next.delete(c.instanceId);
                    else next.add(c.instanceId);
                    setMulligan(next);
                  } else setSelected(c.instanceId);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {!handoff && canMulligan && (
        <StickerButton
          variant="confirm"
          disabled={pending}
          onClick={() => void send({ type: "mulligan", instanceIds: [...mulligan] })}
          className="min-h-14"
        >
          {mulligan.size === 0 ? "เก็บมือนี้" : `เปลี่ยน ${mulligan.size} ใบ`}
        </StickerButton>
      )}

      {!handoff && choices.length > 0 && (
        <div role="group" aria-label="Actions" className="flex flex-wrap gap-2">
          {choices.map((c, i) => (
            <StickerButton key={i} disabled={pending} onClick={() => void send(c)}>
              {commandLabel(c, view, selected ?? undefined)}
            </StickerButton>
          ))}
        </div>
      )}

      {!handoff && endTurn && (
        <StickerButton
          variant="confirm"
          disabled={pending}
          onClick={() => void send({ type: "end_turn" })}
          className="min-h-14"
        >
          {pending ? "กำลังส่ง…" : "จบเทิร์น"}
        </StickerButton>
      )}
      {!handoff && !myTurn && !finished && (
        <p className="text-center text-am-muted">รอฝ่ายตรงข้าม…</p>
      )}

      {error && (
        <p role="alert" className="border-l-4 border-am-danger pl-2 font-semibold">
          {error}
        </p>
      )}

      {!finished && !handoff && (
        <StickerButton
          variant="danger"
          disabled={pending}
          onClick={() => {
            if (window.confirm("ยอมแพ้และออกจากเกมนี้?")) void send({ type: "forfeit" });
          }}
        >
          ยอมแพ้
        </StickerButton>
      )}

      <div className="am-sticker bg-am-card p-3">
        <h2 className="mb-1 font-display font-semibold">เหตุการณ์ล่าสุด</h2>
        <ol className="flex flex-col gap-1 text-sm" aria-label="Event log">
          {log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}
