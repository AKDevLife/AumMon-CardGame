import { v2 } from "@aummon/game-engine";
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { StickerButton } from "../../components/StickerButton.tsx";
import { ApiError, callFunction } from "../../lib/api.ts";
import { useAuth } from "../auth/auth-context.ts";
import { HandoffScreen } from "../passplay/HandoffScreen.tsx";
import { cardName, commandLabel, commandSubjects, describeEvent, phaseLabel } from "./labels.ts";
import { CardFrame, EmptySlot } from "./CardFrame.tsx";
import { CardBack, DeckPile, HeartIcon, SparkIcon } from "./GameIcons.tsx";
import { Popup } from "./Popup.tsx";
import { RulesText } from "./RulesText.tsx";
import {
  isMuted,
  normalizeSoundConfig,
  playSound,
  setMuted,
  setSoundConfig,
  soundFor,
} from "./sound.ts";
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

export function TcgMatchPage() {
  const { matchId = "" } = useParams();
  const auth = useAuth();
  const client = auth.mode === "live" ? auth.client : null;
  const [data, setData] = useState<TcgResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [mulligan, setMulligan] = useState<Set<string>>(new Set());
  const [muted, setMutedState] = useState(isMuted);
  const lastEvent = useRef<string | null>(null);
  const [attackFx, setAttackFx] = useState(false);
  const [popup, setPopup] = useState<"history" | "settings" | "rules" | "forfeit" | null>(null);
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

  // Admin-chosen sound settings (public.game_settings 'sounds'); defaults if missing.
  useEffect(() => {
    if (!client) return;
    void client
      .from("game_settings")
      .select("value")
      .eq("key", "sounds")
      .maybeSingle<{ value: unknown }>()
      .then(({ data: row }) => {
        setSoundConfig(normalizeSoundConfig(row?.value));
      });
  }, [client]);

  // Sound effects for events that arrived since the last response (first load is silent).
  useEffect(() => {
    if (!data) return;
    const keys = data.events.map((e) => JSON.stringify(e));
    const last = keys.at(-1) ?? null;
    if (lastEvent.current !== null && last !== lastEvent.current) {
      const from = keys.lastIndexOf(lastEvent.current);
      const fresh = data.events.slice(from + 1);
      const seat = data.mode === "pass_play" ? null : data.seat;
      const names = [...new Set(fresh.map((e) => soundFor(e, seat)).filter((n) => n !== null))];
      if (fresh.some((e) => e.type === "attacked")) {
        setTimeout(() => {
          setAttackFx(true);
        }, 0);
        setTimeout(() => {
          setAttackFx(false);
        }, 550);
      }
      names.slice(0, 3).forEach((n, i) => {
        setTimeout(() => {
          playSound(n);
        }, i * 180);
      });
    }
    lastEvent.current = last;
  }, [data]);

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
  const choicesFor = (id: string | null) =>
    data.legal.filter((c) => id !== null && commandSubjects(c).includes(id));
  /** Units the selected attacker may hit (green "valid target" ring). */
  const targetIds = new Set(
    choicesFor(selected).flatMap((c) =>
      c.type === "attack" && c.target !== "player" ? [c.target] : [],
    ),
  );
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
        <div
          role="status"
          className={`am-sticker p-4 text-center ${
            data.mode !== "pass_play" && winner !== null && winner !== mySeat
              ? "bg-am-error-bg text-am-danger-text" /* defeat */
              : "border-b-am-pink bg-am-title text-am-text" /* victory / draw */
          }`}
        >
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
        className={`am-sticker flex flex-col gap-2 bg-am-field p-2 ${attackFx ? "am-fx-attack" : ""}`}
      >
        <div
          aria-label="Opponent"
          className="am-sticker flex flex-wrap items-center justify-between gap-2 bg-am-opponent p-3"
        >
          <span className="font-display font-bold">
            {data.names[foeSeat]}
            {data.mode === "online" && (
              <span
                aria-label={online.has(String(foeSeat)) ? "ออนไลน์" : "ออฟไลน์"}
                className={`ml-2 inline-block h-2.5 w-2.5 rounded-full ${online.has(String(foeSeat)) ? "bg-am-green" : "bg-am-faint"}`}
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
        <div
          role="group"
          aria-label="Opponent units"
          className="grid grid-cols-3 gap-2 rounded-2xl bg-am-opponent/50 p-2"
        >
          {foe.units.map((u) => (
            <CardFrame
              key={u.instanceId}
              cardId={u.cardId}
              unit={u}
              validTarget={targetIds.has(u.instanceId)}
            />
          ))}
          {Array.from(
            { length: Math.max(0, v2.RULESET_V2.maxUnits - foe.units.length) },
            (_, i) => (
              <EmptySlot key={i} />
            ),
          )}
        </div>

        <div
          role="group"
          aria-label="Your units"
          className="grid grid-cols-3 gap-2 rounded-2xl bg-am-player/60 p-2"
        >
          {me.units.map((u) => (
            <CardFrame
              key={u.instanceId}
              cardId={u.cardId}
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
          {Array.from({ length: Math.max(0, v2.RULESET_V2.maxUnits - me.units.length) }, (_, i) => (
            <EmptySlot key={i} />
          ))}
        </div>

        <div
          aria-label="You"
          className="am-sticker flex flex-wrap items-center justify-between gap-2 bg-am-player p-3"
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
              <CardFrame
                key={c.instanceId}
                cardId={c.cardId}
                selected={selected === c.instanceId}
                marked={mulligan.has(c.instanceId)}
                disabled={pending || (!canMulligan && !playableIds.has(c.instanceId))}
                dimmed={!canMulligan && !playableIds.has(c.instanceId)}
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
        <p
          role="alert"
          className="rounded-lg border-l-4 border-am-red bg-am-error-bg px-2 py-1 font-semibold text-am-danger-text"
        >
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
        <StickerButton
          onClick={() => {
            const next = !muted;
            setMutedState(next);
            setMuted(next);
          }}
        >
          {muted ? "🔇 เปิดเสียง" : "🔊 ปิดเสียง"}
        </StickerButton>
        {!finished && (
          <StickerButton
            variant="danger"
            disabled={pending}
            onClick={() => {
              setPopup("forfeit");
            }}
          >
            ยอมแพ้
          </StickerButton>
        )}
      </Popup>

      <Popup
        title="ยืนยันการยอมแพ้"
        open={popup === "forfeit"}
        onClose={() => {
          setPopup(null);
        }}
      >
        <p>ยอมแพ้แล้วเกมจะจบทันที และคู่ต่อสู้เป็นฝ่ายชนะ</p>
        <StickerButton
          variant="danger"
          disabled={pending}
          onClick={() => {
            setPopup(null);
            void send({ type: "forfeit" });
          }}
        >
          ยืนยันยอมแพ้
        </StickerButton>
        <StickerButton
          onClick={() => {
            setPopup(null);
          }}
        >
          เล่นต่อ
        </StickerButton>
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
