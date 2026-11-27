import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { Spinner } from "./Spinner.tsx";
import { useClickBusy } from "./useClickBusy.ts";

/** Button roles from docs/platform/PLATFORM_SPEC.md §Buttons. `default` = neutral surface. */
type Variant = "default" | "primary" | "secondary" | "confirm" | "info" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  default: "bg-am-card text-am-text enabled:hover:bg-am-hover",
  primary: "bg-am-title text-am-text enabled:hover:bg-am-hover",
  secondary: "bg-am-deco-purple text-am-text enabled:hover:bg-am-hover",
  confirm: "bg-am-green text-am-success-text enabled:hover:brightness-105",
  info: "bg-am-blue text-am-info-text enabled:hover:brightness-105",
  // White on Danger Red is 3.65:1 → only with large bold text (WCAG large-text rule).
  danger: "bg-am-red text-white !text-xl !font-bold enabled:hover:brightness-105",
};

export interface StickerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Force the spinner (otherwise it shows automatically while the clicked button is disabled). */
  loading?: boolean;
}

export function StickerButton({
  variant = "default",
  className = "",
  type = "button",
  loading = false,
  children,
  onClick,
  ...props
}: StickerButtonProps) {
  const [busy, markClicked] = useClickBusy(props.disabled);
  const spinning = loading || busy;
  return (
    <button
      type={type}
      aria-busy={spinning || undefined}
      className={`am-sticker am-pressable px-6 py-3 font-display text-lg font-semibold disabled:cursor-not-allowed disabled:!bg-am-disabled disabled:!text-am-faint disabled:shadow-none ${VARIANT_CLASSES[variant]} ${className}`}
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        markClicked();
        onClick?.(e);
      }}
      {...props}
    >
      {spinning ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Spinner />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
