import { useState } from "react";

/**
 * 15.5 clickable prototype of the BLUFF flow (mock data, no backend, no real scoring).
 * Design reference: docs/v2/AumMon_UI_UX_Guidelines.md.
 */
type Step = "home" | "lobby" | "read" | "claim" | "lock" | "reveal" | "score" | "results";

const LETTERS = ["A", "B", "C", "D"] as const;
const ITEM = {
  prompt: "มื้อดึก หิวมาก ร้านเปิดอยู่ร้านเดียว จะสั่งอะไร",
  options: ["ข้าวผัดกะเพราไข่ดาว", "มาม่าต้มยำ", "โจ๊กหมูสับ", "ไม่กิน นอนเลย"],
};
const BOTS = [
  { name: "มายด์", claim: 1, answer: 0 },
  { name: "บอส", claim: 0, answer: 0 },
  { name: "ฟ้า", claim: null, answer: 1 },
] as const;
const STEP_TIME: Partial<Record<Step, number>> = {
  read: 6,
  claim: 15,
  lock: 20,
  reveal: 8,
  score: 5,
};

const panel = "rounded-2xl border border-party-border bg-party-surface p-4";
const primary =
  "w-full min-h-12 rounded-2xl bg-party-accent px-4 py-3 text-lg font-bold text-party-bg disabled:opacity-40";

function Choice(props: { label: string; selected: boolean; onClick: () => void; tone: string }) {
  return (
    <button
      type="button"
      aria-pressed={props.selected}
      onClick={props.onClick}
      className={`min-h-12 rounded-xl border px-3 py-2 text-left ${
        props.selected ? `${props.tone} bg-party-surface-raised font-bold` : "border-party-border"
      }`}
    >
      {props.label}
    </button>
  );
}

