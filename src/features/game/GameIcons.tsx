/** Card back and draw pile visuals for the game table. */
const BACK =
  "bg-am-purple bg-[repeating-linear-gradient(45deg,transparent_0_4px,rgba(255,255,255,.25)_4px_8px)]";

/** Face-down card (opponent hand). */
export const CardBack = ({ small = false, pile = false }: { small?: boolean; pile?: boolean }) => (
  <span
    aria-hidden="true"
    className={`am-sticker inline-block shrink-0 !rounded-md ${BACK} ${pile ? "h-[var(--am-card-h-sm)] w-[var(--am-card-w-sm)] !rounded-2xl" : small ? "h-10 w-7" : "h-14 w-10"}`}
  />
);
