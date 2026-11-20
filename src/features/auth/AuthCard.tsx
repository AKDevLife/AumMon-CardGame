import type { ReactNode, SyntheticEvent } from "react";
import { StickerButton } from "../../components/StickerButton.tsx";

interface AuthCardProps {
  title: string;
  submitLabel: string;
  children: ReactNode;
  footer: ReactNode;
  /** false = UI preview mode: the form cannot be submitted. */
  enabled: boolean;
  pending?: boolean;
  error?: string | null;
  notice?: string | null;
  onSubmit?: (form: FormData) => void;
}

export function AuthCard(props: AuthCardProps) {
  const { title, submitLabel, children, footer, enabled, pending = false, error, notice } = props;
  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (enabled && !pending) props.onSubmit?.(new FormData(event.currentTarget));
  };
  return (
    <section className="am-sticker flex flex-col gap-5 bg-am-card p-6">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {children}
        {error && (
          <p role="alert" className="border-l-4 border-am-danger pl-2 font-semibold">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="font-semibold text-am-accent">
            {notice}
          </p>
        )}
        <StickerButton
          type="submit"
          variant="confirm"
          disabled={!enabled || pending}
          aria-describedby={enabled ? undefined : "auth-note"}
          className="min-h-12"
        >
          {pending ? "กำลังดำเนินการ…" : submitLabel}
        </StickerButton>
        {!enabled && (
          <p id="auth-note" className="text-center text-sm text-am-muted">
            ระบบบัญชียังไม่เปิดใช้งาน (Preview)
          </p>
        )}
      </form>
      <div className="text-center text-sm">{footer}</div>
    </section>
  );
}
