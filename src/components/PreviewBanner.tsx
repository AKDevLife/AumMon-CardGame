/** Shown on every page until real backend features exist (no fake "connected" UI). */
export function PreviewBanner() {
  return (
    <div
      role="status"
      className="border-b-[3px] border-am-ink bg-am-deco-yellow px-4 py-2 text-center text-sm font-semibold"
    >
      UI Preview — ยังไม่เชื่อมระบบจริง (ไม่มีการบันทึกข้อมูลหรือเข้าสู่ระบบ)
    </div>
  );
}
