import { v2 } from "@aummon/game-engine";
import { cardName, cardText, KEYWORD_HELP, KEYWORD_LABEL, KEYWORD_STYLE } from "./labels.ts";

/** Keyword badge: icon + Thai text + color stripe (never color alone). */
export function KeywordBadge({ k }: { k: v2.Keyword }) {
  const s = KEYWORD_STYLE[k];
  return (
    <abbr
      title={KEYWORD_HELP[k]}
      className="inline-flex items-center gap-0.5 rounded-md border-l-4 bg-am-card px-1 text-[11px] font-semibold text-am-text no-underline"
      style={{ borderLeftColor: s.color }}
    >
      <span aria-hidden="true">{s.icon}</span>
      {KEYWORD_LABEL[k]}
    </abbr>
  );
}

function DrawBadge() {
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-md border-l-4 bg-am-card px-1 text-[11px] font-semibold text-am-text"
      style={{ borderLeftColor: "var(--color-draw)" }}
    >
      <span aria-hidden="true">🃏</span>จั่ว / ค้นหา
    </span>
  );
}

const Stat = ({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: string;
  label: string;
  color: string;
}) => (
  <span
    aria-label={`${label} ${value}`}
    className="inline-flex items-center gap-0.5 rounded-md border-b-[3px] bg-am-stat px-1 font-display text-sm font-bold tabular-nums text-am-text"
    style={{ borderBottomColor: color }}
  >
    <span aria-hidden="true">{icon}</span>
    {value}
  </span>
);

/** Top stripe marks special forms: Evolution = green, Fusion = purple (not rarity/power). */
const stageStripe = (stage: number) =>
  stage === 1 ? "var(--color-evolution)" : stage >= 2 ? "var(--color-fusion)" : "transparent";

const TYPE_LABEL: Record<v2.CardType, string> = {
  unit: "ตัวละคร",
  action: "คำสั่ง",
  equipment: "อุปกรณ์",
  field: "สนาม",
};

export interface CardFrameProps {
  cardId: string;
  /** On-board unit (effective stats, equipment, exhaustion). */
  unit?: v2.UnitInstance;
  selected?: boolean;
  /** This unit can be attacked by the selected attacker. */
  validTarget?: boolean;
  marked?: boolean;
  disabled?: boolean;
  /** Not playable now (hand only): drawn lighter. */
  dimmed?: boolean;
  /** Shorter frame for units on the board (no page scroll). */
  compact?: boolean;
  onSelect?: () => void;
}

export function CardFrame({
  cardId,
  unit,
  selected,
  validTarget,
  marked,
  disabled,
  dimmed,
  compact,
  onSelect,
}: CardFrameProps) {
  const def = v2.getCardDefinition(cardId);
  const keywords = unit ? [...v2.unitKeywords(unit)] : def.keywords;
  const draws = def.effects.some((fx) => fx.type === "DRAW_CARD" || fx.type === "SEARCH_CARD");
  const ring =
    selected === true || marked === true
      ? "ring-4 ring-am-title"
      : validTarget
        ? "ring-4 ring-am-green"
        : "";
  return (
    <button
      type="button"
      disabled={disabled ?? !onSelect}
      aria-pressed={selected === true || marked === true}
      onClick={onSelect}
      className={`am-sticker am-pressable relative flex ${compact ? "min-h-[5.75rem]" : "min-h-28"} flex-col overflow-hidden bg-am-card text-left disabled:cursor-default ${dimmed ? "opacity-60" : ""} ${ring}`}
      style={{
        borderTopColor: def.stage > 0 ? stageStripe(def.stage) : undefined,
        borderTopWidth: def.stage > 0 ? 6 : undefined,
      }}
    >
      <span className="flex flex-col gap-0.5 bg-am-deco-purple px-2 py-1">
        {/* Full-width title so Thai names wrap at word boundaries instead of mid-word. */}
        <span className="font-display text-[13px] font-bold leading-tight [word-break:keep-all]">
          {cardName(cardId)}
        </span>
        {!unit && (
          <span
            aria-label={`ใช้พลังงาน ${String(def.cost)}`}
            className="self-start rounded-full bg-am-blue px-2 text-xs font-bold text-am-info-text"
          >
            ⚡{def.cost}
          </span>
        )}
      </span>
      <span className="flex flex-1 flex-col gap-1 p-2">
        {def.cardType === "unit" ? (
          <span className="flex flex-wrap gap-1">
            <Stat
              icon="⚔️"
              label="พลังโจมตี"
              value={String(unit ? v2.unitAtk(unit) : def.atk)}
              color="var(--color-atk)"
            />
            <Stat
              icon="❤️"
              label="พลังชีวิต"
              value={
                unit ? `${String(v2.unitHp(unit))}/${String(v2.unitMaxHp(unit))}` : String(def.hp)
              }
              color="var(--color-hp)"
            />
          </span>
        ) : (
          <span className="text-[11px] leading-tight text-am-muted">
            <span className="font-semibold text-am-text">{TYPE_LABEL[def.cardType]}</span> ·{" "}
            {cardText(cardId)}
          </span>
        )}
        {(keywords.length > 0 || draws) && (
          <span className="flex flex-wrap gap-1">
            {keywords.map((k) => (
              <KeywordBadge key={k} k={k} />
            ))}
            {draws && <DrawBadge />}
          </span>
        )}
        {unit && unit.equipment.length > 0 && (
          <span className="text-[11px] text-am-muted">
            🔧 {unit.equipment.map((e) => cardName(e.cardId)).join(", ")}
          </span>
        )}
        {marked && <span className="text-[11px] font-bold">↩︎ เปลี่ยน</span>}
        {unit?.exhausted && (
          <span className="mt-auto rounded-md bg-am-exhausted px-1 text-center text-[11px] font-semibold text-am-inverse">
            💤 เหนื่อย (โจมตีไม่ได้)
          </span>
        )}
      </span>
    </button>
  );
}

/** Dashed placeholder for a free unit slot (max 3 per side). */
export const EmptySlot = () => (
  <span
    aria-hidden="true"
    className="grid min-h-[5.75rem] place-items-center rounded-[1.25rem] border-[3px] border-dashed border-am-lavender bg-am-slot text-xs text-am-muted"
  >
    ช่องว่าง
  </span>
);
