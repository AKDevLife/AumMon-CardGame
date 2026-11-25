import { useState } from "react";

interface Item {
  id: string;
  category: string;
  humor: number;
  tags: string[];
  status: string;
  version: number;
  reports: number;
  review_note: string | null;
  body: { prompt: string; options: string[] };
}
type Api = <T>(action: string, params?: Record<string, unknown>) => Promise<T>;

const STATUS_TH: Record<string, string> = {
  draft: "ร่าง",
  in_review: "รอรีวิว",
  approved: "อนุมัติ",
  retired: "เลิกใช้",
};

/** Content review (owner = reviewer, C1): approve / reject / retire one or many, edit text. */
export function AdminContent({
  data,
  api,
  onChanged,
}: {
  data: unknown;
  api: Api;
  onChanged: () => Promise<void>;
}) {
  const d = data as { items: Item[]; counts: { status: string; n: number }[] };
  const [filter, setFilter] = useState("draft");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; prompt: string; options: string[] } | null>(
    null,
  );
  const items = d.items.filter((i) => filter === "all" || i.status === filter);

  const review = async (ids: string[], decision: "approve" | "reject" | "retire") => {
    if (ids.length === 0) return;
    if (ids.length > 1 && !window.confirm(`ยืนยัน ${decision} ${String(ids.length)} ข้อ?`)) return;
    setBusy(true);
    setError(null);
    try {
      for (let i = 0; i < ids.length; i += 200)
        await api("contentReview", { ids: ids.slice(i, i + 200), decision });
      await onChanged();
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      await api("contentEdit", editing);
      setEditing(null);
      await onChanged();
    } catch {
      setError("แก้ไขไม่สำเร็จ (คำถาม 5–120 ตัว, 4 ตัวเลือกไม่ซ้ำ ≤ 40 ตัว)");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        {d.counts.map((c) => `${STATUS_TH[c.status] ?? c.status} ${String(c.n)}`).join(" · ")}
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="กรองสถานะ">
        {["draft", "in_review", "approved", "retired", "all"].map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={filter === s}
            className={`am-sticker px-3 py-1 text-sm ${filter === s ? "bg-am-hover" : "bg-am-card"}`}
            onClick={() => {
              setFilter(s);
            }}
          >
            {STATUS_TH[s] ?? "ทั้งหมด"}
          </button>
        ))}
      </div>
      {(filter === "draft" || filter === "in_review") && items.length > 0 && (
        <button
          type="button"
          disabled={busy}
          className="am-sticker bg-am-green px-4 py-2 font-semibold text-am-success-text"
          onClick={() =>
            void review(
              items.map((i) => i.id),
              "approve",
            )
          }
        >
          อนุมัติทั้งหมดที่แสดง ({items.length} ข้อ)
        </button>
      )}
      {error && (
        <p role="alert" className="text-am-danger-text">
          {error}
        </p>
      )}
      <ul className="flex flex-col gap-2" aria-label="คำถาม">
        {items.map((i) => (
          <li key={i.id} className="am-sticker flex flex-col gap-1 bg-am-card p-3 text-sm">
            <span className="text-xs text-am-muted">
              {i.id} · {i.category} · แซว {i.humor} · v{i.version} ·{" "}
              {STATUS_TH[i.status] ?? i.status}
              {i.tags.includes("group") && " · group"}
              {i.reports > 0 && ` · รายงาน ${String(i.reports)}`}
            </span>
            {editing?.id === i.id ? (
              <>
                <input
                  aria-label="คำถาม"
                  className="rounded border px-2 py-1"
                  value={editing.prompt}
                  onChange={(e) => {
                    setEditing({ ...editing, prompt: e.target.value });
                  }}
                />
                {editing.options.map((o, k) => (
                  <input
                    key={k}
                    aria-label={`ตัวเลือก ${String(k + 1)}`}
                    className="rounded border px-2 py-1"
                    value={o}
                    onChange={(e) => {
                      setEditing({
                        ...editing,
                        options: editing.options.map((x, j) => (j === k ? e.target.value : x)),
                      });
                    }}
                  />
                ))}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    className="underline"
                    onClick={() => void saveEdit()}
                  >
                    บันทึก (กลับไปรอรีวิว)
                  </button>
                  <button
                    type="button"
                    className="underline"
                    onClick={() => {
                      setEditing(null);
                    }}
                  >
                    ยกเลิก
                  </button>
                </div>
              </>
            ) : (
              <>
                <b>{i.body.prompt}</b>
                <span>{i.body.options.map((o, k) => `${"ABCD"[k] ?? ""}. ${o}`).join(" · ")}</span>
                <div className="flex flex-wrap gap-3">
                  {i.status !== "approved" && (
                    <button
                      type="button"
                      disabled={busy}
                      className="font-semibold text-am-success-text underline"
                      onClick={() => void review([i.id], "approve")}
                    >
                      อนุมัติ
                    </button>
                  )}
                  {i.status !== "draft" && i.status !== "retired" && (
                    <button
                      type="button"
                      disabled={busy}
                      className="underline"
                      onClick={() => void review([i.id], "reject")}
                    >
                      ตีกลับเป็นร่าง
                    </button>
                  )}
                  {i.status !== "retired" && (
                    <button
                      type="button"
                      disabled={busy}
                      className="text-am-danger-text underline"
                      onClick={() => void review([i.id], "retire")}
                    >
                      เลิกใช้
                    </button>
                  )}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => {
                      setEditing({ id: i.id, prompt: i.body.prompt, options: [...i.body.options] });
                    }}
                  >
                    แก้ไข
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
