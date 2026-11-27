import type { ReactNode } from "react";
import { BLUFF_TAUNTS, type BluffView } from "@aummon/game-engine";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { callFunction } from "../../lib/api.ts";
import { useMatch } from "../../platform/useMatch.ts";
import { useAuth } from "../auth/auth-context.ts";
import { alertBox, panel, primary, secondary } from "./ui.ts";

const L = ["A", "B", "C", "D"] as const;
const NARRATION = [
  "ห้องนี้โกหกเก่งกว่าที่คิด",
  "มีคนพูดจริง… แต่ไม่มีใครเชื่อ",
  "อ่านใจกันออกหมดเลยเหรอ",
  "ใครหน้านิ่งที่สุด ระวังคนนั้น",
  "รอบสุดท้ายคะแนน ×2 ทุกอย่างเปลี่ยนได้",
];
const PHASE_LABEL: Record<string, string> = {
  read: "อ่านสถานการณ์",
  claim: "ประกาศ",
  lock: "ล็อกคำตอบ",
  reveal: "เฉลย",
  score: "คะแนน",
  finished: "จบเกม",
};

function Choice(props: {
  label: string;
  sub?: string | undefined;
  selected?: boolean;
  tone?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={props.selected}
      disabled={props.disabled}
      onClick={props.onClick}
      className={`min-h-12 rounded-xl border px-3 py-2 text-left disabled:opacity-40 ${
        props.selected === true
          ? `${props.tone ?? "border-party-accent"} bg-party-surface-raised font-bold`
          : "border-party-border"
      }`}
    >
      {props.label}
      {props.sub !== undefined && (
        <span className="block text-sm font-normal text-party-muted">{props.sub}</span>
      )}
    </button>
  );
}

const sign = (n: number) => (n > 0 ? `+${String(n)}` : String(n));

