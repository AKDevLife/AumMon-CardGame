import type { ReactNode, SyntheticEvent } from "react";
import { StickerButton } from "../../components/StickerButton.tsx";

interface AuthCardProps {
  title: string;
  submitLabel: string;
  children: ReactNode;
  footer: ReactNode;
}

/** UI-only form shell. Submission is disabled until Supabase Auth (task 2.8). */
export function AuthCard({ title, submitLabel, children, footer }: AuthCardProps) {
  const preventSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
  };
  return (
    <section className="am-sticker flex flex-col gap-5 bg-am-card p-6">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <form className="flex flex-col gap-4" onSubmit={preventSubmit} noValidate>
        {children}
        <StickerButton
          type="submit"
          variant="confirm"
          disabled
          aria-describedby="auth-note"
          className="min-h-12"
        >
          {submitLabel}
        </StickerButton>
        <p id="auth-note" className="text-center text-sm text-am-muted">
          ระบบบัญชียังไม่เปิดใช้งาน (Preview)
        </p>
      </form>
      <div className="text-center text-sm">{footer}</div>
    </section>
  );
}
