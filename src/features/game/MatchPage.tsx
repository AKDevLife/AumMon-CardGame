import type { PlayerGameView } from "@aummon/game-engine";
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { StickerButton } from "../../components/StickerButton.tsx";
import { ApiError, callFunction } from "../../lib/api.ts";
import { useAuth } from "../auth/auth-context.ts";
import { HandoffScreen } from "../passplay/HandoffScreen.tsx";
import { CARD_INFO, CHARACTER_NAME, describeEvent, PHASE_LABEL } from "./labels.ts";
import type { MatchResponse } from "./types.ts";

const POLL_MS = 2000;

interface Selection {
  cardId: string;
  targetId?: string;
  choice?: "heal" | "draw";
}

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

function Hearts({ hp, max }: { hp: number; max: number }) {
  return (
    <span aria-label={`HP ${hp}/${max}`} className="tracking-tight">
      {Array.from({ length: max }, (_, i) => (i < hp ? "❤️" : "🤍")).join("")}
    </span>
  );
}

function PlayerBoard({
  view,
  me,
  online,
}: {
  view: PlayerGameView;
  me: string | null;
  online: Set<string> | null;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3" aria-label="Players">
      {view.players.map((p) => (
        <li
          key={p.id}
          className={`am-sticker p-3 ${p.status === "alive" ? "bg-am-card" : "bg-am-deco-purple opacity-60"} ${p.id === me ? "outline-[3px] outline-am-accent" : ""}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-display font-bold">
              {p.displayName}
              {p.id === me ? " (คุณ)" : ""}
            </span>
            <span className="flex items-center gap-1">
              {online && (
                <span
                  aria-label={online.has(p.id) ? "ออนไลน์" : "ออฟไลน์"}
                  className={`inline-block h-2.5 w-2.5 rounded-full ${online.has(p.id) ? "bg-am-confirm" : "bg-am-muted"}`}
                />
              )}
              {p.hasSubmitted && <span title="เลือกแล้ว">✅</span>}
            </span>
          </div>
          <div className="text-xs text-am-muted">
            {CHARACTER_NAME[p.characterId] ?? p.characterId}
          </div>
          <Hearts hp={Math.max(0, p.hp)} max={p.maxHp} />
          {p.status !== "alive" && (
            <div className="text-xs font-semibold text-am-danger">ถูกคัดออก</div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function MatchPage() {
  const { matchId = "" } = useParams();
  const auth = useAuth();
  const [data, setData] = useState<MatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [pending, setPending] = useState(false);
  const idempotencyKey = useRef<string | null>(null);
  const seconds = useCountdown(data?.deadline ?? null);
  const client = auth.mode === "live" ? auth.client : null;

  const passPlayRef = useRef(false);

  const refresh = useCallback(
    async (reveal = false) => {
      if (!client) return;
      try {
        const next = await callFunction<MatchResponse>(client, "matches-view", { matchId, reveal });
        passPlayRef.current = next.mode === "pass_play";
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
    // Pass & Play has no remote players or timers; polling would also hide a revealed hand.
    const id = setInterval(() => {
      if (!passPlayRef.current) void refresh();
    }, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [refresh]);

  // Online: private Realtime channel (members only, RLS) for match updates + Presence.
  const [online, setOnline] = useState<Set<string>>(new Set());
  const mode = data?.mode;
  const me = data?.viewerPlayerId ?? null;
  useEffect(() => {
    if (!client || mode !== "online" || !me) return;
    const channel = client.channel(`match:${matchId}`, {
      config: { private: true, presence: { key: me } },
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
  }, [client, mode, me, matchId, refresh]);

  // When the server deadline passes, ask the server to apply the timeout (Rule 14).
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
  const handoff =
    data.mode === "pass_play" &&
    view.result.status === "ongoing" &&
    data.currentSeat !== null &&
    data.viewerPlayerId !== data.currentSeat.playerId;
  const mine = view.players.find((p) => p.id === me);
  const name = (id: unknown) => view.players.find((p) => p.id === id)?.displayName ?? "?";
  const opponents = view.players.filter((p) => p.id !== me && p.status === "alive");
  const canAct = view.phase === "select" && mine?.status === "alive" && !mine.hasSubmitted;
  const myAquaWindow = view.phase === "turn_start" && mine?.characterId === "aqua_otter";
  const card = selection ? view.myHand.find((c) => c.instanceId === selection.cardId) : undefined;
  const info = card ? CARD_INFO[card.definitionId] : undefined;
  const ready =
    card && info && (!info.target || selection?.targetId) && (!info.choice || selection?.choice);

  const send = async (fn: string, body: Record<string, unknown>) => {
    setPending(true);
    try {
      setData(await callFunction<MatchResponse>(client, fn, body));
      setSelection(null);
      idempotencyKey.current = null;
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "ส่งคำสั่งไม่สำเร็จ");
      if (e instanceof ApiError && e.status >= 400 && e.status < 500) idempotencyKey.current = null;
      void refresh();
    } finally {
      setPending(false);
    }
  };

  const submit = () => {
    if (!selection) return;
    // Retries reuse the same key (blueprint §8.3); a new selection gets a new key.
    idempotencyKey.current ??= crypto.randomUUID();
    void send("matches-submit-action", {
      matchId,
      roundNumber: view.round,
      expectedVersion: view.version,
      cardInstanceId: selection.cardId,
      idempotencyKey: idempotencyKey.current,
      ...(selection.targetId && { targetPlayerId: selection.targetId }),
      ...(selection.choice && { choice: selection.choice }),
    });
  };

  const recent = view.events
    .filter((e) => e.round >= view.round - 1)
    .map((e) => describeEvent(e, name))
    .filter((line): line is string => line !== null)
    .slice(-12);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-am-round px-3 py-1 text-sm font-bold text-white">
          รอบ {view.round}
        </span>
        <span className="font-semibold">{PHASE_LABEL[view.phase] ?? view.phase}</span>
        {seconds !== null && (
          <span className="font-display font-bold tabular-nums">⏱ {seconds}s</span>
        )}
      </div>

      {view.result.status !== "ongoing" && (
        <div role="status" className="am-sticker bg-am-title p-4 text-center">
          <h1 className="font-display text-3xl font-bold">
            {view.result.status === "draw"
              ? "เสมอ!"
              : view.result.winnerId === me
                ? "คุณชนะ! 🎉"
                : `${name(view.result.winnerId)} ชนะ`}
          </h1>
          <Link
            to="/play/solo"
            className="mt-2 inline-block font-semibold text-am-accent underline"
          >
            เล่นอีกครั้ง
          </Link>
        </div>
      )}

      <PlayerBoard view={view} me={me} online={data.mode === "online" ? online : null} />

      {handoff && data.currentSeat && (
        <HandoffScreen
          name={data.currentSeat.displayName}
          pending={pending}
          onReveal={() => {
            setPending(true);
            void refresh(true).finally(() => {
              setPending(false);
            });
          }}
        />
      )}

      {!handoff && myAquaWindow && (
        <div className="am-sticker flex flex-col gap-2 bg-am-deco-green p-4">
          <h2 className="font-display font-bold">สกิล Aqua: สลับการ์ดสุ่ม 1 ใบ (ครั้งเดียวต่อเกม)</h2>
          <div className="flex flex-wrap gap-2">
            {opponents.map((p) => (
              <StickerButton
                key={p.id}
                disabled={pending}
                onClick={() => void send("matches-use-skill", { matchId, targetPlayerId: p.id })}
              >
                สลับกับ {p.displayName}
              </StickerButton>
            ))}
            <StickerButton
              disabled={pending}
              onClick={() => void send("matches-use-skill", { matchId })}
            >
              ข้าม
            </StickerButton>
          </div>
        </div>
      )}

      {!handoff && (
        <div>
          <h2 className="mb-2 font-display text-lg font-semibold">
            การ์ดในมือ ({view.myHand.length}/5)
          </h2>
          <div role="group" aria-label="Hand" className="grid grid-cols-3 gap-2">
            {view.myHand.map((c) => {
              const meta = CARD_INFO[c.definitionId];
              const selected = selection?.cardId === c.instanceId;
              return (
                <button
                  key={c.instanceId}
                  type="button"
                  disabled={!canAct || pending}
                  aria-pressed={selected}
                  onClick={() => {
                    setSelection({ cardId: c.instanceId });
                    idempotencyKey.current = null;
                  }}
                  className={`am-sticker am-pressable flex min-h-24 flex-col p-2 text-left disabled:opacity-60 ${selected ? "bg-am-hover" : "bg-am-card"}`}
                >
                  <span className="font-display font-bold">{meta?.label ?? c.name}</span>
                  <span className="text-[11px] leading-tight text-am-muted">{meta?.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {canAct && info?.target && (
        <div role="group" className="flex flex-wrap gap-2" aria-label="Target">
          {opponents.map((p) => (
            <StickerButton
              key={p.id}
              aria-pressed={selection?.targetId === p.id}
              className={selection?.targetId === p.id ? "bg-am-hover" : ""}
              onClick={() => {
                if (selection) setSelection({ ...selection, targetId: p.id });
              }}
            >
              🎯 {p.displayName}
            </StickerButton>
          ))}
        </div>
      )}
      {canAct && info?.choice && (
        <div className="flex gap-2">
          {(["heal", "draw"] as const).map((choice) => (
            <StickerButton
              key={choice}
              aria-pressed={selection?.choice === choice}
              className={selection?.choice === choice ? "bg-am-hover" : ""}
              onClick={() => {
                if (selection) setSelection({ ...selection, choice });
              }}
            >
              {choice === "heal" ? "ฟื้น HP" : "จั่วการ์ด"}
            </StickerButton>
          ))}
        </div>
      )}
      {canAct && (
        <StickerButton
          variant="confirm"
          disabled={!ready || pending}
          onClick={submit}
          className="min-h-14"
        >
          {pending ? "กำลังส่ง…" : "ยืนยันการ์ด (คว่ำหน้า)"}
        </StickerButton>
      )}
      {!canAct && !handoff && view.result.status === "ongoing" && !myAquaWindow && (
        <p className="text-center text-am-muted">รอผู้เล่นคนอื่น…</p>
      )}

      {error && (
        <p role="alert" className="font-semibold text-am-danger">
          {error}
        </p>
      )}

      {data.mode !== "pass_play" &&
        mine?.status === "alive" &&
        view.result.status === "ongoing" && (
          <StickerButton
            variant="danger"
            disabled={pending}
            onClick={() => {
              if (window.confirm("ยอมแพ้และออกจากเกมนี้?")) void send("matches-forfeit", { matchId });
            }}
          >
            ยอมแพ้
          </StickerButton>
        )}

      <div className="am-sticker bg-am-card p-3">
        <h2 className="mb-1 font-display font-semibold">เหตุการณ์ล่าสุด</h2>
        <ol className="flex flex-col gap-1 text-sm" aria-label="Event log">
          {recent.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}
