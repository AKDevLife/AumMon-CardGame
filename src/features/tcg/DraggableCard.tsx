import { useRef, type ReactNode } from "react";

/** Where a dragged hand card was dropped (read from `data-drop` on the element under the finger). */
export type DropTarget =
  { kind: "slot" } | { kind: "unit"; unitId: string } | { kind: "field" } | null;

export interface DragPoint {
  x: number;
  y: number;
}

function targetAt(x: number, y: number): DropTarget {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-drop]");
  const v = el?.dataset["drop"];
  if (!v) return null;
  if (v === "slot") return { kind: "slot" };
  if (v.startsWith("unit:")) return { kind: "unit", unitId: v.slice(5) };
  return { kind: "field" };
}

/**
 * Hand card that can be dragged onto the field with mouse or touch (pointer events, no
 * dependency). A drag starts only after an UPWARD move, so sideways swipes still scroll the
 * hand; the click that ends a drag is swallowed so it does not also open the popup.
 */
export function DraggableCard({
  enabled,
  onMove,
  onDrop,
  className,
  children,
}: {
  enabled: boolean;
  onMove: (p: DragPoint | null) => void;
  onDrop: (target: DropTarget) => void;
  className?: string;
  children: ReactNode;
}) {
  const start = useRef<{ x: number; y: number; pointer: number } | null>(null);
  const dragged = useRef(false);
  if (!enabled) return <div className={className}>{children}</div>;
  return (
    <div
      className={className}
      style={{ touchAction: "pan-x" }}
      onPointerDown={(e) => {
        start.current = { x: e.clientX, y: e.clientY, pointer: e.pointerId };
        dragged.current = false;
      }}
      onPointerMove={(e) => {
        const s = start.current;
        if (s?.pointer !== e.pointerId) return;
        const dx = e.clientX - s.x;
        const dy = e.clientY - s.y;
        if (!dragged.current) {
          if (dy > -12 || Math.abs(dy) < Math.abs(dx)) return;
          dragged.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
        }
        onMove({ x: e.clientX, y: e.clientY });
      }}
      onPointerUp={(e) => {
        const wasDrag = dragged.current;
        start.current = null;
        if (!wasDrag) return;
        onMove(null);
        onDrop(targetAt(e.clientX, e.clientY));
      }}
      onPointerCancel={() => {
        start.current = null;
        dragged.current = false;
        onMove(null);
      }}
      onClickCapture={(e) => {
        if (!dragged.current) return;
        dragged.current = false;
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      {children}
    </div>
  );
}
