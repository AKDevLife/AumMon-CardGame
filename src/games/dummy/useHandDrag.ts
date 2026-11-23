import { useRef, useState, type MouseEvent, type PointerEvent } from "react";

const HOLD_MS = 300;
const MOVE_CANCEL_PX = 10;

/** Move `card` to the position of `over` (pure, exported for tests). */
export function reorder(list: readonly string[], card: string, over: string): string[] {
  const from = list.indexOf(card);
  const to = list.indexOf(over);
  if (from < 0 || to < 0 || from === to) return [...list];
  const next = list.filter((c) => c !== card);
  next.splice(to, 0, card);
  return next;
}

/**
 * Press and hold a hand card, then slide to reorder it. Cards carry `data-card`;
 * `onOrder` receives the new order. A tap (no hold) still reaches the card's onClick.
 */
export function useHandDrag(order: readonly string[], onOrder: (next: string[]) => void) {
  const [dragging, setDragging] = useState<string | null>(null);
  const press = useRef<{ card: string; x: number; y: number; timer: number } | null>(null);
  const justDragged = useRef(false);

  const end = () => {
    if (press.current) window.clearTimeout(press.current.timer);
    press.current = null;
    if (dragging) justDragged.current = true;
    setDragging(null);
  };

  const handlers = (card: string) => ({
    "data-card": card,
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      justDragged.current = false;
      const { clientX: x, clientY: y } = e;
      const timer = window.setTimeout(() => {
        setDragging(card);
        if ("vibrate" in navigator) navigator.vibrate(15);
      }, HOLD_MS);
      press.current = { card, x, y, timer };
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const p = press.current;
      if (!p) return;
      if (!dragging) {
        if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > MOVE_CANCEL_PX) end();
        return;
      }
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-card]");
      const over = el?.getAttribute("data-card");
      if (over && over !== dragging) onOrder(reorder(order, dragging, over));
    },
    onPointerUp: end,
    onPointerCancel: end,
    onContextMenu: (e: MouseEvent<HTMLElement>) => {
      e.preventDefault();
    },
  });

  /** True once after a drag ends: the click that follows must not toggle selection. */
  const consumeDrag = () => {
    const was = justDragged.current;
    justDragged.current = false;
    return was;
  };

  return { dragging, handlers, consumeDrag };
}
