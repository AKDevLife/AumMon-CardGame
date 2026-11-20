import { KEYWORD_HELP, KEYWORD_LABEL } from "./labels.ts";

/** Short rule summary (aummon_game_spec.md §4, §5.18) in plain Thai. */
export function RulesText() {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <p>
        <b>เป้าหมาย:</b> ทำให้พลังชีวิตของคู่ต่อสู้ (เริ่ม 20) ลดเหลือ 0
      </p>
      <p>
        <b>พลังงาน:</b> เทิร์นแรกมี 1 แล้วเพิ่มทีละ 1 ทุกเทิร์น (สูงสุด 8) ใช้จ่ายค่าการ์ด
      </p>
      <p>
        <b>ในแต่ละเทิร์น:</b> จั่ว 1 ใบ → ลงตัวละคร ติดอุปกรณ์ พัฒนาร่าง รวมร่าง หรือใช้การ์ดคำสั่ง → แล้วค่อยโจมตี
        (โจมตีแล้วลงการ์ดเพิ่มไม่ได้) → จบเทิร์น มีเวลา 90 วินาที
      </p>
      <p>
        <b>ตัวละคร:</b> บนสนามได้สูงสุด 3 ตัว ตัวที่ลงใหม่ต้องรอเทิร์นหน้าจึงโจมตีได้ ตัวละครสู้กันจะทำดาเมจใส่กันพร้อมกัน
      </p>
      <p>
        <b>ตีผู้เล่นตรง:</b> ได้เมื่อฝ่ายตรงข้ามไม่มีตัวที่มีโล่กำบังพร้อมป้องกัน
      </p>
      <p>
        <b>กองการ์ดหมด:</b> ต้องจั่วแต่ไม่มีการ์ด เสียพลังชีวิต 1, 2, 3… เพิ่มขึ้นเรื่อย ๆ
      </p>
      <h3 className="font-display font-bold">ความสามารถ</h3>
      <ul className="list-disc pl-5">
        {(Object.keys(KEYWORD_LABEL) as (keyof typeof KEYWORD_LABEL)[]).map((k) => (
          <li key={k}>
            <b>{KEYWORD_LABEL[k]}:</b> {KEYWORD_HELP[k]}
          </li>
        ))}
      </ul>
    </div>
  );
}
