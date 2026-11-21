import { v5 } from "@aummon/game-engine";
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { StickerButton } from "../../components/StickerButton.tsx";
import { ApiError, callFunction } from "../../lib/api.ts";
import { useAuth } from "../auth/auth-context.ts";
import { HandoffScreen } from "../passplay/HandoffScreen.tsx";
import {
  cardName,
  commandLabel,
  commandSubjects,
  commandTarget,
  historyByTurn,
  phaseLabel,
} from "./labels.ts";
import { CardFrame, EmptySlot } from "./CardFrame.tsx";
import { CardGallery } from "./CardGallery.tsx";
import { sortByCost } from "./sort.ts";
import { CardBack, DeckPile, HeartIcon, SparkIcon } from "./GameIcons.tsx";
import { Popup } from "./Popup.tsx";
import { RulesText } from "./RulesText.tsx";
import { DraggableCard, type DropTarget } from "./DraggableCard.tsx";
import {
  installAudioUnlock,
  installTapSounds,
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
  /** Card shown in the read-only info popup (tap any Object to read its abilities). */
  const [info, setInfo] = useState<string | null>(null);
  const [mulligan, setMulligan] = useState<Set<string>>(new Set());
  const [muted, setMutedState] = useState(isMuted);
  const lastEvent = useRef<string | null>(null);
  const [attackFx, setAttackFx] = useState(false);
  const [handOpen, setHandOpen] = useState(true);
  const [drag, setDrag] = useState<{
    instanceId: string;
    cardId: string;
    x: number;
    y: number;
  } | null>(null);
  const [popup, setPopup] = useState<"history" | "settings" | "rules" | "forfeit" | "cards" | null>(
    null,
  );
  const idem = useRef<{ key: string; body: string } | null>(null);
  const passPlay = useRef(false);
  const botActing = data?.botActing === true;
  const seconds = useCountdown(botActing ? null : (data?.deadline ?? null));

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

  useEffect(() => installAudioUnlock(), []);
  useEffect(() => installTapSounds(), []);

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

  // Open the hand drawer automatically whenever it becomes this player's turn (or mulligan).
  const actionable = (data?.legal.length ?? 0) > 0;
  useEffect(() => {
    if (!actionable) return;
    const id = setTimeout(() => {
      setHandOpen(true);
    }, 0);
    return () => {
      clearTimeout(id);
    };
  }, [actionable]);

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

  // Server bot plays one action per step: fetch again right after each step time.
  const botDeadline = botActing ? data.deadline : null;
  useEffect(() => {
    if (!botDeadline) return;
    const wait = Math.max(50, Date.parse(botDeadline) - Date.now() + 60);
    const id = setTimeout(() => void refresh(), wait);
    return () => {
      clearTimeout(id);
    };
  }, [botDeadline, refresh]);

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
  const foeSeat: v5.Seat = mySeat === 0 ? 1 : 0;
  const me = view.players[mySeat];
  const foe = view.players[foeSeat];
  const finished = view.status === "finished";
  const handoff =
    data.mode === "pass_play" && !finished && data.seat === null && data.actingSeat !== null;
  const myTurn = data.legal.length > 0;
  const selectedCardId =
    view.myHand.find((c) => c.instanceId === selected)?.cardId ??
    me.units.find((u) => u.instanceId === selected)?.cardId ??
    null;
  const selectedName = selectedCardId ? cardName(selectedCardId) : "";
  const choicesFor = (id: string | null) =>
    data.legal.filter((c) => id !== null && commandSubjects(c).includes(id));
  /** Units the selected attacker may hit (green "valid target" ring). */
  const targetIds = new Set(
    choicesFor(selected).flatMap((c) => {
      const t = commandTarget(c);
      return t ? [t] : [];
    }),
  );
  const choices = data.legal.filter(
    (c) => selected !== null && commandSubjects(c).includes(selected),
  );
  const endTurn = data.legal.find((c) => c.type === "end_turn");
  const canMulligan = data.legal.some((c) => c.type === "mulligan");
  const playableIds = new Set(data.legal.flatMap(commandSubjects));
  // Hand sorted by SPARK cost, cheapest first (owner request); same cost → playable first.
  const sortedHand = sortByCost(view.myHand, (c) => Number(!playableIds.has(c.instanceId)));
  const dragSummon = drag
    ? data.legal.find((c) => c.type === "summon" && c.instanceId === drag.instanceId)
    : undefined;

  /** Drag & drop: an Object dropped on an empty slot / the field is summoned. */
  const onDrop = (instanceId: string, target: DropTarget) => {
    if (!target) return;
    const summon = data.legal.find((c) => c.type === "summon" && c.instanceId === instanceId);
    if (summon && (target.kind === "slot" || target.kind === "field")) void send(summon);
    else if (!summon) setError("ยังลงการ์ดนี้ไม่ได้ (พลังงานไม่พอ / สนามเต็ม / ไม่ใช่เทิร์นของคุณ)");
  };

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

  const log = historyByTurn(data.events, data.names);

  const winner = view.result && "winner" in view.result ? view.result.winner : null;

  const resultTone =
    data.mode !== "pass_play" && winner !== null && winner !== mySeat
      ? "bg-am-error-bg text-am-danger-text" /* defeat */
      : "bg-am-title text-am-text"; /* victory / draw */

  const fan = view.myHand.slice(0, 7);

  // Full-screen game layer (no page scroll): sticky top bar, field in the middle,
  // hand drawer at the bottom (layout B, owner choice 2026-11-21).
  return (
    <section
      aria-label="กระดานเกม"
      className="fixed inset-0 z-20 flex flex-col bg-am-bg pt-[env(safe-area-inset-top)] text-am-text"
    >
      <div className="flex shrink-0 items-center gap-2 border-b-[3px] border-am-ink bg-am-card px-3 py-2">
        <span className="rounded-full border-2 border-am-ink bg-am-round px-3 py-1 font-display text-sm font-bold">
          เทิร์น {view.turn}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          {phaseLabel(view)}
          {seconds !== null && <span className="ml-2 font-display tabular-nums">⏱ {seconds}s</span>}
        </span>
        <button
          type="button"
          aria-label="กติกา"
          onClick={() => {
            setPopup("rules");
          }}
          className="am-sticker am-pressable h-11 w-11 !rounded-xl bg-am-deco-purple text-lg"
        >
          📖
        </button>
        <button
          type="button"
          aria-label="การ์ดทั้งหมด"
          onClick={() => {
            setPopup("cards");
          }}
          className="am-sticker am-pressable h-11 w-11 !rounded-xl bg-am-deco-purple text-lg"
        >
          🗂️
        </button>
        <button
          type="button"
          aria-label="ตั้งค่า"
          onClick={() => {
            setPopup("settings");
          }}
          className="am-sticker am-pressable h-11 w-11 !rounded-xl bg-am-deco-purple text-lg"
        >
          ⚙️
        </button>
      </div>

      <div
        data-drop="field"
        role="region"
        aria-label="สนาม"
        // Scrollable on small screens: keyboard users must be able to focus and scroll it (WCAG).
        tabIndex={0}
        className={`flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto bg-am-field p-1.5 ${attackFx ? "am-fx-attack" : ""}`}
      >
        {finished && (
          <div role="status" className={`am-sticker p-3 text-center ${resultTone}`}>
            <h1 className="font-display text-2xl font-bold">
              {winner === null
                ? "เสมอ!"
                : data.mode !== "pass_play" && winner === mySeat
                  ? "คุณชนะ! 🎉"
                  : `${data.names[winner]} ชนะ`}
            </h1>
            <Link to="/" className="mt-1 inline-block font-semibold text-am-accent underline">
              กลับหน้าหลัก
            </Link>
          </div>
        )}

        <div
          aria-label="Opponent"
          className="am-sticker flex shrink-0 items-center gap-2 bg-am-opponent px-3 py-1.5"
        >
          <span className="min-w-0 flex-1 truncate font-display font-bold">
            {data.names[foeSeat]}
            {data.mode === "online" && (
              <span
                aria-label={online.has(String(foeSeat)) ? "ออนไลน์" : "ออฟไลน์"}
                className={`ml-2 inline-block h-2.5 w-2.5 rounded-full ${online.has(String(foeSeat)) ? "bg-am-green" : "bg-am-faint"}`}
              />
            )}
          </span>
          <span
            role="img"
            aria-label={`การ์ดในมือคู่ต่อสู้ ${String(foe.handCount)} ใบ`}
            className="flex items-center"
          >
            {Array.from({ length: Math.min(foe.handCount, 6) }, (_, i) => (
              <span key={i} className="-ml-2 first:ml-0">
                <CardBack small />
              </span>
            ))}
          </span>
          <HeartIcon value={Math.max(0, foe.hp)} size={38} />
          <SparkIcon value={foe.spark} max={foe.maxSpark} size={34} />
          <DeckPile count={foe.deckCount} />
        </div>

        <div
          role="group"
          aria-label="Opponent units"
          className="grid shrink-0 grid-cols-3 gap-1.5 rounded-2xl bg-am-opponent/50 p-1.5"
        >
          {foe.units.map((u) => (
            <CardFrame
              key={u.instanceId}
              compact
              cardId={u.cardId}
              unit={u}
              side={foe.units}
              validTarget={targetIds.has(u.instanceId)}
              onSelect={() => {
                setInfo(u.cardId);
              }}
            />
          ))}
          {Array.from(
            { length: Math.max(0, v5.RULESET_V5.maxUnits - foe.units.length) },
            (_, i) => (
              <EmptySlot key={i} />
            ),
          )}
        </div>

        <div
          role="group"
          aria-label="Your units"
          className="grid shrink-0 grid-cols-3 gap-1.5 rounded-2xl bg-am-player/60 p-1.5"
        >
          {me.units.map((u) => (
            <div key={u.instanceId} data-drop={`unit:${u.instanceId}`}>
              <CardFrame
                compact
                cardId={u.cardId}
                unit={u}
                selected={selected === u.instanceId}
                side={me.units}
                validTarget={targetIds.has(u.instanceId)}
                {...(!handoff && {
                  onSelect: () => {
                    if (playableIds.has(u.instanceId)) setSelected(u.instanceId);
                    else setInfo(u.cardId);
                  },
                })}
              />
            </div>
          ))}
          {Array.from({ length: Math.max(0, v5.RULESET_V5.maxUnits - me.units.length) }, (_, i) => (
            <EmptySlot key={i} drop active={dragSummon !== undefined} />
          ))}
        </div>

        <div
          aria-label="You"
          className="am-sticker flex shrink-0 items-center gap-2 bg-am-player px-3 py-1.5"
        >
          <span className="min-w-0 flex-1 truncate font-display font-bold">
            {data.mode === "pass_play" ? data.names[mySeat] : `${data.names[mySeat]} (คุณ)`}
          </span>
          {!handoff && endTurn && (
            <button
              type="button"
              disabled={pending}
              onClick={() => void send({ type: "end_turn" })}
              className="am-sticker am-pressable min-h-11 !rounded-full bg-am-green px-3 font-display text-sm font-bold text-am-success-text disabled:!bg-am-disabled disabled:!text-am-faint"
            >
              {pending ? "กำลังส่ง…" : "จบเทิร์น"}
            </button>
          )}
          <HeartIcon value={Math.max(0, me.hp)} size={38} />
          <SparkIcon value={me.spark} max={me.maxSpark} size={34} />
          <DeckPile count={me.deckCount} />
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
        {!handoff && !myTurn && !finished && (
          <p className="text-center font-semibold text-am-ink">
            {botActing ? "🤖 Bot กำลังเล่น…" : "รอฝ่ายตรงข้าม…"}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-lg border-l-4 border-am-red bg-am-error-bg px-2 py-1 font-semibold text-am-danger-text"
          >
            {error}
          </p>
        )}
      </div>

      {!handoff && (
        <div className="shrink-0 rounded-t-3xl border-t-[3px] border-am-ink bg-am-brand pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            aria-expanded={handOpen}
            data-sound={handOpen ? "hand_close" : "hand_open"}
            onClick={() => {
              setHandOpen(!handOpen);
            }}
            className="flex w-full flex-col items-center gap-1 pt-2 text-am-inverse"
          >
            <span aria-hidden="true" className="h-1.5 w-11 rounded-full bg-am-lavender" />
            <span className="text-xs font-semibold">
              การ์ดในมือ {view.myHand.length}/{v5.RULESET_V5.maxHand} ·{" "}
              {handOpen ? "แตะเพื่อพับเก็บ" : "แตะเพื่อเปิด"}
            </span>
          </button>
          {handOpen ? (
            <div className="flex flex-col gap-2 px-2 pt-2">
              <div role="group" aria-label="Hand" className="flex gap-2 overflow-x-auto pb-1">
                {sortedHand.map((c) => (
                  <DraggableCard
                    key={c.instanceId}
                    className="w-28 shrink-0"
                    enabled={!canMulligan && !pending && playableIds.has(c.instanceId)}
                    onMove={(p) => {
                      setDrag(p ? { instanceId: c.instanceId, cardId: c.cardId, ...p } : null);
                    }}
                    onDrop={(target) => {
                      onDrop(c.instanceId, target);
                    }}
                  >
                    <CardFrame
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
                  </DraggableCard>
                ))}
              </div>
              {canMulligan && (
                <StickerButton
                  variant="confirm"
                  disabled={pending}
                  onClick={() => void send({ type: "mulligan", instanceIds: [...mulligan] })}
                  className="min-h-12"
                >
                  {mulligan.size === 0 ? "เก็บมือนี้" : `เปลี่ยน ${String(mulligan.size)} ใบ`}
                </StickerButton>
              )}
            </div>
          ) : (
            // Folded: the whole purple block (fan included) opens the hand; the header closes it again.
            <button
              type="button"
              aria-label="เปิดการ์ดในมือ"
              data-sound="hand_open"
              onClick={() => {
                setHandOpen(true);
              }}
              className="flex h-16 w-full justify-center overflow-hidden pt-2"
            >
              {fan.map((c, i) => {
                const mid = (fan.length - 1) / 2;
                return (
                  <span
                    key={c.instanceId}
                    aria-hidden="true"
                    className="-ml-3 h-20 w-14 shrink-0 rounded-lg border-[3px] border-am-ink bg-am-card p-1 text-[10px] font-semibold leading-tight [word-break:keep-all] first:ml-0"
                    style={{
                      transform: `rotate(${String((i - mid) * 6)}deg) translateY(${String(Math.abs(i - mid) * 3)}px)`,
                    }}
                  >
                    {cardName(c.cardId)}
                  </span>
                );
              })}
            </button>
          )}
        </div>
      )}

      {drag && (
        <div
          aria-hidden="true"
          className="am-sticker pointer-events-none fixed z-30 w-24 -translate-x-1/2 -translate-y-full rotate-3 bg-am-card p-2 text-xs font-bold shadow-sticker"
          style={{ left: drag.x, top: drag.y }}
        >
          {cardName(drag.cardId)}
          <div className="mt-1 text-[10px] font-semibold text-am-muted">วางในช่องว่าง</div>
        </div>
      )}

      <Popup
        title={selected ? `คำสั่ง: ${selectedName}` : "คำสั่ง"}
        open={!handoff && choices.length > 0}
        onClose={() => {
          setSelected(null);
        }}
      >
        {selectedCardId && <CardFrame cardId={selectedCardId} />}
        <div role="group" aria-label="Actions" className="mt-2 flex flex-col gap-2">
          {choices.map((c, i) => (
            <StickerButton key={i} disabled={pending} onClick={() => void send(c)}>
              {commandLabel(c, view)}
            </StickerButton>
          ))}
        </div>
      </Popup>

      <Popup
        title={info ? cardName(info) : "การ์ด"}
        open={info !== null}
        onClose={() => {
          setInfo(null);
        }}
      >
        {info && <CardFrame cardId={info} />}
      </Popup>

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
          <ol className="flex flex-col gap-3 text-sm" aria-label="Event log">
            {log.map((g) => (
              <li key={g.key}>
                <h3 className="mb-1 rounded-md bg-am-deco-purple px-2 py-0.5 font-display font-bold">
                  {g.title}
                </h3>
                <ul className="flex flex-col gap-0.5 pl-2">
                  {g.lines.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </li>
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
            const next = !muted;
            setMutedState(next);
            setMuted(next);
          }}
        >
          {muted ? "🔇 เปิดเสียง" : "🔊 ปิดเสียง"}
        </StickerButton>
        <StickerButton
          onClick={() => {
            setPopup("history");
          }}
        >
          📜 ประวัติการเล่น
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
        title="การ์ดทั้งหมด"
        open={popup === "cards"}
        onClose={() => {
          setPopup(null);
        }}
      >
        <CardGallery />
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
