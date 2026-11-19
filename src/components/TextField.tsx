import { useId, type InputHTMLAttributes } from "react";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function TextField({ label, hint, className = "", ...props }: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-display font-semibold">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={hint ? hintId : undefined}
        className={`am-sticker min-h-12 bg-am-card px-4 text-base shadow-none focus:outline-[3px] focus:outline-offset-2 focus:outline-am-accent ${className}`}
        {...props}
      />
      {hint && (
        <p id={hintId} className="text-xs text-am-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
