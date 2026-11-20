import type { ButtonHTMLAttributes } from "react";

type Variant = "default" | "confirm" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  default: "bg-am-card enabled:hover:bg-am-hover",
  confirm: "bg-am-confirm text-am-ink enabled:hover:brightness-105",
  danger: "bg-am-danger text-white !text-xl !font-bold enabled:hover:brightness-105", // large bold text: white passes 3:1
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
      className={`am-sticker am-pressable px-6 py-3 font-display text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
