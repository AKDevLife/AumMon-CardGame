import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-display text-3xl font-bold">ไม่พบหน้านี้</h1>
      <Link to="/" className="font-semibold text-am-accent underline">
        กลับหน้าแรก
      </Link>
    </div>
  );
}
