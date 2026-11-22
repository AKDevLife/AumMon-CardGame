import { discard } from "@aummon/game-engine";
import { CARD_ART } from "./labels.ts";

/** One Everyday Object card: art, name, points, ability (compact for the pile / table). */
export function CardView({
  cardId,
  compact = false,
  selected = false,
  dimmed = false,
  onSelect,
}: {
  cardId: string;
  compact?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  onSelect?: () => void;
}) {
  const c = discard.getDiscardCard(cardId);
  return (
    <button
      type="button"
      data-sound="card_tap"
      disabled={!onSelect}
      aria-pressed={selected}
      aria-label={`${c.name} แต้ม ${String(c.points)}`}
      onClick={onSelect}
      className={`am-sticker am-pressable relative flex shrink-0 flex-col overflow-hidden bg-am-card text-left disabled:cursor-default ${compact ? "w-20" : "w-28"} ${selected ? "ring-4 ring-am-title" : ""} ${dimmed ? "opacity-50" : ""}`}
    >
      <span className="flex items-center justify-between bg-am-deco-purple px-1.5 py-1">
        <span aria-hidden="true" className={compact ? "text-xl" : "text-2xl"}>
          {CARD_ART[cardId] ?? "🧸"}
        </span>
        <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-am-ink bg-am-title font-display text-sm font-bold">
          {c.points}
        </span>
      </span>
      <span className="px-1.5 pt-1 font-display text-[13px] font-bold leading-tight [word-break:keep-all]">
        {c.name}
      </span>
      {!compact && (
        <span className="px-1.5 pb-1.5 text-[11px] leading-tight">
          <b>✨ {c.abilityName}</b> <span className="text-am-muted">{c.text}</span>
        </span>
      )}
    </button>
  );
}
