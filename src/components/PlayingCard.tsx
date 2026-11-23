/** Standard playing card face ("As", "Td", "2c") for Dummy and Poker. Text-based, accessible. */
import { cardLabel, RANK, SUIT } from "./playing-card.ts";

export function PlayingCard({
  code,
  selected = false,
  onClick,
  small = false,
  hidden = false,
  head = false,
}: {
  code: string;
  selected?: boolean;
  onClick?: () => void;
  small?: boolean;
  hidden?: boolean;
  /** Dummy head card (หัว): a different background. */
  head?: boolean;
}) {
  const suit = SUIT[code[1] ?? ""];
  const size = small ? "h-12 w-9 text-sm" : "h-16 w-12 text-lg";
  const face = hidden ? (
    <span aria-hidden="true">🂠</span>
  ) : (
    <span aria-hidden="true" className={suit?.red ? "text-am-red" : "text-am-ink"}>
      {cardLabel(code)}
    </span>
  );
  const cls = `flex ${size} shrink-0 items-center justify-center rounded-lg border-2 border-am-ink ${head ? "bg-am-deco-yellow" : "bg-white"} font-display font-bold shadow ${selected ? "-translate-y-2 ring-4 ring-am-blue" : ""}`;
  const label = hidden
    ? "ไพ่คว่ำ"
    : `${RANK[code[0] ?? ""] ?? code[0] ?? ""} ${suit?.name ?? ""}${head ? " (หัว)" : ""}`;
  return onClick ? (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      className={`${cls} am-pressable`}
    >
      {face}
    </button>
  ) : (
    <span role="img" aria-label={label} className={cls}>
      {face}
    </span>
  );
}
