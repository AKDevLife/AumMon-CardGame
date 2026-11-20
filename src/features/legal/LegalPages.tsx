import type { ReactNode } from "react";

/** Task 7.4 — DRAFT texts (owner choice 2B). Must be reviewed by a legal professional before launch. */
function DraftPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="am-sticker flex flex-col gap-3 bg-am-card p-5 text-sm leading-relaxed">
      <p role="note" className="am-sticker bg-am-deco-yellow p-2 font-semibold">
        ร่าง — รอตรวจโดยผู้เชี่ยวชาญด้านกฎหมาย ยังไม่ใช่ฉบับใช้งานจริง
      </p>
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      {children}
    </article>
  );
}

export function PrivacyPage() {
  return (
    <DraftPage title="นโยบายความเป็นส่วนตัว (ร่าง)">
      <h2 className="font-bold">ข้อมูลที่เก็บ</h2>
      <ul className="list-disc pl-5">
        <li>อีเมลและรหัสผ่าน (เข้ารหัส) สำหรับบัญชีผู้ใช้ — จัดการโดย Supabase Auth</li>
        <li>ชื่อที่แสดง และข้อมูลการเล่น เช่น ห้อง ผลการแข่งขัน และเหตุการณ์ในเกม</li>
        <li>สถิติการใช้งานระบบแบบไม่ระบุตัวตน (เวลาในการตอบสนอง จำนวนข้อผิดพลาด)</li>
      </ul>
      <h2 className="font-bold">การใช้ข้อมูล</h2>
      <p>เพื่อให้บริการเกม ป้องกันการโกง และปรับปรุงระบบ ไม่มีการขายข้อมูลให้บุคคลอื่น</p>
      <h2 className="font-bold">การลบบัญชี</h2>
      <p>ลบบัญชีได้ที่หน้าโปรไฟล์ ข้อมูลบัญชีจะถูกลบ ส่วนประวัติการแข่งขันจะถูกเก็บแบบไม่ระบุตัวตน</p>
      <h2 className="font-bold">ผู้ให้บริการที่เกี่ยวข้อง</h2>
      <p>Supabase (ฐานข้อมูลและบัญชีผู้ใช้), Vercel (โฮสต์เว็บไซต์), Google Fonts (ฟอนต์)</p>
    </DraftPage>
  );
}

export function TermsPage() {
  return (
    <DraftPage title="ข้อกำหนดการใช้งาน (ร่าง)">
      <ul className="list-disc pl-5">
        <li>ต้องมีบัญชีเพื่อเล่น และรับผิดชอบการรักษารหัสผ่านของตนเอง</li>
        <li>ห้ามโกง ห้ามโจมตีระบบ หรือพยายามเข้าถึงข้อมูลของผู้เล่นอื่น</li>
        <li>ห้ามใช้ชื่อที่หยาบคาย ละเมิด หรือแอบอ้างผู้อื่น</li>
        <li>บริการอยู่ระหว่างทดสอบ อาจหยุดให้บริการหรือรีเซ็ตข้อมูลได้</li>
      </ul>
    </DraftPage>
  );
}
