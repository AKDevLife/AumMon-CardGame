import { useEffect, useRef, useState, type ReactNode } from "react";

/** HUD icons — colors from docs/color_design_system.md (HP = pink, SPARK = blue). */
function IconNumber({
  label,
  children,
  value,
  size,
  numberClass,
  fx,
}: {
  label: string;
  children: ReactNode;
  value: ReactNode;
  size: number;
  numberClass: string;
  fx?: string;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className={`relative inline-grid place-items-center ${fx ?? ""}`}
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
      <span className={`relative font-display font-bold leading-none ${numberClass}`}>{value}</span>
    </span>
  );
}

/** Returns a one-shot animation class when `value` goes down (damage) or up (heal). */
function useChangeFx(value: number): string | undefined {
  const prev = useRef(value);
  const [fx, setFx] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (value === prev.current) return;
    const cls = value < prev.current ? "am-fx-damage" : "am-fx-heal";
    prev.current = value;
    const show = setTimeout(() => {
      setFx(cls);
    }, 0);
    const hide = setTimeout(() => {
      setFx(undefined);
    }, 700);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [value]);
  return fx;
}

export function HeartIcon({ value, size = 44 }: { value: number; size?: number }) {
  const fx = useChangeFx(value);
  return (
    <IconNumber
      label={`พลังชีวิต ${String(value)}`}
      value={value}
      size={size}
      numberClass="text-sm text-am-text"
      {...(fx && { fx })}
    >
      <path
        d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 5.3 3 1.7-1.8 3.2-3 5.3-3 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"
        fill="var(--color-player-hp)"
        stroke="var(--border-color)"
        strokeWidth="1.6"
      />
    </IconNumber>
  );
}

/** SPARK: bolt with the current amount + pips (active blue / used grey-blue). */
export function SparkIcon({
  value,
  max,
  size = 44,
}: {
  value: number;
  max: number;
  size?: number;
}) {
  return (
    <span className="inline-flex flex-col items-center gap-0.5">
      <IconNumber
        label={`พลังงาน ${String(value)} จาก ${String(max)}`}
        value={value}
        size={size}
        numberClass="rounded bg-am-spark-bg px-1 text-xs text-am-info-text"
      >
        <path
          d="M13.5 1.5 4 13.5h6.5L9 22.5l10-12.5h-6.6l1.1-8.5z"
          fill="var(--color-spark)"
          stroke="var(--border-color)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </IconNumber>
      <span aria-hidden="true" className="flex gap-0.5">
        {Array.from({ length: max }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${i < value ? "bg-am-blue" : "bg-am-spark-off"}`}
          />
        ))}
      </span>
    </span>
  );
}

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
