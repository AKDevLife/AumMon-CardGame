import type { ReactNode } from "react";

/** Number drawn inside an icon (heart = HP, bolt = SPARK). Accessible via aria-label. */
function IconNumber({
  label,
  children,
  value,
  size,
}: {
  label: string;
  children: ReactNode;
  value: ReactNode;
  size: number;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className="relative inline-grid place-items-center"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        aria-hidden="true"
        className="absolute inset-0"
      >
        {children}
      </svg>
      <span className="relative font-display text-sm font-bold leading-none text-white [text-shadow:0_1px_0_var(--am-ink)]">
        {value}
      </span>
    </span>
  );
}

export const HeartIcon = ({ value, size = 44 }: { value: number; size?: number }) => (
  <IconNumber label={`พลังชีวิต ${String(value)}`} value={value} size={size}>
    <path
      d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 5.3 3 1.7-1.8 3.2-3 5.3-3 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"
      fill="var(--am-danger)"
      stroke="var(--am-ink)"
      strokeWidth="1.6"
    />
  </IconNumber>
);

export const SparkIcon = ({
  value,
  max,
  size = 44,
}: {
  value: number;
  max: number;
  size?: number;
}) => (
  <IconNumber
    label={`พลังงาน ${String(value)} จาก ${String(max)}`}
    value={`${String(value)}/${String(max)}`}
    size={size}
  >
    <path
      d="M13.5 1.5 4 13.5h6.5L9 22.5l10-12.5h-6.6l1.1-8.5z"
      fill="var(--am-title)"
      stroke="var(--am-ink)"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </IconNumber>
);

/** Face-down card (opponent hand). */
export const CardBack = ({ small = false }: { small?: boolean }) => (
  <span
    aria-hidden="true"
    className={`am-sticker inline-block shrink-0 !rounded-md bg-am-accent ${small ? "h-10 w-7" : "h-14 w-10"} bg-[repeating-linear-gradient(45deg,transparent_0_4px,rgba(255,255,255,.25)_4px_8px)]`}
  />
);

/** Deck pile: stacked backs with the remaining count on the top card. */
export const DeckPile = ({ count }: { count: number }) => (
  <span
    role="img"
    aria-label={`กองการ์ดเหลือ ${String(count)} ใบ`}
    className="relative inline-block h-14 w-10"
  >
    {count > 1 && (
      <span
        aria-hidden="true"
        className="am-sticker absolute left-1 top-1 h-14 w-10 !rounded-md bg-am-accent opacity-60"
      />
    )}
    <span className="am-sticker absolute inset-0 grid place-items-center !rounded-md bg-am-accent bg-[repeating-linear-gradient(45deg,transparent_0_4px,rgba(255,255,255,.25)_4px_8px)]">
      <span className="rounded-full bg-am-card px-1.5 font-display text-sm font-bold">{count}</span>
    </span>
  </span>
);
