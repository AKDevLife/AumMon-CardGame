import { useEffect, useRef, type ReactNode } from "react";

/** Modal popup on the native <dialog> (focus trap, Esc to close, backdrop click closes). */
export function Popup({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  // Closing because the parent changed `open` must not call onClose: that would wipe out
  // the popup the parent just switched to (bug: settings → rules showed nothing).
  const closingFromProps = useRef(false);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) {
      closingFromProps.current = true;
      d.close();
    }
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={() => {
        if (closingFromProps.current) closingFromProps.current = false;
        else onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="am-sticker m-auto w-[min(92vw,28rem)] bg-am-card p-0 text-am-ink backdrop:bg-black/40"
    >
      <div className="flex max-h-[80vh] flex-col gap-3 overflow-y-auto p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <button
            type="button"
            aria-label="ปิด"
            onClick={onClose}
            className="am-sticker am-pressable bg-am-card px-3 py-1 font-bold"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
