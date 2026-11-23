import { useState, type ComponentType } from "react";
import { StickerButton } from "../components/StickerButton.tsx";
import { Popup } from "../features/game/Popup.tsx";
import type { GameId } from "../platform/games.ts";

/** Dummy rules in plain Thai (docs/games/dummy/DUMMY_RULES.md, ruleset "2"). */
export function DummyRulesText() {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <p>
        <b>ผู้เล่น:</b> 2–4 คน · ไพ่ 52 ใบ · แจก 11 ใบ (2 คน), 9 ใบ (3 คน), 7 ใบ (4 คน) · เปิดไพ่ 1 ใบเป็น
        <b> หัว</b> ของกองทิ้ง
      </p>
      <p>
        <b>ในเทิร์นของคุณ:</b>
      </p>
      <ol className="list-decimal pl-5">
        <li>
          <b>เก็บไพ่:</b> จั่ว 1 ใบจากกองจั่ว หรือเลือกเก็บไพ่จากกองทิ้ง (ได้ใบนั้นและทุกใบที่อยู่ทับ) —
          ใบที่เลือกต้องเกิดทันทีกับไพ่ในมือ หรือฝากลงไพ่บนโต๊ะ
        </li>
        <li>
          <b>เกิด / ฝาก (ไม่บังคับ):</b> วางชุดไพ่ใหม่ หรือฝากไพ่ต่อชุดบนโต๊ะได้ไม่จำกัด
        </li>
        <li>
          <b>ทิ้ง:</b> ทิ้งไพ่ 1 ใบเพื่อจบเทิร์น · เหลือใบสุดท้ายกด <b>น็อค!</b>
        </li>
      </ol>
      <p>
        <b>ชุดไพ่:</b> ตอง 3–4 ใบเลขเดียวกัน หรือเรียง 3 ใบขึ้นไปดอกเดียวกัน (A ใช้ต่ำ A-2-3 หรือสูง Q-K-A ไม่วนรอบ
        K-A-2)
      </p>
      <p>
        <b>จบรอบ:</b> มีคนน็อค (ไพ่หมดมือ) หรือกองจั่วหมด
      </p>
      <p>
        <b>คะแนน:</b> ไพ่บนโต๊ะ = บวก · ไพ่ค้างมือ = ลบ · A = 15, 10/J/Q/K = 10, 2–9 = 5 · สเปโต (2♣, Q♠)
        = 50 · เก็บหัว +50 · น็อค +50 · คะแนนรวมสูงสุดชนะ
      </p>
      <p>
        <b>ทิ้งโง่:</b> ถ้าไพ่ที่คุณทิ้งถูกคนอื่นเก็บไปใช้ก่อนถึงตาคุณอีกครั้ง คุณถูกหัก 50 แต้ม (สเปโตหัก 100)
      </p>
      <p>
        <b>เวลา:</b> เทิร์นละ 45 วินาที (หมดเวลา ระบบจั่ว/ทิ้งให้)
      </p>
    </div>
  );
}

/** Poker rules in plain Thai (docs/games/poker/POKER_RULES.md, ruleset "1"). */
export function PokerRulesText() {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <p className="am-sticker !rounded-xl bg-am-deco-yellow px-3 py-2 font-semibold">
        ชิปจำลองเท่านั้น ไม่ใช่เงินจริง ซื้อ ถอน หรือโอนไม่ได้
      </p>
      <p>
        <b>รูปแบบ:</b> Texas Hold'em ไม่จำกัดการเดิมพัน 2–8 คน · ทุกคนเริ่ม 1,000 ชิป · คนที่ได้ชิปทั้งหมด
        หรือมีชิปมากสุดเมื่อครบ 40 มือชนะ
      </p>
      <p>
        <b>Blind:</b> 10 / 20 ชิป เพิ่มเป็น 2 เท่าทุก 10 มือ
      </p>
      <p>
        <b>แต่ละมือ:</b> ได้ไพ่ส่วนตัว 2 ใบ แล้วเปิดไพ่กลาง 3 ใบ (Flop) → 1 ใบ (Turn) → 1 ใบ (River)
        มีรอบเดิมพันก่อนและหลังเปิดแต่ละครั้ง
      </p>
      <p>
        <b>ทางเลือก:</b> หมอบ (Fold) · ผ่าน (Check) · ตาม (Call) · เพิ่ม (Raise) · หมดหน้าตัก (All-in)
      </p>
      <p>
        <b>ตัดสิน:</b> ใช้ไพ่ดีที่สุด 5 ใบจาก 7 ใบ · ถ้าคนอื่นหมอบหมด คนที่เหลือได้ชิปทั้งกองโดยไม่ต้องเปิดไพ่ ·
        เสมอแบ่งกันเท่า ๆ กัน
      </p>
      <p>
        <b>ลำดับไพ่ (สูง → ต่ำ):</b> Royal Flush · Straight Flush · Four of a Kind · Full House · Flush
        · Straight · Three of a Kind · Two Pair · One Pair · High Card
      </p>
      <p>
        <b>เวลา:</b> ตัดสินใจภายใน 30 วินาที (หมดเวลา = ผ่าน ถ้าทำได้ ไม่งั้นหมอบ)
      </p>
    </div>
  );
}

const RULES: Partial<Record<GameId, ComponentType>> = {
  dummy: DummyRulesText,
  poker: PokerRulesText,
};

/** "กติกา" button + popup for a Game Center game (home card and table). */
export function GameRulesButton({ gameId, gameName }: { gameId: GameId; gameName: string }) {
  const [open, setOpen] = useState(false);
  const Rules = RULES[gameId];
  if (!Rules) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className="am-pressable flex min-h-11 items-center justify-center gap-1 rounded-full border-[3px] border-am-ink bg-am-deco-purple px-4 font-display font-semibold"
      >
        <span aria-hidden="true">📖</span> กติกา<span className="sr-only"> {gameName}</span>
      </button>
      <Popup
        title={`กติกา${gameName}`}
        open={open}
        onClose={() => {
          setOpen(false);
        }}
      >
        <Rules />
        <StickerButton
          variant="confirm"
          onClick={() => {
            setOpen(false);
          }}
        >
          เข้าใจแล้ว
        </StickerButton>
      </Popup>
    </>
  );
}
