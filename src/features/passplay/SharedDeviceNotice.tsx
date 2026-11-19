/** Task 5.4 — Pass & Play privacy is UI-only on a shared device (blueprint §4.4, §6.2). */
export function SharedDeviceNotice() {
  return (
    <p className="am-sticker bg-am-deco-yellow p-3 text-sm">
      ⚠️ เล่นบนเครื่องเดียวกัน: ระบบซ่อนการ์ดของผู้เล่นคนอื่นบนหน้าจอเท่านั้น
      ไม่สามารถป้องกันผู้ที่เข้าถึงเครื่องหรือเครื่องมือนักพัฒนาได้
    </p>
  );
}