/** Live BLUFF match (R3): every result comes from the server; the client only sends intents. */
export function BluffGame() {
  const { matchId = "" } = useParams();
  const auth = useAuth();
  const navigate = useNavigate();
  const m = useMatch<BluffView>(matchId);
  const [answer, setAnswer] = useState<number | null>(null);
  const [pred, setPred] = useState<number | null>(null);
  const [wager, setWager] = useState<0 | 1 | 2>(0);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [reported, setReported] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const roundKey = m.data ? String(m.data.view.round) : "";
  const lastRound = useRef(roundKey);
  const { refresh, seconds } = m;

  // New round: clear the local lock form.
  useEffect(() => {
    if (lastRound.current === roundKey) return;
    lastRound.current = roundKey;
    const id = setTimeout(() => {
      setAnswer(null);
      setPred(null);
      setWager(0);
    }, 0);
    return () => {
      clearTimeout(id);
    };
  }, [roundKey]);

  // At the deadline ask the server (it advances phases lazily on the next request).
  useEffect(() => {
    if (seconds !== 0) return;
    const id = setTimeout(() => void refresh(), 400);
    return () => {
      clearTimeout(id);
    };
  }, [seconds, refresh]);

  if (!m.live) return <p className="text-center text-party-muted">ยังไม่เชื่อมระบบจริง (Preview)</p>;
  if (!m.data) return <p className="text-center text-party-muted">{m.error ?? "กำลังโหลด…"}</p>;
  const { data } = m;
  if (data.gameId !== "bluff") {
    void navigate(`/game/${matchId}`, { replace: true });
    return null;
  }
  const v = data.view;
  const me = data.seat;
  const names = data.names;
  const pending = new Set(data.pending ?? []);
  const myTurn = me !== null && pending.has(me);
  const item = v.item;
  const options = item?.options ?? [];

  const report = async (contentId: string) => {
    if (auth.mode !== "live") return;
    try {
      await callFunction(auth.client, "content-report", { contentId, matchId });
      setReported(contentId);
    } catch {
      setReported(null);
    }
  };

  const shareResult = async () => {
    const order = v.players
      .map((_, i) => i)
      .sort((a, b) => (v.placements?.[a] ?? 9) - (v.placements?.[b] ?? 9));
    const lines = order.map(
      (i) =>
        `${String(v.placements?.[i] ?? "")}. ${names[i] ?? ""} ${String(v.scores[i] ?? 0)} แต้ม`,
    );
    const text = `AumMon BLUFF 🎭\n${lines.join("\n")}\nSay Less. Bluff More.`;
    const url = window.location.origin;
    try {
      if (typeof navigator.share === "function")
        await navigator.share({ title: "AumMon BLUFF", text, url });
      else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setShared(true);
      }
    } catch {
      // share sheet closed
    }
  };

  const header = (
    <header className="flex items-center justify-between">
      <span className="text-sm text-party-muted">
        รอบ {v.round} / {v.rounds} · {PHASE_LABEL[v.phase] ?? v.phase}
      </span>
      {seconds !== null && v.phase !== "finished" && (
        <span
          role="timer"
          aria-label="เวลา"
          className="rounded-full bg-party-surface px-3 py-1 tabular-nums text-party-accent"
        >
          ⏱ {seconds} s
        </span>
      )}
    </header>
  );

  const situation = item && v.phase !== "finished" && (
    <section className={panel} aria-label="สถานการณ์">
      {v.finalRound && <p className="mb-1 text-sm font-bold text-party-pink">รอบสุดท้าย คะแนน ×2</p>}
      <h1 className="text-xl font-bold">{item.prompt}</h1>
      {(v.phase === "read" || v.phase === "claim") && (
        <ol className="mt-3 flex flex-col gap-1">
          {options.map((o, k) => (
            <li key={o}>
              <b className="text-party-accent">{L[k]}</b> {o}
            </li>
          ))}
        </ol>
      )}
    </section>
  );

  const feed = (
    <ul className={`${panel} text-sm`} aria-label="คำประกาศ">
      {v.acts.every((a) => a === null) && <li className="text-party-muted">ยังไม่มีใครประกาศ</li>}
      {v.acts.map((a, i) =>
        a === null ? null : (
          <li key={i}>
            <b>{names[i]}</b>:{" "}
            {a.kind === "claim"
              ? `ฉันเลือก ${L[a.option]} (${options[a.option] ?? ""})`
              : a.kind === "taunt"
                ? (BLUFF_TAUNTS[a.taunt] ?? "")
                : "ไม่ประกาศ"}
          </li>
        ),
      )}
    </ul>
  );

  const who = (
    <ul className="flex flex-wrap gap-2" aria-label="สถานะผู้เล่น">
      {v.players.map((_, i) => (
        <li
          key={i}
          className={`rounded-full border px-3 py-1 text-sm ${
            pending.has(i)
              ? "border-party-border text-party-muted"
              : "border-party-green text-party-green"
          }`}
        >
          {names[i]} {pending.has(i) ? "…" : "✓"}
          {data.autoSeats.includes(i) && " (AFK)"}
        </li>
      ))}
    </ul>
  );

  let body: ReactNode = null;
  if (v.phase === "read")
    body = <p className="text-center text-party-muted">อ่านให้ดี แล้วเตรียมตบตา…</p>;
  if (v.phase === "claim")
    body = myTurn ? (
      <section className="flex flex-col gap-3">
        <h2 className="font-bold">ประกาศให้ห้องรู้ (จริงหรือหลอกก็ได้)</h2>
        <div className="grid grid-cols-2 gap-2">
          {L.map((l, k) => (
            <Choice
              key={l}
              label={`ฉันเลือก ${l}`}
              sub={options[k]}
              disabled={m.busy}
              onClick={() => void m.send({ type: "claim", option: k })}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2" aria-label="คำแซว">
          {BLUFF_TAUNTS.map((t, k) => (
            <button
              key={t}
              type="button"
              disabled={m.busy}
              className="rounded-full border border-party-border px-3 py-2 text-sm"
              onClick={() => void m.send({ type: "taunt", taunt: k })}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={secondary}
          disabled={m.busy}
          onClick={() => void m.send({ type: "pass" })}
        >
          ไม่ประกาศ
        </button>
        {feed}
      </section>
    ) : (
      <>
        <p className="text-center text-party-muted">รอคนอื่นประกาศ…</p>
        {feed}
        {who}
      </>
    );
  if (v.phase === "lock")
    body = myTurn ? (
      <section className="flex flex-col gap-3">
        {feed}
        <h2 className="font-bold">คำตอบของฉัน</h2>
        <div className="grid grid-cols-2 gap-2">
          {options.map((o, k) => (
            <Choice
              key={o}
              label={`${L[k] ?? ""} ${o}`}
              selected={answer === k}
              onClick={() => {
                setAnswer(k);
              }}
            />
          ))}
        </div>
        <h2 className="font-bold">ห้องจะเลือกอะไรมากที่สุด</h2>
        <div className="grid grid-cols-4 gap-2">
          {L.map((l, k) => (
            <Choice
              key={l}
              label={l}
              selected={pred === k}
              tone="border-party-blue"
              onClick={() => {
                setPred(k);
              }}
            />
          ))}
        </div>
        <h2 className="font-bold">เดิมพัน (ทายถูก +2 + เดิมพัน · ผิด −เดิมพัน)</h2>
        <div className="grid grid-cols-3 gap-2">
          {([0, 1, 2] as const).map((w) => (
            <Choice
              key={w}
              label={String(w)}
              selected={wager === w}
              tone="border-party-pink"
              onClick={() => {
                setWager(w);
              }}
            />
          ))}
        </div>
        <button
          type="button"
          className={primary}
          disabled={answer === null || pred === null || m.busy}
          onClick={() => void m.send({ type: "lock", answer, prediction: pred, wager })}
        >
          ล็อก
        </button>
      </section>
    ) : (
      <>
        <p className="text-center text-party-muted">
          {v.myLock ? "ล็อกแล้ว รอคนอื่น…" : "รอผู้เล่นล็อกคำตอบ…"}
        </p>
        {who}
      </>
    );

  const rec = v.reveal;
  if ((v.phase === "reveal" || v.phase === "score") && rec) {
    const votes = [0, 1, 2, 3].map((k) => rec.locks.filter((l) => l.answer === k).length);
    body = (
      <section className="flex flex-col gap-3">
        <ul className="flex flex-col gap-2" aria-label="ผลโหวต">
          {options.map((o, k) => (
            <li key={o} className={`${panel} flex justify-between py-2`}>
              <span>
                {L[k]} {o}
              </span>
              <b className="tabular-nums">{votes[k]}</b>
            </li>
          ))}
        </ul>
        <ul className={`${panel} flex flex-col gap-1 text-sm`} aria-label="ใครโกหก">
          {rec.locks.map((l, i) => {
            const claim = rec.claims[i];
            const pts = rec.points[i];
            return (
              <li key={i} className="flex justify-between gap-2">
                <span>
                  <b>{names[i]}</b> ตอบ {l.answer === null ? "—" : L[l.answer]} · ทาย{" "}
                  {l.prediction === null ? "—" : L[l.prediction]} · เดิมพัน {l.wager}
                  {claim !== null && claim !== undefined && (
                    <>
                      {" "}
                      ·{" "}
                      {claim !== l.answer ? (
                        <b className="text-party-pink">โกหก!</b>
                      ) : (
                        <b className="text-party-green">พูดจริง</b>
                      )}
                    </>
                  )}
                </span>
                <b
                  className={`tabular-nums ${(pts?.total ?? 0) >= 0 ? "text-party-green" : "text-party-red"}`}
                >
                  {sign(pts?.total ?? 0)}
                </b>
              </li>
            );
          })}
        </ul>
        <p className="text-center italic text-party-muted">
          “{NARRATION[(v.round - 1) % NARRATION.length]}”
        </p>
        {v.phase === "score" && (
          <ol className={`${panel} flex flex-col gap-1`} aria-label="คะแนนรวม">
            {v.players
              .map((_, i) => i)
              .sort((a, b) => (v.scores[b] ?? 0) - (v.scores[a] ?? 0))
              .map((i) => (
                <li key={i} className="flex justify-between">
                  <span>{names[i]}</span>
                  <b className="tabular-nums text-party-accent">{v.scores[i]}</b>
                </li>
              ))}
          </ol>
        )}
        <button
          type="button"
          className="self-center text-xs text-party-muted underline"
          disabled={reported === rec.itemId}
          onClick={() => void report(rec.itemId)}
        >
          {reported === rec.itemId ? "รายงานแล้ว ขอบคุณ" : "รายงานคำถามนี้ว่าไม่เหมาะสม"}
        </button>
      </section>
    );
  }

  if (v.phase === "finished") {
    const order = v.players
      .map((_, i) => i)
      .sort((a, b) => (v.placements?.[a] ?? 9) - (v.placements?.[b] ?? 9));
    body = (
      <section className="flex flex-col gap-3">
        <h1 className="text-center text-2xl font-bold">ผลการแข่งขัน</h1>
        <ol className="flex flex-col gap-2" aria-label="อันดับ">
          {order.map((i) => {
            const place = v.placements?.[i] ?? 0;
            return (
              <li key={i} className={`${panel} flex justify-between py-2`}>
                <span>
                  {place === 1
                    ? "👑"
                    : place === 2
                      ? "🥈"
                      : place === 3
                        ? "🥉"
                        : `${String(place)}.`}{" "}
                  {names[i]}{" "}
                  <span className="text-sm text-party-muted">อ่านใจถูก {v.hits[i]} ครั้ง</span>
                </span>
                <b className="tabular-nums text-party-accent">{v.scores[i]}</b>
              </li>
            );
          })}
        </ol>
        <button type="button" className={primary} onClick={() => void shareResult()}>
          {shared ? "คัดลอกผลแล้ว ✓" : "แชร์ผล"}
        </button>
        <Link to={`/party/lobby/${data.roomId}`} className={secondary}>
          กลับห้อง (เล่นอีกรอบ)
        </Link>
        <Link to="/bluff" className={secondary}>
          หน้าหลัก
        </Link>
      </section>
    );
  }

  return (
    <>
      {header}
      {m.error && (
        <p role="alert" className={alertBox}>
          {m.error}
        </p>
      )}
      {situation}
      {body}
      {v.phase !== "finished" &&
        (confirmLeave ? (
          <button
            type="button"
            className={secondary}
            onClick={() => void m.leave().then(() => navigate("/bluff"))}
          >
            ยืนยันออกจากเกม
          </button>
        ) : (
          <button
            type="button"
            className="self-center text-sm text-party-muted underline"
            onClick={() => {
              setConfirmLeave(true);
            }}
          >
            ออกจากเกม
          </button>
        ))}
    </>
  );
}
