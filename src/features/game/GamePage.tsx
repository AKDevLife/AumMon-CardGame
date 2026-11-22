import { discard } from "@aummon/game-engine";
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { StickerButton } from "../../components/StickerButton.tsx";
import { ApiError, callFunction } from "../../lib/api.ts";
import { useAuth } from "../auth/auth-context.ts";
import { AudioSettings } from "./AudioSettings.tsx";
import { CardGallery } from "./CardGallery.tsx";
import { CardView } from "./CardView.tsx";
import { bannerFor, cardName, historyLines } from "./labels.ts";
import { Popup } from "./Popup.tsx";
import { RulesText } from "./RulesText.tsx";
import { CenterTable, GameHeader, Opponents, WinOverlay } from "./TableParts.tsx";
import { normalizeSoundConfig, playSound, setSoundConfig, soundFor } from "./sound.ts";
import type { GameResponse } from "./types.ts";

const POLL_MS = 2000;
type Need = "target" | "card" | "optionalCard" | "pair" | null;

/** What the player must choose before using an ability (Card Library). */
function needOf(ability: discard.AbilityId, underTop: string | null): Need {
  switch (ability) {
    case "glue":
    case "peek":
    case "flashlight":
      return "target";
    case "box":
    case "magnet":
    case "trash":
      return "card";
    case "scissors":
      return "optionalCard";
    case "tape":
      return "pair";
    case "hourglass":
      return underTop ? needOf(discard.getDiscardCard(underTop).ability, null) : null;
    default:
      return null;
  }
}

/** Display-only countdown from the server deadline, corrected by the server clock offset. */
function useCountdown(deadline: string | null, offset: number): number | null {
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
  return deadline ? Math.max(0, Math.ceil((Date.parse(deadline) - now - offset) / 1000)) : null;
}

interface Plan {
  card: { id: string; cardId: string };
  useAbility: boolean;
  target?: number;
  extra?: string | undefined;
  pair: string[];
}

