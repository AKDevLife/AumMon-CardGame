import { discard } from "@aummon/game-engine";
import { useState } from "react";
import { CardView } from "./CardView.tsx";

/** All 16 Objects, lowest points first; tap one for its full ability text. */
export function CardGallery() {
  const [open, setOpen] = useState<string | null>(null);
  const cards = [...discard.DISCARD_CARDS].sort(
    (a, b) => a.points - b.points || a.cardId.localeCompare(b.cardId),
  );
  if (open)
    return (
      <div className="flex flex-col items-center gap-3">
        <CardView cardId={open} />
        <button
          type="button"
          onClick={() => {
            setOpen(null);
          }}
          className="am-pressable min-h-11 rounded-full border-[3px] border-am-ink bg-am-deco-purple px-5 font-display font-semibold"
        >
          ← กลับไปดูการ์ดทั้งหมด
        </button>
      </div>
    );
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-am-muted">
        {cards.length} แบบ × {discard.DISCARD_RULES.copies} ใบ ={" "}
        {cards.length * discard.DISCARD_RULES.copies} ใบ · แตะการ์ดเพื่อดูความสามารถ
      </p>
      <div role="group" aria-label="การ์ดทั้งหมด" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {cards.map((c) => (
          <CardView
            key={c.cardId}
            compact
            cardId={c.cardId}
            onSelect={() => {
              setOpen(c.cardId);
            }}
          />
        ))}
      </div>
    </div>
  );
}
