import { v4 } from "@aummon/game-engine";
import {
  CARD_ART,
  cardName,
  KEYWORD_HELP,
  KEYWORD_LABEL,
  KEYWORD_STYLE,
  TRAIT_LABEL,
} from "./labels.ts";

/** Keyword badge: icon + Thai text + color stripe (never color alone). */
export function KeywordBadge({ k }: { k: v4.Keyword }) {
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

/** Ability line: 🔁 Passive (works by itself) / ✨ Active (tap to use, free). */
function AbilityLine({
  kind,
  name,
  text,
}: {
  kind: "passive" | "active";
  name: string;
  text: string;
}) {
  return (
    <span className="text-[11px] leading-tight text-am-text">
      <b>
        {kind === "passive" ? "🔁" : "✨"} {name}
      </b>{" "}
      <span className="text-am-muted">{text}</span>
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

export interface CardFrameProps {
  cardId: string;
  /** On-board unit (effective stats, exhaustion) and its side (static Passives). */
  unit?: v4.UnitInstance;
  side?: readonly v4.UnitInstance[];
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
  side = [],
  selected,
  validTarget,
  marked,
  disabled,
  dimmed,
  compact,
  onSelect,
}: CardFrameProps) {
  const def = v4.getCardDefinition(cardId);
  const keywords = unit ? [...v4.unitKeywords(unit)] : def.keywords;
  const units = unit && !side.includes(unit) ? [...side, unit] : side;
  const ring =
    selected === true || marked === true
      ? "ring-4 ring-am-title"
      : validTarget
        ? "ring-4 ring-am-green"
        : "";
  return (
    <button
      type="button"
      data-sound="card_tap"
      disabled={disabled ?? !onSelect}
      aria-pressed={selected === true || marked === true}
      onClick={onSelect}
      className={`am-sticker am-pressable relative flex ${compact ? "min-h-[5.75rem]" : "min-h-28"} flex-col overflow-hidden bg-am-card text-left disabled:cursor-default ${dimmed ? "opacity-60" : ""} ${ring}`}
    >
      <span className="flex flex-col gap-0.5 bg-am-deco-purple px-2 py-1">
        {/* Full-width title so Thai names wrap at word boundaries instead of mid-word. */}
        <span className="flex items-start gap-1">
          <span aria-hidden="true" className={compact ? "text-base" : "text-2xl"}>
            {CARD_ART[cardId] ?? "🧸"}
          </span>
          <span className="font-display text-[13px] font-bold leading-tight [word-break:keep-all]">
            {cardName(cardId)}
          </span>
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
        <span className="flex flex-wrap gap-1">
          <Stat
            icon="⚔️"
            label="พลังโจมตี"
            value={String(unit ? v4.unitAtk(units, unit) : def.atk)}
            color="var(--color-atk)"
          />
          <Stat
            icon="❤️"
            label="พลังชีวิต"
            value={
              unit
                ? `${String(v4.unitHp(units, unit))}/${String(v4.unitMaxHp(units, unit))}`
                : String(def.hp)
            }
            color="var(--color-hp)"
          />
        </span>
        {!compact && (
          <span className="text-[10px] font-semibold text-am-muted">
            {def.traits.map((t) => TRAIT_LABEL[t]).join(" · ")}
          </span>
        )}
        {keywords.length > 0 && (
          <span className="flex flex-wrap gap-1">
            {keywords.map((k) => (
              <KeywordBadge key={k} k={k} />
            ))}
          </span>
        )}
        {def.passive &&
          (compact ? (
            <span className="text-[11px] font-semibold">🔁 {def.passive.name}</span>
          ) : (
            <AbilityLine kind="passive" name={def.passive.name} text={def.passive.text} />
          ))}
        {def.active &&
          (compact ? (
            <span className="text-[11px] font-semibold">✨ {def.active.name}</span>
          ) : (
            <AbilityLine kind="active" name={def.active.name} text={def.active.text} />
          ))}
        {marked && <span className="text-[11px] font-bold">↩︎ เปลี่ยน</span>}
        {unit?.exhausted && (
          <span className="mt-auto rounded-md bg-am-exhausted px-1 text-center text-[11px] font-semibold text-am-inverse">
            💤 หลับ
          </span>
        )}
      </span>
    </button>
  );
}

/** Dashed placeholder for a free unit slot (max 3 per side); `drop` makes it a drag target. */
export const EmptySlot = ({
  drop = false,
  active = false,
}: {
  drop?: boolean;
  active?: boolean;
}) => (
  <span
    aria-hidden="true"
    {...(drop && { "data-drop": "slot" })}
    className={`${active ? "ring-4 ring-am-green" : ""} grid min-h-[5.75rem] place-items-center rounded-[1.25rem] border-[3px] border-dashed border-am-lavender bg-am-slot text-xs text-am-muted`}
  >
    {active ? "วางที่นี่" : "ช่องว่าง"}
  </span>
);