export function GamePage() {
  const { matchId = "" } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const client = auth.mode === "live" ? auth.client : null;
  const [data, setData] = useState<GameResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [popup, setPopup] = useState<"rules" | "cards" | "settings" | "history" | "leave" | null>(
    null,
  );
  const [inspect, setInspect] = useState<{ card: { id: string; cardId: string } } | null>(null);
  const [landKey, setLandKey] = useState(0);
  const [banner, setBanner] = useState<{ text: string; key: number } | null>(null);
  const [dealt, setDealt] = useState<Set<string>>(() => new Set());
  const known = useRef<Set<string> | null>(null);
  const [peek, setPeek] = useState<{ target: number; cards: string[] } | null>(null);
  const [reveal, setReveal] = useState<string[][] | null>(null);
  const lastEvent = useRef<string | null>(null);
  const idem = useRef<{ key: string; body: string } | null>(null);
  const [offset, setOffset] = useState(0);
  const seconds = useCountdown(data?.botActing ? null : (data?.deadline ?? null), offset);

  const refresh = useCallback(
    async (resume = false) => {
      if (!client) return;
      try {
        const next = await callFunction<GameResponse>(client, "game-view", {
          matchId,
          ...(resume && { resume: true }),
        });
        setOffset(next.serverNow - Date.now());
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
    const id = setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [refresh]);

  // Online: private Realtime channel (members only) for instant updates.
  const mode = data?.mode;
  useEffect(() => {
    if (!client || mode !== "online") return;
    const channel = client
      .channel(`match:${matchId}`, { config: { private: true } })
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${matchId}` },
        () => {
          void refresh();
        },
      )
      .subscribe((status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR) void refresh();
      });
    return () => {
      void client.removeChannel(channel);
    };
  }, [client, mode, matchId, refresh]);

  // Admin-chosen sound settings.
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

  // Sounds, Flashlight reveals, Magnifier peeks, landing animation and banners for new events.
  useEffect(() => {
    if (!data) return;
    const keys = data.events.map((e) => JSON.stringify(e));
    const last = keys.at(-1) ?? null;
    if (lastEvent.current !== null && last !== lastEvent.current) {
      const fresh = data.events.slice(keys.lastIndexOf(lastEvent.current) + 1);
      const seat = data.seat;
      const names = [...new Set(fresh.map((e) => soundFor(e, seat)).filter((n) => n !== null))];
      names.slice(0, 3).forEach((n, i) => {
        setTimeout(() => {
          playSound(n);
        }, i * 180);
      });
      const shown = [...fresh].reverse().find((e) => e.type === "reveal_all");
      const became = data.view.acting === data.seat && data.seat !== null;
      const text = bannerFor(fresh, data.seat, data.names, became);
      setTimeout(() => {
        if (shown?.type === "reveal_all") setReveal(shown.hands);
        if (fresh.some((e) => e.type === "played" || e.type === "pile_reset"))
          setLandKey((k) => k + 1);
        if (text) setBanner({ text, key: Date.now() });
      }, 0);
      if (
        became &&
        fresh.some((e) => e.type === "game_started" || e.type === "passed" || e.type === "played")
      )
        playSound("turn");
    }
    lastEvent.current = last;
    const mine = data.peeks[0];
    if (mine)
      setTimeout(() => {
        setPeek(mine);
      }, 0);
  }, [data]);

  // Banners disappear by themselves.
  useEffect(() => {
    if (!banner) return;
    const id = setTimeout(() => {
      setBanner(null);
    }, 1800);
    return () => {
      clearTimeout(id);
    };
  }, [banner]);

  // Cards that arrived since the last view get a short deal animation.
  const handIds = (data?.view.myHand ?? []).map((c) => c.id).join(",");
  useEffect(() => {
    const ids = handIds ? handIds.split(",") : [];
    const prev = known.current;
    const fresh = prev ? ids.filter((id) => !prev.has(id)) : [];
    known.current = new Set(ids);
    setTimeout(() => {
      setDealt(new Set(fresh));
    }, 0);
  }, [handIds]);

  // Flashlight shows every hand for 3 seconds (ruleset 9, Q4).
  useEffect(() => {
    if (!reveal) return;
    const id = setTimeout(() => {
      setReveal(null);
    }, 3000);
    return () => {
      clearTimeout(id);
    };
  }, [reveal]);

  // Bots act one step at a time; timeouts are applied when asked after the deadline.
  const botDeadline = data?.botActing ? data.deadline : null;
  useEffect(() => {
    if (!botDeadline) return;
    const id = setTimeout(
      () => void refresh(),
      Math.max(50, Date.parse(botDeadline) - Date.now() + 60),
    );
    return () => {
      clearTimeout(id);
    };
  }, [botDeadline, refresh]);
  // 5-second warning on your own turn (display + sound only; the server owns the clock).
  const canAct = data !== null && (data.view.canDraw || data.view.canKeep);
  useEffect(() => {
    if (seconds === 5 && canAct) playSound("warning");
  }, [seconds, canAct]);
  // Your turn ended (timeout or server result): close the play dialog.
  useEffect(() => {
    if (canAct) return;
    const id = setTimeout(() => {
      setPlan(null);
    }, 0);
    return () => {
      clearTimeout(id);
    };
  }, [canAct]);
  // Rematch started by anyone at the table: follow it.
  const nextMatchId = data?.nextMatchId ?? null;
  useEffect(() => {
    if (nextMatchId) void navigate(`/game/${nextMatchId}`, { replace: true });
  }, [nextMatchId, navigate]);
  // New match id (rematch): start from a clean screen.
  useEffect(() => {
    lastEvent.current = null;
    known.current = null;
    const id = setTimeout(() => {
      setData(null);
      setPlan(null);
      setInspect(null);
    }, 0);
    return () => {
      clearTimeout(id);
    };
  }, [matchId]);

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
  const name = (s: number) => data.names[s] ?? `ผู้เล่น ${String(s + 1)}`;
  const finished = view.status === "finished";
  const myTurn = view.canDraw || view.canKeep;
  const drawnCard = view.drawn ? (view.myHand.find((c) => c.id === view.drawn) ?? null) : null;
  const rematch = async () => {
    setPending(true);
    try {
      const out = await callFunction<{ matchId: string }>(client, "game-rematch", { matchId });
      void navigate(`/game/${out.matchId}`, { replace: true });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "เริ่มรอบใหม่ไม่สำเร็จ");
    } finally {
      setPending(false);
    }
  };

  const send = async (command: Record<string, unknown>) => {
    setPending(true);
    const body = JSON.stringify(command);
    if (idem.current?.body !== body) idem.current = { key: crypto.randomUUID(), body };
    try {
      const next = await callFunction<GameResponse>(client, "game-command", {
        matchId,
        expectedVersion: data.version,
        idempotencyKey: idem.current.key,
        command,
      });
      setData(next);
      setPlan(null);
      setInspect(null);
      idem.current = null;
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "ส่งคำสั่งไม่สำเร็จ");
      if (e instanceof ApiError && e.status >= 400 && e.status < 500) idem.current = null;
      void refresh();
    } finally {
      setPending(false);
    }
  };

  const leave = async () => {
    setPending(true);
    try {
      await callFunction(client, "game-leave", { matchId });
      void navigate("/");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "ออกจากเกมไม่สำเร็จ");
      setPending(false);
    }
  };

  const top = view.top;
  const planDef = plan ? discard.getDiscardCard(plan.card.cardId) : null;
  const need: Need = plan && planDef && plan.useAbility ? needOf(planDef.ability, top) : null;
  const rest = plan ? view.myHand.filter((c) => c.id !== plan.card.id) : [];
  const opponents = view.players.map((_, i) => i).filter((i) => i !== data.seat);
  const ready =
    plan !== null &&
    (need === null ||
      need === "optionalCard" ||
      (need === "target" && plan.target !== undefined) ||
      (need === "card" && plan.extra !== undefined) ||
      (need === "pair" && plan.pair.length === 2));
  const submitPlan = () => {
    if (!plan) return;
    const choice: Record<string, unknown> = {};
    if (plan.target !== undefined) choice["target"] = plan.target;
    if (plan.extra !== undefined) choice["card"] = plan.extra;
    if (plan.pair.length === 2) choice["pair"] = plan.pair;
    void send({ type: "play", card: plan.card.id, useAbility: plan.useAbility, choice });
  };
  const pairOk = (id: string) => {
    const pts = discard.getDiscardCard(rest.find((c) => c.id === id)?.cardId ?? "D01").points;
    const first = plan?.pair[0];
    return (
      !first ||
      first === id ||
      discard.getDiscardCard(rest.find((c) => c.id === first)?.cardId ?? "D01").points === pts
    );
  };

  const me = data.seat;
  const auto = me !== null && data.autoSeats.includes(me);
  const isBot = (i: number) => /^bot\b|^🤖/i.test(name(i));
  const seats = view.players.map((_, i) => i).filter((i) => i !== me);
  const turnLabel = finished
    ? `จบเกม — ${name(view.winner ?? 0)} ชนะ!`
    : view.reaction
      ? `☂️ ${name(view.reaction.target)} ตัดสินใจใช้ร่ม…`
      : view.acting !== null && view.acting === me
        ? "ตาคุณ!"
        : `ตาของ ${name(view.acting ?? view.current)}`;
  const lastAction = historyLines(data.events, data.names)[0] ?? null;
  const hand = [...view.myHand].sort(
    (a, b) => discard.getDiscardCard(a.cardId).points - discard.getDiscardCard(b.cardId).points,
  );
  const playableCount = view.playable.length;
  const preview = plan ?? inspect;
  const previewOk = preview !== null && myTurn && view.playable.includes(preview.card.id);
  const why = (cardId: string): string => {
    if (finished) return "เกมจบแล้ว";
    if (!myTurn) return "ยังไม่ถึงตาคุณ — อ่านความสามารถไว้ก่อนได้";
    const pts = discard.getDiscardCard(cardId).points;
    if (view.ruler?.seat === me) return "ไม้บรรทัด: ต้องลงแต้ม 5 เท่านั้น (หรือยางลบ)";
    if (view.glue === me && pts < 4) return "ติดกาว: เทิร์นนี้ลงแต้มต่ำกว่า 4 ไม่ได้";
    return top
      ? `ต้องลงแต้มตั้งแต่ ${String(discard.getDiscardCard(top).points)} ขึ้นไป (หรือยางลบ)`
      : "ลงไพ่ใบนี้ไม่ได้ตอนนี้";
  };
  const hint = finished
    ? null
    : !myTurn
      ? view.canReact
        ? "☂️ เลือกว่าจะใช้ร่มไหม"
        : `รอ ${name(view.acting ?? view.current)}…`
      : drawnCard
        ? `จั่วได้ ${cardName(drawnCard.cardId)} — ลงใบนี้ได้เลย หรือเก็บไว้`
        : playableCount > 0
          ? `ตาคุณ! แตะไพ่ขอบเขียวเพื่อลง (ลงได้ ${String(playableCount)} ใบ)`
          : "ไม่มีไพ่ที่ลงได้ — จั่ว 1 ใบแล้วผ่านเทิร์น";

  return (
    <section
      aria-label="กระดานเกม"
      className="fixed inset-0 z-20 flex h-[100dvh] flex-col overflow-hidden bg-am-field pt-[env(safe-area-inset-top)]"
    >
      <GameHeader
        turnLabel={turnLabel}
        mine={myTurn}
        seconds={finished ? null : seconds}
        direction={view.direction}
        onOpen={setPopup}
      />

      <>
        <Opponents view={view} seats={seats} name={name} isBot={isBot} thinking={data.botActing} />
        <div
          role="region"
          aria-label="โต๊ะ"
          tabIndex={0}
          className="relative flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          <CenterTable
            view={view}
            name={name}
            landKey={landKey}
            lastAction={lastAction}
            dense={seats.length > 4}
          />
          {banner && (
            <p
              key={banner.key}
              role="status"
              className="am-banner am-sticker absolute inset-x-6 top-2 z-10 mx-auto max-w-xs bg-am-title px-3 py-2 text-center font-display text-lg font-bold"
            >
              {banner.text}
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="mx-3 mb-2 rounded-lg border-l-4 border-am-red bg-am-error-bg px-2 py-1 font-semibold text-am-danger-text"
            >
              {error}
            </p>
          )}
        </div>

        <div className="shrink-0 rounded-t-[1.75rem] border-t-[3px] border-am-ink bg-am-brand pb-[max(0.5rem,env(safe-area-inset-bottom))] text-am-inverse">
          <div className="flex items-center gap-2 px-3 pt-2">
            <span
              className={`grid h-7 min-w-7 place-items-center rounded-full border-2 border-am-ink px-1 font-display text-sm font-bold text-am-text ${myTurn ? "am-active bg-am-title" : "bg-am-card"}`}
              aria-label={`ไพ่ในมือ ${String(view.myHand.length)} ใบ`}
            >
              {view.myHand.length}
            </span>
            <span className="min-w-0 flex-1 text-[13px] font-semibold leading-tight">
              {hint ?? `ไพ่ในมือ ${String(view.myHand.length)} ใบ`}
            </span>
            {myTurn && (drawnCard !== null || playableCount > 0) && (
              <button
                type="button"
                disabled={pending}
                onClick={() => void send(drawnCard ? { type: "keep" } : { type: "draw" })}
                className="am-sticker am-pressable min-h-10 shrink-0 !rounded-full bg-am-card px-3 font-display text-sm font-bold text-am-text disabled:opacity-60"
              >
                {drawnCard ? "เก็บไว้ จบเทิร์น" : "จั่วไพ่"}
              </button>
            )}
          </div>
          <div
            role="group"
            aria-label="Hand"
            className="am-no-scrollbar flex snap-x gap-2 overflow-x-auto scroll-px-3 px-3 pb-2 pt-3.5"
          >
            {hand.length === 0 && <p className="py-6 text-center text-sm opacity-80">ไม่มีไพ่ในมือ</p>}
            {hand.map((c) => {
              const ok = myTurn && view.playable.includes(c.id);
              return (
                <span key={c.id} className={`snap-start ${dealt.has(c.id) ? "am-deal" : ""}`}>
                  <CardView
                    cardId={c.cardId}
                    playable={ok}
                    dimmed={myTurn && !ok}
                    selected={preview?.card.id === c.id}
                    onSelect={() => {
                      if (ok) setPlan({ card: c, useAbility: true, pair: [] });
                      else setInspect({ card: c });
                    }}
                  />
                </span>
              );
            })}
          </div>
          {myTurn && (drawnCard !== null || playableCount === 0) && (
            <div className="px-3 pt-1">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (drawnCard) setPlan({ card: drawnCard, useAbility: true, pair: [] });
                  else void send({ type: "draw" });
                }}
                className="am-sticker am-pressable am-active min-h-12 w-full !rounded-full bg-am-green font-display text-lg font-bold text-am-success-text disabled:opacity-60"
              >
                {drawnCard ? `ลงใบที่จั่ว (${cardName(drawnCard.cardId)})` : "จั่วไพ่"}
              </button>
            </div>
          )}
          {auto && (
            <div className="mx-3 mt-1 flex items-center gap-2 rounded-xl bg-am-card px-3 py-2 text-am-text">
              <span className="min-w-0 flex-1 text-[13px] font-semibold">
                🤖 หมดเวลา 2 ครั้ง — ระบบกำลังเล่นแทนคุณ
              </span>
              <button
                type="button"
                onClick={() => void refresh(true)}
                className="am-sticker am-pressable min-h-10 shrink-0 !rounded-full bg-am-green px-3 font-display text-sm font-bold text-am-success-text"
              >
                กลับมาเล่นเอง
              </button>
            </div>
          )}
        </div>
      </>

      {finished && (
        <WinOverlay
          title={view.winner === me ? "คุณชนะ! 🎉" : `${name(view.winner ?? 0)} ชนะ 🏆`}
          pending={pending}
          {...(me !== null && { onRematch: () => void rematch() })}
        />
      )}

      <Popup
        title={
          preview
            ? previewOk
              ? `ลง ${cardName(preview.card.cardId)}`
              : cardName(preview.card.cardId)
            : "ลงไพ่"
        }
        open={preview !== null}
        onClose={() => {
          setPlan(null);
          setInspect(null);
        }}
      >
        {preview && !plan && (
          <div className="flex flex-col items-center gap-3">
            <CardView cardId={preview.card.cardId} size="lg" />
            <p className="rounded-xl bg-am-deco-purple px-3 py-2 text-center text-sm font-semibold">
              {why(preview.card.cardId)}
            </p>
          </div>
        )}
        {plan && planDef && (
          <div className="flex flex-col gap-3">
            <div className="flex justify-center">
              <CardView cardId={plan.card.cardId} size="lg" />
            </div>
            {planDef.ability !== "umbrella" && (
              <label className="am-sticker flex cursor-pointer items-center gap-3 !rounded-xl bg-am-deco-purple px-3 py-2 font-semibold">
                <input
                  type="checkbox"
                  checked={plan.useAbility}
                  onChange={(e) => {
                    setPlan({ ...plan, useAbility: e.target.checked });
                  }}
                  className="h-6 w-6 accent-[var(--color-green)]"
                />
                <span>
                  ใช้ความสามารถ “{planDef.abilityName}”
                  <span className="block text-xs font-normal text-am-muted">
                    ไม่ติ๊ก = ลงเป็นไพ่แต้มธรรมดา
                  </span>
                </span>
              </label>
            )}
            {need === "target" && (
              <div role="group" aria-label="เลือกผู้เล่น" className="flex flex-wrap gap-2">
                {opponents.map((i) => (
                  <StickerButton
                    key={i}
                    aria-pressed={plan.target === i}
                    onClick={() => {
                      setPlan({ ...plan, target: i });
                    }}
                    className={plan.target === i ? "!bg-am-title" : ""}
                  >
                    {name(i)}
                  </StickerButton>
                ))}
              </div>
            )}
            {(need === "card" || need === "optionalCard" || need === "pair") && (
              <div role="group" aria-label="เลือกไพ่" className="flex gap-2 overflow-x-auto pb-1">
                {rest.map((c) => {
                  const chosen = need === "pair" ? plan.pair.includes(c.id) : plan.extra === c.id;
                  const allowed =
                    need === "pair"
                      ? pairOk(c.id)
                      : need === "optionalCard"
                        ? discard.getDiscardCard(c.cardId).points >= planDef.points ||
                          discard.getDiscardCard(c.cardId).ability === "eraser"
                        : true;
                  return (
                    <CardView
                      key={c.id}
                      compact
                      cardId={c.cardId}
                      selected={chosen}
                      dimmed={!allowed}
                      {...(allowed && {
                        onSelect: () => {
                          if (need === "pair") {
                            const pair = chosen
                              ? plan.pair.filter((x) => x !== c.id)
                              : [...plan.pair, c.id].slice(-2);
                            setPlan({ ...plan, pair });
                          } else setPlan({ ...plan, extra: chosen ? undefined : c.id });
                        },
                      })}
                    />
                  );
                })}
              </div>
            )}
            {need === "optionalCard" && (
              <p className="text-xs text-am-muted">เลือกไพ่ที่จะลงเพิ่มได้ 1 ใบ (ไม่เลือกก็ได้)</p>
            )}
            {need === "pair" && <p className="text-xs text-am-muted">เลือกไพ่ 2 ใบที่แต้มเท่ากัน</p>}
            <div className="grid grid-cols-[1fr_2fr] gap-2">
              <StickerButton
                onClick={() => {
                  setPlan(null);
                }}
              >
                ยกเลิก
              </StickerButton>
              <StickerButton variant="confirm" disabled={pending || !ready} onClick={submitPlan}>
                ลงไพ่
              </StickerButton>
            </div>
          </div>
        )}
      </Popup>

      <Popup
        title="☂️ ใช้ร่มไหม?"
        open={view.canReact}
        onClose={() => void send({ type: "react", useUmbrella: false })}
      >
        <p className="mb-2">
          คุณกำลังถูก{view.reaction?.kind === "skip" ? "ข้ามเทิร์น" : "บังคับจั่วไพ่"} — ลงร่มเพื่อกันได้
        </p>
        <div className="flex flex-col gap-2">
          <StickerButton
            variant="confirm"
            disabled={pending}
            onClick={() => void send({ type: "react", useUmbrella: true })}
          >
            ☂️ กางร่มกัน
          </StickerButton>
          <StickerButton
            disabled={pending}
            onClick={() => void send({ type: "react", useUmbrella: false })}
          >
            ไม่ใช้
          </StickerButton>
        </div>
      </Popup>

      <Popup
        title={peek ? `🔍 ไพ่ของ ${name(peek.target)}` : "แอบดู"}
        open={peek !== null}
        onClose={() => {
          setPeek(null);
        }}
      >
        <div className="flex gap-2">
          {peek?.cards.map((c, i) => (
            <CardView key={i} cardId={c} compact />
          ))}
        </div>
      </Popup>

      <Popup
        title="🔦 ไฟฉาย: ไพ่ของทุกคน"
        open={reveal !== null}
        onClose={() => {
          setReveal(null);
        }}
      >
        <ul className="flex flex-col gap-1 text-sm">
          {reveal?.map((hand, i) => (
            <li key={i}>
              <b>{name(i)}:</b> {hand.map(cardName).join(", ") || "—"}
            </li>
          ))}
        </ul>
      </Popup>

      <Popup
        title="วิธีเล่น & กติกา"
        open={popup === "rules"}
        onClose={() => {
          setPopup(null);
        }}
      >
        <RulesText />
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
        title="ตั้งค่า"
        open={popup === "settings"}
        onClose={() => {
          setPopup(null);
        }}
      >
        <div className="flex flex-col gap-2">
          <AudioSettings />
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
              onClick={() => {
                setPopup("leave");
              }}
            >
              ออกจากเกม
            </StickerButton>
          )}
        </div>
      </Popup>
      <Popup
        title="ประวัติการเล่น"
        open={popup === "history"}
        onClose={() => {
          setPopup(null);
        }}
      >
        <ol aria-label="Event log" className="flex flex-col gap-1 text-sm">
          {historyLines(data.events, data.names).map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      </Popup>
      <Popup
        title="ออกจากเกม?"
        open={popup === "leave"}
        onClose={() => {
          setPopup(null);
        }}
      >
        <p className="mb-2 text-sm">
          {data.mode === "online" ? "Bot จะเล่นแทนคุณ และคุณกลับเข้ามาเกมนี้ไม่ได้" : "เกมนี้จะจบลงทันที"}
        </p>
        <StickerButton variant="danger" disabled={pending} onClick={() => void leave()}>
          ยืนยันออกจากเกม
        </StickerButton>
      </Popup>
    </section>
  );
}
