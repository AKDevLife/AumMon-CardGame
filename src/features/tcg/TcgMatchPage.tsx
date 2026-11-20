import { v2 } from "@aummon/game-engine";
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
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
import { CardBack, DeckPile, HeartIcon, SparkIcon } from "./GameIcons.tsx";
import { Popup } from "./Popup.tsx";
import { RulesText } from "./RulesText.tsx";
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
      {unit.exhausted && <span className="text-[11px] text-am-muted">💤 เหนื่อย (โจมตีไม่ได้)</span>}
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
          aria-label={`ใช้พลังงาน ${String(def.cost)}`}
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
  const [popup, setPopup] = useState<"history" | "settings" | "rules" | null>(null);
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

  // Online: private Realtime channel (members only, RLS) for instant updates + Presence.
  const [online, setOnline] = useState<Set<string>>(new Set());
  const mode = data?.mode;
  const presenceKey = data?.seat === null || data?.seat === undefined ? null : String(data.seat);
  useEffect(() => {
    if (!client || mode !== "online" || presenceKey === null) return;
    const channel = client.channel(`match:${matchId}`, {
      config: { private: true, presence: { key: presenceKey } },
    });
    channel
      .on("presence", { event: "sync" }, () => {
        setOnline(new Set(Object.keys(channel.presenceState())));
      })
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${matchId}` },
        () => {
          void refresh();
        },
      )
      .subscribe((status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) void channel.track({ online: true });
      });
    return () => {
      void client.removeChannel(channel);
    };
  }, [client, mode, presenceKey, matchId, refresh]);

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
  const selectedName = (() => {
    const inHand = view.myHand.find((c) => c.instanceId === selected);
    const onBoard = me.units.find((u) => u.instanceId === selected);
    const id = inHand?.cardId ?? onBoard?.cardId;
    return id ? cardName(id) : "";
  })();
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
    .slice(-40);

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
        <span className="flex gap-2">
          <button
            type="button"
            aria-label="ประวัติ"
            onClick={() => {
              setPopup("history");
            }}
            className="am-sticker am-pressable bg-am-card px-2.5 py-1.5 text-lg"
          >
            📜
          </button>
          <button
            type="button"
            aria-label="ตั้งค่า"
            onClick={() => {
              setPopup("settings");
            }}
            className="am-sticker am-pressable bg-am-card px-2.5 py-1.5 text-lg"
          >
            ⚙️
          </button>
        </span>
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
        <span className="font-display font-bold">
          {data.names[foeSeat]}
          {data.mode === "online" && (
            <span
              aria-label={online.has(String(foeSeat)) ? "ออนไลน์" : "ออฟไลน์"}
              className={`ml-2 inline-block h-2.5 w-2.5 rounded-full ${online.has(String(foeSeat)) ? "bg-am-confirm" : "bg-am-muted"}`}
            />
          )}
        </span>
        <span className="flex items-center gap-2">
          <HeartIcon value={Math.max(0, foe.hp)} />
          <SparkIcon value={foe.spark} max={foe.maxSpark} />
          <DeckPile count={foe.deckCount} />
        </span>
        <span
          role="img"
          aria-label={`การ์ดในมือคู่ต่อสู้ ${String(foe.handCount)} ใบ`}
          className="flex w-full flex-wrap gap-1"
        >
          {Array.from({ length: foe.handCount }, (_, i) => (
            <CardBack key={i} small />
          ))}
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
        <span className="flex items-center gap-2">
          <HeartIcon value={Math.max(0, me.hp)} />
          <SparkIcon value={me.spark} max={me.maxSpark} />
          <DeckPile count={me.deckCount} />
        </span>
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

      <Popup
        title={selected ? `คำสั่ง: ${selectedName}` : "คำสั่ง"}
        open={!handoff && choices.length > 0}
        onClose={() => {
          setSelected(null);
        }}
      >
        <div role="group" aria-label="Actions" className="flex flex-col gap-2">
          {choices.map((c, i) => (
            <StickerButton key={i} disabled={pending} onClick={() => void send(c)}>
              {commandLabel(c, view, selected ?? undefined)}
            </StickerButton>
          ))}
        </div>
      </Popup>

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

      <Popup
        title="ประวัติการเล่น"
        open={popup === "history"}
        onClose={() => {
          setPopup(null);
        }}
      >
        {log.length === 0 ? (
          <p className="text-sm text-am-muted">ยังไม่มีเหตุการณ์</p>
        ) : (
          <ol className="flex flex-col gap-1 text-sm" aria-label="Event log">
            {log.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        )}
      </Popup>

      <Popup
        title="ตั้งค่า"
        open={popup === "settings"}
        onClose={() => {
          setPopup(null);
        }}
      >
        <StickerButton
          onClick={() => {
            setPopup("rules");
          }}
        >
          📖 กติกา
        </StickerButton>
        {!finished && (
          <StickerButton
            variant="danger"
            disabled={pending}
            onClick={() => {
              if (window.confirm("ยอมแพ้และออกจากเกมนี้?")) {
                setPopup(null);
                void send({ type: "forfeit" });
              }
            }}
          >
            ยอมแพ้
          </StickerButton>
        )}
      </Popup>

      <Popup
        title="กติกา"
        open={popup === "rules"}
        onClose={() => {
          setPopup(null);
        }}
      >
        <RulesText />
      </Popup>
    </section>
  );
}