export function BluffPrototype() {
  const [step, setStep] = useState<Step>("home");
  const [nick, setNick] = useState("");
  const [claim, setClaim] = useState<number | null>(null);
  const [answer, setAnswer] = useState<number | null>(null);
  const [pred, setPred] = useState<number | null>(null);
  const [wager, setWager] = useState(0);

  const me = nick.trim() || "คุณ";
  const votes = LETTERS.map(
    (_, k) => BOTS.filter((b) => b.answer === k).length + (answer === k ? 1 : 0),
  );
  const others = LETTERS.map((_, k) => BOTS.filter((b) => b.answer === k).length);
  const top = Math.max(...others);
  const hit = pred !== null && others[pred] === top;
  const points =
    (hit ? 2 + wager : -wager) + (answer !== null && votes[answer] === Math.max(...votes) ? 1 : 0);
  const timer = STEP_TIME[step];

  return (
    <main className="theme-party mx-auto flex max-w-md flex-col gap-4 px-4 py-6 font-[family-name:var(--font-body)]">
      <header className="flex items-center justify-between">
        <span className="text-xl font-bold text-party-accent">BLUFF</span>
        {timer !== undefined && (
          <span
            className="rounded-full bg-party-surface px-3 py-1 tabular-nums text-party-accent"
            aria-label="เวลา"
          >
            ⏱ {timer} s
          </span>
        )}
      </header>
      <p role="status" className="text-center text-xs text-party-muted">
        Prototype — ข้อมูลจำลอง ยังไม่เชื่อมระบบจริง
      </p>

      {step === "home" && (
        <section className="flex flex-col gap-4">
          <h1 className="text-center text-4xl font-bold">AumMon</h1>
          <p className="text-center text-party-muted">Say Less. Bluff More. Troll Your Friends.</p>
          <label className="flex flex-col gap-1">
            <span>ชื่อเล่น</span>
            <input
              value={nick}
              maxLength={24}
              onChange={(e) => {
                setNick(e.target.value);
              }}
              className="min-h-12 rounded-xl border border-party-border bg-party-surface px-3 text-party-text"
            />
          </label>
          <button
            type="button"
            className={primary}
            onClick={() => {
              setStep("lobby");
            }}
          >
            สร้างห้อง
          </button>
          <button
            type="button"
            className="min-h-12 rounded-2xl border border-party-border"
            onClick={() => {
              setStep("lobby");
            }}
          >
            เข้าห้องด้วยโค้ด
          </button>
        </section>
      )}

      {step === "lobby" && (
        <section className="flex flex-col gap-4">
          <div className={`${panel} text-center`}>
            <p className="text-party-muted">โค้ดห้อง</p>
            <p className="text-4xl font-bold tracking-widest text-party-accent">K7QX</p>
            <p className="text-sm text-party-muted">แชร์ลิงก์ให้เพื่อน · 4 / 8 คน</p>
          </div>
          <ul className="grid grid-cols-2 gap-2" aria-label="ผู้เล่น">
            {[me, ...BOTS.map((b) => b.name)].map((n) => (
              <li key={n} className={`${panel} py-2`}>
                {n} <span className="text-party-green">✓ พร้อม</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-party-muted">ตั้งค่า: เวลาปกติ · ระดับแซว 2 · คำถามกลุ่ม ปิด</p>
          <button
            type="button"
            className={primary}
            onClick={() => {
              setStep("read");
            }}
          >
            เริ่มเกม
          </button>
        </section>
      )}

      {step !== "home" && step !== "lobby" && step !== "results" && (
        <section className={panel} aria-label="สถานการณ์">
          <p className="text-sm text-party-muted">รอบ 1 / 5</p>
          <h2 className="text-xl font-bold">{ITEM.prompt}</h2>
          {step === "read" && (
            <ol className="mt-3 flex flex-col gap-1">
              {ITEM.options.map((o, k) => (
                <li key={o}>
                  <b className="text-party-accent">{LETTERS[k]}</b> {o}
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {step === "read" && (
        <button
          type="button"
          className={primary}
          onClick={() => {
            setStep("claim");
          }}
        >
          ต่อไป
        </button>
      )}

      {step === "claim" && (
        <section className="flex flex-col gap-3">
          <h3 className="font-bold">ประกาศให้ห้องรู้ (จริงหรือหลอกก็ได้)</h3>
          <div className="grid grid-cols-2 gap-2">
            {LETTERS.map((l, k) => (
              <Choice
                key={l}
                label={`ฉันเลือก ${l}`}
                selected={claim === k}
                tone="border-party-pink"
                onClick={() => {
                  setClaim(k);
                }}
              />
            ))}
          </div>
          <ul className={`${panel} text-sm`} aria-label="คำประกาศ">
            {BOTS.filter((b) => b.claim !== null).map((b) => (
              <li key={b.name}>
                {b.name}: ฉันเลือก {LETTERS[b.claim]}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className={primary}
            onClick={() => {
              setStep("lock");
            }}
          >
            {claim === null ? "ไม่ประกาศ" : "ประกาศแล้ว ต่อไป"}
          </button>
        </section>
      )}

      {step === "lock" && (
        <section className="flex flex-col gap-3">
          <h3 className="font-bold">คำตอบของฉัน</h3>
          <div className="grid grid-cols-2 gap-2">
            {ITEM.options.map((o, k) => (
              <Choice
                key={o}
                label={`${LETTERS[k]} ${o}`}
                selected={answer === k}
                tone="border-party-accent"
                onClick={() => {
                  setAnswer(k);
                }}
              />
            ))}
          </div>
          <h3 className="font-bold">ห้องจะเลือกอะไรมากที่สุด</h3>
          <div className="grid grid-cols-4 gap-2">
            {LETTERS.map((l, k) => (
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
          <h3 className="font-bold">เดิมพัน</h3>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((w) => (
              <Choice
                key={w}
                label={`${w}`}
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
            disabled={answer === null || pred === null}
            onClick={() => {
              setStep("reveal");
            }}
          >
            ล็อก
          </button>
        </section>
      )}

      {step === "reveal" && (
        <section className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2" aria-label="ผลโหวต">
            {ITEM.options.map((o, k) => (
              <li key={o} className={`${panel} flex justify-between py-2`}>
                <span>
                  {LETTERS[k]} {o}
                </span>
                <b className="tabular-nums">{votes[k]}</b>
              </li>
            ))}
          </ul>
          <ul className={`${panel} text-sm`} aria-label="ใครโกหก">
            {BOTS.filter((b) => b.claim !== null).map((b) => (
              <li key={b.name}>
                {b.name} ประกาศ {LETTERS[b.claim]} · ตอบจริง {LETTERS[b.answer]}{" "}
                {b.claim !== b.answer ? (
                  <b className="text-party-pink">โกหก!</b>
                ) : (
                  <b className="text-party-green">พูดจริง</b>
                )}
              </li>
            ))}
          </ul>
          <p className="text-center italic text-party-muted">"มีคนพูดจริง… แต่ไม่มีใครเชื่อ"</p>
          <button
            type="button"
            className={primary}
            onClick={() => {
              setStep("score");
            }}
          >
            ดูคะแนน
          </button>
        </section>
      )}

      {step === "score" && (
        <section className="flex flex-col gap-3">
          <div className={`${panel} text-center`}>
            <p className="text-party-muted">{hit ? "ทายใจห้องถูก!" : "ทายผิด"}</p>
            <p
              className={`text-4xl font-bold tabular-nums ${points >= 0 ? "text-party-green" : "text-party-red"}`}
            >
              {points >= 0 ? `+${points}` : points}
            </p>
          </div>
          <button
            type="button"
            className={primary}
            onClick={() => {
              setStep("results");
            }}
          >
            ข้ามไปผลสุดท้าย (prototype)
          </button>
        </section>
      )}

      {step === "results" && (
        <section className="flex flex-col gap-3">
          <h2 className="text-center text-2xl font-bold">ผลการแข่งขัน</h2>
          <ol className="flex flex-col gap-2" aria-label="อันดับ">
            {[
              { n: "บอส", s: 14, r: 4 },
              { n: me, s: 11, r: 3 },
              { n: "มายด์", s: 9, r: 2 },
              { n: "ฟ้า", s: 6, r: 2 },
            ].map((p, i) => (
              <li key={p.n} className={`${panel} flex justify-between py-2`}>
                <span>
                  {["👑", "🥈", "🥉", "4."][i]} {p.n}{" "}
                  <span className="text-sm text-party-muted">อ่านใจถูก {p.r} ครั้ง</span>
                </span>
                <b className="tabular-nums text-party-accent">{p.s}</b>
              </li>
            ))}
          </ol>
          <button
            type="button"
            className={primary}
            onClick={() => {
              setStep("lobby");
              setClaim(null);
              setAnswer(null);
              setPred(null);
              setWager(0);
            }}
          >
            เล่นอีกรอบ
          </button>
          <button type="button" className="min-h-12 rounded-2xl border border-party-border">
            แชร์ผล
          </button>
        </section>
      )}
    </main>
  );
}
