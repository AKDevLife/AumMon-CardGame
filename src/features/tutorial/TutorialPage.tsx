import { createSeededRandom, discard } from "@aummon/game-engine";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { StickerButton } from "../../components/StickerButton.tsx";
import { CardView } from "../game/CardView.tsx";
import { playSound } from "../game/sound.ts";

/**
 * Interactive tutorial (docs/discard/AumMon_Tutorial_Design.md): 7 scripted situations run on the
 * real engine locally (nothing is sent to the server, nothing is saved).
 */
type State = discard.GameState;

interface Step {
  title: string;
  hint: string;
  /** Builds the scripted situation. */
  build: () => State;
  /** True when the player has done what the step teaches. */
  done: (events: readonly discard.GameEvent[], s: State) => boolean;
  /** Ability switch starts on/off for this step. */
  ability?: boolean;
}

let uid = 0;
const card = (cardId: string) => ({ id: `tut${String(uid++)}`, cardId });

/** You (seat 0) vs Bot (seat 1); `top` on the pile; scripted hands and draw pile. */
function table(top: string, mine: string[], bot: string[], draws: string[] = ["D01"]): State {
  const { state } = discard.startGame(["you", "bot"], createSeededRandom([1, 2, 3, 4]));
  state.players[0] = { playerId: "you", hand: mine.map(card) };
  state.players[1] = { playerId: "bot", hand: bot.map(card) };
  state.pile = [card(top)];
  state.drawPile = [...draws, ...Array.from({ length: 20 }, () => "D01")].map(card);
  state.current = 0;
  state.open = false;
  state.drawn = null;
  return state;
}

const STEPS: Step[] = [
  {
    title: "ลงไพ่",
    hint: "ลงไพ่ที่แต้มเท่ากันหรือสูงกว่าใบบนกอง (3) — แตะใบที่มีขอบเขียว แล้วกด 'ลงไพ่'",
    build: () => table("D05", ["D01", "D06", "D13"], ["D04", "D04"]),
    done: (ev) => ev.some((e) => e.type === "played" && e.seat === 0),
    ability: false,
  },
  {
    title: "จั่วไพ่",
    hint: "ไม่มีใบไหนลงได้ (บนกองคือ 7) — กด 'จั่วไพ่'",
    build: () => table("D16", ["D01", "D02"], ["D04", "D04"], ["D11"]),
    done: (ev) => ev.some((e) => e.type === "passed" && e.seat === 0),
  },
  {
    title: "จั่วแล้วลง",
    hint: "จั่ว 1 ใบ — ถ้าใบที่จั่วลงได้ กด 'ลงใบที่จั่ว' ได้ทันที",
    build: () => table("D06", ["D01", "D02"], ["D04", "D04"], ["D12"]),
    done: (ev) => ev.some((e) => e.type === "played" && e.seat === 0),
    ability: false,
  },
  {
    title: "ใช้พลังการ์ด",
    hint: "ลง 'กุญแจ' โดยเปิด 'ใช้ความสามารถ' — Bot จะโดนข้ามเทิร์น",
    build: () => table("D01", ["D13", "D02"], ["D04", "D04"]),
    done: (ev) => ev.some((e) => e.type === "skipped" && e.seat === 1),
    ability: true,
  },
  {
    title: "เลือกเป้าหมาย",
    hint: "ลง 'กาวน้ำ' แล้วเลือก Bot เป็นเป้าหมาย — เทิร์นหน้าเขาห้ามลงแต้ม 1–3",
    build: () => table("D01", ["D02", "D06"], ["D04", "D04"]),
    done: (ev) => ev.some((e) => e.type === "ability" && e.ability === "glue" && e.target === 1),
    ability: true,
  },
  {
    title: "กองใหม่",
    hint: "ลงไพ่ใบไหนก็ได้ 1 ใบ — Bot จะลงไม่ได้ ทุกคนผ่าน = กองใหม่ คุณเริ่มด้วยแต้มไหนก็ได้",
    build: () => table("D05", ["D09", "D01"], ["D02"], ["D01"]),
    done: (ev, s) =>
      s.open && ev.some((e) => e.type === "played" && e.seat === 0 && s.current === 0),
    ability: false,
  },
  {
    title: "ชนะ!",
    hint: "เหลือใบสุดท้าย — ลงให้หมดมือแล้วคุณชนะ",
    build: () => table("D06", ["D09"], ["D04", "D04"]),
    done: (ev) => ev.some((e) => e.type === "game_over" && e.winner === 0),
    ability: false,
  },
];

