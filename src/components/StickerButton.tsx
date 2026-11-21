import type { ButtonHTMLAttributes } from "react";

/** Button roles from docs/color_design_system.md §Buttons. `default` = neutral surface. */
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
}

export function StickerButton({
  variant = "default",
  className = "",
  type = "button",
  ...props
}: StickerButtonProps) {
  return (
    <button
      type={type}
      className={`am-sticker am-pressable px-6 py-3 font-display text-lg font-semibold disabled:cursor-not-allowed disabled:!bg-am-disabled disabled:!text-am-faint disabled:shadow-none ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
