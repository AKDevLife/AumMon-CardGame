import { discard } from "@aummon/game-engine";
import { CARD_ART } from "./labels.ts";

export type CardSize = "sm" | "md" | "lg";

/** Point badge colors: low → high so values read at a glance (display only). */
function pointTone(points: number): string {
  if (points <= 2) return "bg-am-green text-am-success-text";
  if (points <= 4) return "bg-am-blue text-am-info-text";
  if (points <= 6) return "bg-am-title text-am-text";
  return "bg-am-pink text-am-text";
}

const SIZE: Record<CardSize, { box: string; art: string; badge: string; name: string }> = {
  sm: {
    box: "w-[var(--am-card-w-sm)] h-[var(--am-card-h-sm)]",
    art: "text-[1.9rem]",
    badge: "h-6 w-6 text-sm",
    name: "text-[12px]",
  },
  md: {
    box: "w-[var(--am-card-w)] h-[var(--am-card-h)]",
    art: "text-[1.9rem]",
    badge: "h-7 w-7 text-base",
    name: "text-[14px]",
  },
  lg: {
    box: "w-[var(--am-card-w-lg)]",
    art: "text-[3.4rem]",
    badge: "h-10 w-10 text-xl",
    name: "text-lg",
  },
};

/**
 * One Everyday Object card: points (top-left), art, name, ability.
 * States: `playable` (green ring), `selected` (lifted, yellow ring), `dimmed` (cannot play now).
 */
export function CardView({
  cardId,
  size = "md",
  compact = false,
  selected = false,
  playable = false,
  dimmed = false,
  className = "",
  onSelect,
}: {
  cardId: string;
  size?: CardSize;
  /** Legacy alias for size "sm". */
  compact?: boolean;
  selected?: boolean;
  playable?: boolean;
  dimmed?: boolean;
  className?: string;
  onSelect?: () => void;
}) {
  const c = discard.getDiscardCard(cardId);
  const s = SIZE[compact ? "sm" : size];
  const small = compact || size === "sm";
  const ring = selected
    ? "ring-4 ring-am-title -translate-y-3"
    : playable
      ? "ring-[3px] ring-am-green"
      : "";
  return (
    <button
      type="button"
      data-sound="card_tap"
      data-playable={playable ? "true" : undefined}
      disabled={!onSelect}
      aria-pressed={onSelect ? selected : undefined}
      onClick={onSelect}
      className={`am-sticker relative flex shrink-0 flex-col overflow-hidden !rounded-2xl bg-am-card text-left text-am-text transition-[transform,filter,opacity] duration-150 ease-out disabled:cursor-default ${s.box} ${ring} ${dimmed ? "opacity-70 saturate-50" : ""} ${className}`}
    >
      <span
        className={`relative grid place-items-center bg-am-deco-purple ${small ? "h-[52%]" : size === "lg" ? "h-28 [@media(max-height:700px)]:h-20" : "h-[36%]"}`}
      >
        <span aria-hidden="true" className={`leading-none drop-shadow-sm ${s.art}`}>
          {CARD_ART[cardId] ?? "🧸"}
        </span>
        <span
          className={`absolute left-1 top-1 grid place-items-center rounded-full border-2 border-am-ink font-display font-bold ${s.badge} ${pointTone(c.points)}`}
        >
          {c.points}
        </span>
      </span>
      <span
        className={`px-1.5 pt-1 font-display font-bold leading-tight [word-break:keep-all] ${s.name}`}
      >
        {c.name}
      </span>
      {!small && (
        <span
          className={`px-1.5 pb-1.5 leading-snug ${size === "lg" ? "text-sm" : "min-h-0 flex-1 overflow-hidden text-[12.5px]"}`}
        >
          <b className="text-am-accent">✨ {c.abilityName}</b>{" "}
          <span className="text-am-text">{size === "lg" ? c.text : c.short}</span>
        </span>
      )}
    </button>
  );
}
