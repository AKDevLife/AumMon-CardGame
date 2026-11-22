/** Card back and draw pile visuals for the game table. */
const BACK =
  "bg-am-purple bg-[repeating-linear-gradient(45deg,transparent_0_4px,rgba(255,255,255,.25)_4px_8px)]";

/** Face-down card (opponent hand). */
export const CardBack = ({ small = false }: { small?: boolean }) => (
  <span
    aria-hidden="true"
    className={`am-sticker inline-block shrink-0 !rounded-md ${BACK} ${small ? "h-10 w-7" : "h-14 w-10"}`}
  />
);

/** Deck: compact purple chip with the cards left (layout A style, owner choice 2026-11-21). */
export const DeckPile = ({ count }: { count: number }) => (
  <span
    role="img"
    aria-label={`กองการ์ดเหลือ ${String(count)} ใบ`}
    className={`inline-grid h-9 min-w-8 place-items-center rounded-md border-2 border-am-ink bg-am-brand px-1 font-display text-sm font-bold text-am-inverse`}
  >
    {count}
  </span>
);