export function TutorialPage() {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const [state, setState] = useState<State>(() => STEPS[0]?.build() ?? table("D01", [], []));
  const [selected, setSelected] = useState<string | null>(null);
  const [useAbility, setUseAbility] = useState(false);
  const [doneNow, setDoneNow] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const rng = useMemo(() => createSeededRandom([7, 7, 7, 7]), []);
  const view = discard.getView(state, 0);
  const finished = step >= STEPS.length;

  const go = (next: number) => {
    const s = STEPS[next];
    setStep(next);
    setSelected(null);
    setDoneNow(false);
    setMessage(null);
    if (s) {
      setState(s.build());
      setUseAbility(s.ability ?? false);
    }
  };

  const apply = (cmd: discard.Command) => {
    if (!current) return;
    try {
      let t = discard.applyCommand(state, cmd, rng);
      const events = [...t.events];
      // The bot answers until it is your turn again (it never wins in the tutorial).
      for (let i = 0; i < 6 && t.state.status === "active"; i++) {
        const seat = discard.actingSeat(t.state);
        if (seat !== 1) break;
        t = discard.applyCommand(t.state, discard.chooseBotCommand(t.state, 1, rng), rng);
        events.push(...t.events);
      }
      setState(t.state);
      setSelected(null);
      playSound(cmd.type === "play" ? "play" : "draw");
      if (current.done(events, t.state)) {
        setDoneNow(true);
        playSound(step === STEPS.length - 1 ? "win" : "turn");
      }
    } catch (e) {
      if (e instanceof discard.CommandError) setMessage("ทำแบบนี้ไม่ได้ ลองอ่านคำใบ้อีกครั้ง");
      else throw e;
    }
  };

  if (finished || !current)
    return (
      <section className="am-sticker flex flex-col items-center gap-4 bg-am-title p-6 text-center">
        <h1 className="font-display text-3xl font-bold">พร้อมเล่นแล้ว! 🎉</h1>
        <p>เท่านี้คุณก็รู้ทุกอย่างที่ต้องใช้ ที่เหลือแตะการ์ดเพื่ออ่านพลังได้ตลอด</p>
        <Link
          to="/play/solo"
          className="am-sticker am-pressable bg-am-green px-6 py-3 font-display text-lg font-bold text-am-success-text"
        >
          เล่นจริงเลย
        </Link>
      </section>
    );

  const sel = view.myHand.find((c) => c.id === selected) ?? null;
  const selDef = sel ? discard.getDiscardCard(sel.cardId) : null;
  const top = view.top;

  return (
    <section aria-label="ฝึกเล่น" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold">
          ฝึกเล่น {step + 1}/{STEPS.length}: {current.title}
        </h1>
        <Link to="/" className="text-sm font-semibold text-am-accent underline">
          ข้าม
        </Link>
      </div>
      <p role="status" className="am-sticker !rounded-xl bg-am-deco-yellow px-3 py-2 font-semibold">
        {doneNow ? "เยี่ยม! ✅" : current.hint}
      </p>

      <div className="flex items-center justify-center gap-6 rounded-[2rem] bg-am-lavender/60 px-4 py-3">
        <div className="text-center text-sm font-semibold">
          🤖 Bot
          <br />
          ไพ่ {view.players[1]?.handCount ?? 0} ใบ
        </div>
        <div aria-label="กองกลาง" className="flex flex-col items-center gap-1">
          {top && <CardView cardId={top} size="sm" />}
          {view.open && <span className="text-xs font-bold">🆕 กองใหม่</span>}
        </div>
      </div>

      {message && (
        <p
          role="alert"
          className="rounded-lg bg-am-error-bg px-2 py-1 font-semibold text-am-danger-text"
        >
          {message}
        </p>
      )}

      {!doneNow && (
        <>
          <div role="group" aria-label="Hand" className="flex flex-wrap justify-center gap-2 pt-3">
            {view.myHand.map((c) => {
              const ok = view.playable.includes(c.id);
              return (
                <CardView
                  key={c.id}
                  cardId={c.cardId}
                  playable={ok}
                  dimmed={!ok}
                  selected={selected === c.id}
                  {...(ok && {
                    onSelect: () => {
                      setSelected(c.id);
                    },
                  })}
                />
              );
            })}
          </div>
          {sel && selDef && (
            <div className="am-sticker flex flex-col gap-2 !rounded-xl bg-am-card p-3">
              {selDef.ability !== "umbrella" && (
                <label className="flex items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={useAbility}
                    onChange={(e) => {
                      setUseAbility(e.target.checked);
                    }}
                    className="h-6 w-6"
                  />
                  ใช้ความสามารถ “{selDef.abilityName}”
                </label>
              )}
              <StickerButton
                variant="confirm"
                onClick={() => {
                  apply({
                    type: "play",
                    playerId: "you",
                    card: sel.id,
                    useAbility,
                    choice: selDef.needsTarget && useAbility ? { target: 1 } : {},
                  });
                }}
              >
                {selDef.needsTarget && useAbility ? "ลงไพ่ ใส่ Bot" : "ลงไพ่"}
              </StickerButton>
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            {view.canDraw && (
              <StickerButton
                variant={view.playable.length === 0 ? "confirm" : "default"}
                className={view.playable.length === 0 ? "am-active" : ""}
                onClick={() => {
                  apply({ type: "draw", playerId: "you" });
                }}
              >
                จั่วไพ่
              </StickerButton>
            )}
            {view.drawn && (
              <>
                <StickerButton
                  variant="confirm"
                  className="am-active"
                  onClick={() => {
                    setSelected(view.drawn);
                  }}
                >
                  ลงใบที่จั่ว
                </StickerButton>
                <StickerButton
                  onClick={() => {
                    apply({ type: "keep", playerId: "you" });
                  }}
                >
                  เก็บไว้ จบเทิร์น
                </StickerButton>
              </>
            )}
          </div>
        </>
      )}

      <div className="flex justify-between gap-2">
        <StickerButton
          onClick={() => {
            go(step);
          }}
        >
          เริ่มข้อนี้ใหม่
        </StickerButton>
        <StickerButton
          variant="primary"
          disabled={!doneNow}
          onClick={() => {
            try {
              localStorage.setItem("aummon.tutorialDone", "1");
            } catch {
              // storage blocked (private mode): the tutorial is just offered again
            }
            go(step + 1);
          }}
        >
          {step === STEPS.length - 1 ? "จบการฝึก" : "ต่อไป"}
        </StickerButton>
      </div>
    </section>
  );
}
