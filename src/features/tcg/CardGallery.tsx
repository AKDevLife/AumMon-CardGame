import { v5 } from "@aummon/game-engine";
import { useState } from "react";
import { CardFrame } from "./CardFrame.tsx";
import { TRAIT_LABEL } from "./labels.ts";
import { sortByCost } from "./sort.ts";

const TRAITS = Object.keys(TRAIT_LABEL) as v5.Trait[];

/** All Objects filtered by Thai category; tap a card to see its stats and abilities (owner request). */
export function CardGallery() {
  const [trait, setTrait] = useState<v5.Trait | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const cards = sortByCost(
    v5.CARD_DEFINITIONS_V5.filter((c) => trait === null || c.traits.includes(trait)),
  );

  if (open)
    return (
      <div className="flex flex-col gap-3">
        <CardFrame cardId={open} />
        <button
          type="button"
          onClick={() => {
            setOpen(null);
          }}
          className="am-pressable mx-auto min-h-11 rounded-full border-[3px] border-am-ink bg-am-deco-purple px-5 font-display font-semibold"
        >
          ← กลับไปดูการ์ดทั้งหมด
        </button>
      </div>
    );

  const chip = (label: string, value: v5.Trait | null) => (
    <button
      key={label}
      type="button"
      aria-pressed={trait === value}
      onClick={() => {
        setTrait(value);
      }}
      className={`am-pressable min-h-9 rounded-full border-[3px] border-am-ink px-3 text-sm font-semibold ${trait === value ? "bg-am-title" : "bg-am-card"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="หมวดหมู่การ์ด" className="flex flex-wrap gap-1.5">
        {chip("ทั้งหมด", null)}
        {TRAITS.map((t) => chip(TRAIT_LABEL[t], t))}
      </div>
      <p className="text-xs text-am-muted">{cards.length} ใบ · แตะการ์ดเพื่อดูค่าพลังและความสามารถ</p>
      <div role="group" aria-label="การ์ดทั้งหมด" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {cards.map((c) => (
          <CardFrame
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
