import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useParams } from "react-router";
import { StickerButton } from "../../components/StickerButton.tsx";
import { ApiError, callFunction } from "../../lib/api.ts";
import { useAuth } from "../auth/auth-context.ts";
import {
  ago,
  card,
  dateTime,
  eventText,
  keywords,
  label,
  seats,
  shortId,
  yesNo,
} from "./format.ts";
import { gateFromError, gateFromMe, SECTIONS, type AdminGate, type SectionId } from "./guard.ts";
import { MfaPanel } from "./MfaPanel.tsx";

type Row = Record<string, unknown>;
interface Column {
  label: string;
  value: (r: Row) => ReactNode;
}

const text = (v: unknown): string =>
  typeof v === "string" ? v : typeof v === "number" ? v.toLocaleString("th-TH") : "—";
const asRows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : []);
const field = (v: unknown, key: string): unknown =>
  typeof v === "object" && v !== null ? (v as Row)[key] : undefined;

/** One sticker card per row with "label: value" lines — readable on iPhone and desktop. */
function RowList({
  rows,
  columns,
  title,
  actions,
  empty = "ยังไม่มีข้อมูล",
}: {
  rows: Row[];
  columns: Column[];
  title: (r: Row) => ReactNode;
  actions?: (r: Row) => ReactNode;
  empty?: string;
}) {
  if (rows.length === 0) return <p className="text-sm text-am-muted">{empty}</p>;
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {rows.map((r, i) => (
        <li key={i} className="am-sticker flex flex-col gap-1 bg-am-card p-3 text-sm">
          <div className="font-display font-bold">{title(r)}</div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
            {columns.map((c) => (
              <div key={c.label} className="contents">
                <dt className="text-am-muted">{c.label}</dt>
                <dd className="break-words">{c.value(r)}</dd>
              </div>
            ))}
          </dl>
          {actions && <div className="mt-1 flex flex-wrap gap-2">{actions(r)}</div>}
        </li>
      ))}
    </ul>
  );
}

function Stat({
  title,
  value,
  note,
  tone = "bg-am-card",
}: {
  title: string;
  value: ReactNode;
  note?: string;
  tone?: string;
}) {
  return (
    <div className={`am-sticker flex flex-col gap-1 p-3 ${tone}`}>
      <span className="text-sm font-semibold text-am-muted">{title}</span>
      <span className="font-display text-3xl font-bold tabular-nums">{value}</span>
      {note && <span className="text-xs text-am-muted">{note}</span>}
    </div>
  );
}

const Section = ({
  title,
  help,
  children,
}: {
  title: string;
  help?: string;
  children: ReactNode;
}) => (
  <section className="flex flex-col gap-2">
    <h2 className="font-display text-xl font-bold">{title}</h2>
    {help && <p className="text-sm text-am-muted">{help}</p>}
    {children}
  </section>
);

const ACTION: Record<SectionId, string> = {
  overview: "overview",
  players: "players",
  cards: "cards",
  decks: "decks",
  rooms: "rooms",
  matches: "matches",
  bots: "settings",
  logs: "logs.security",
  health: "health",
  settings: "settings",
};

const SmallButton = (props: {
  onClick: () => void;
  disabled: boolean;
  children: ReactNode;
  danger?: boolean;
}) => (
  <button
    type="button"
    disabled={props.disabled}
    onClick={props.onClick}
    className={`am-sticker am-pressable px-3 py-1 text-sm font-semibold ${props.danger ? "bg-am-danger text-white" : "bg-am-hover"}`}
  >
    {props.children}
  </button>
);

export function AdminPage() {
  const { section = "overview" } = useParams();
  const auth = useAuth();
  const client = auth.mode === "live" ? auth.client : null;
  const [gate, setGate] = useState<AdminGate>("loading");
  const [env, setEnv] = useState("");
  const [data, setData] = useState<unknown>(null);
  const [extra, setExtra] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [query, setQuery] = useState("");

  const api = useCallback(
    async <T,>(action: string, params: Row = {}): Promise<T> => {
      if (!client) throw new ApiError(0, "no_client", "");
      return callFunction<T>(client, "admin-api", { action, ...params });
    },
    [client],
  );

  const probe = useCallback(async () => {
    try {
      const me = await api<{ aal: string; env: string }>("me");
      setEnv(me.env);
      setGate(gateFromMe(me));
    } catch (e) {
      setGate(gateFromError(e));
    }
  }, [api]);

  useEffect(() => {
    const id = setTimeout(() => void probe(), 0);
    return () => {
      clearTimeout(id);
    };
  }, [probe, auth]);

  const meta = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];
  const current: SectionId = meta.id;

  const load = useCallback(async () => {
    if (gate !== "ok") return;
    setError(null);
    setExtra(null);
    try {
      setData(null);
      setData(await api(ACTION[current], current === "players" ? { query } : {}));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      if (e instanceof ApiError && (e.status === 401 || e.status === 403))
        setGate(gateFromError(e));
    }
  }, [api, current, gate, query]);

  useEffect(() => {
    const id = setTimeout(() => void load(), 0);
    return () => {
      clearTimeout(id);
    };
  }, [load]);

  const run = async (question: string, action: string, params: Row, keep = false) => {
    if (!window.confirm(question)) return;
    setPending(true);
    try {
      const out = await api(action, params);
      if (keep) setExtra(out);
      else await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "ทำรายการไม่สำเร็จ");
    } finally {
      setPending(false);
    }
  };

  if (!client) return <p className="text-center text-am-muted">ต้องเชื่อมระบบก่อน (Preview)</p>;
  if (gate === "loading") return <p className="text-center text-am-muted">กำลังตรวจสอบสิทธิ์…</p>;
  if (gate === "signed_out")
    return (
      <p className="text-center">
        กรุณา{" "}
        <Link to="/login" className="font-semibold text-am-accent underline">
          เข้าสู่ระบบ
        </Link>{" "}
        ด้วยบัญชี Admin
      </p>
    );
  if (gate === "forbidden")
    return (
      <p role="alert" className="text-center font-semibold">
        บัญชีนี้ไม่มีสิทธิ์ Admin
      </p>
    );
  if (gate === "error") return <p role="alert">ตรวจสอบสิทธิ์ไม่สำเร็จ</p>;
  if (gate === "mfa") return <MfaPanel client={client} onVerified={() => void probe()} />;

  const body = (() => {
    switch (current) {
      case "overview": {
        const c = field(data, "counts");
        const sys = field(data, "system");
        const hour = field(sys, "lastHour");
        const errors = Number(field(hour, "errors") ?? 0);
        const requests = Number(field(hour, "requests") ?? 0);
        return (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat title="ผู้เล่นทั้งหมด" value={text(field(c, "players"))} note="บัญชีที่สมัครแล้ว" />
              <Stat
                title="กำลังล็อกอินอยู่"
                value={text(field(c, "online_now"))}
                note="บัญชีที่ใช้งานภายใน 1 ชั่วโมงล่าสุด"
                tone="bg-am-deco-green"
              />
              <Stat
                title="ห้องที่เปิดอยู่"
                value={text(field(c, "active_rooms"))}
                note="รอผู้เล่นหรือกำลังเล่น"
              />
              <Stat title="เกมที่กำลังเล่น" value={text(field(c, "active_matches"))} note="ยังไม่จบ" />
              <Stat title="เกมที่จบใน 24 ชม." value={text(field(c, "finished_24h"))} />
              <Stat
                title="สถานะระบบ"
                value={errors === 0 ? "ปกติ ✅" : "มีปัญหา ⚠️"}
                note={`1 ชม. ล่าสุด: คำขอ ${requests.toLocaleString("th-TH")} · ผิดพลาด ${errors.toLocaleString("th-TH")}`}
                tone={errors === 0 ? "bg-am-deco-green" : "bg-am-deco-yellow"}
              />
              <Stat
                title="สภาพแวดล้อม"
                value={<span className="text-xl">{label("env", field(sys, "env"))}</span>}
                note={`กติกาชุดที่ ${text(field(sys, "rulesetVersion"))} · เวอร์ชัน ${text(field(sys, "engineVersion"))}`}
              />
            </div>
            <Section title="เหตุการณ์ล่าสุดในเกม (10 รายการ)">
              <RowList
                rows={asRows(field(data, "recentEvents"))}
                title={(r) => eventText(r["public_payload"])}
                columns={[
                  { label: "เกม", value: (r) => shortId(r["match_id"]) },
                  { label: "เวลา", value: (r) => ago(r["created_at"]) },
                ]}
              />
            </Section>
          </>
        );
      }
      case "players":
        return (
          <>
            <input
              aria-label="ค้นหาผู้เล่น"
              placeholder="ค้นหาด้วยชื่อหรืออีเมล"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              className="am-sticker min-h-11 bg-am-card px-3 shadow-none"
            />
            <RowList
              rows={asRows(data)}
              title={(r) =>
                `${text(r["display_name"])}${r["is_admin"] === true ? " 🛡️ Admin" : ""}`
              }
              columns={[
                { label: "อีเมล", value: (r) => text(r["email"]) },
                { label: "สมัครเมื่อ", value: (r) => dateTime(r["created_at"]) },
                { label: "เข้าใช้ล่าสุด", value: (r) => ago(r["last_sign_in_at"]) },
                { label: "จำนวนเกม", value: (r) => text(r["matches"]) },
                {
                  label: "สถานะ",
                  value: (r) => (r["disabled"] === true ? "🚫 ถูกระงับ" : "✅ ใช้งานได้"),
                },
              ]}
              actions={(r) =>
                r["is_admin"] === true ? null : r["disabled"] === true ? (
                  <SmallButton
                    disabled={pending}
                    onClick={() =>
                      void run(
                        `เปิดใช้บัญชี ${text(r["display_name"])} อีกครั้ง?`,
                        "player.set_disabled",
                        { userId: r["id"], disabled: false },
                      )
                    }
                  >
                    เปิดใช้บัญชี
                  </SmallButton>
                ) : (
                  <SmallButton
                    danger
                    disabled={pending}
                    onClick={() =>
                      void run(
                        `ระงับบัญชี ${text(r["display_name"])}? (ผู้เล่นจะล็อกอินไม่ได้)`,
                        "player.set_disabled",
                        { userId: r["id"], disabled: true },
                      )
                    }
                  >
                    ระงับบัญชี
                  </SmallButton>
                )
              }
            />
          </>
        );
      case "cards":
        return (
          <>
            <Section title="การ์ดทั้งหมด">
              <RowList
                rows={asRows(field(data, "cards"))}
                title={(r) => text(r["name"])}
                columns={[
                  { label: "ประเภท", value: (r) => label("cardType", r["card_type"]) },
                  {
                    label: "ร่าง",
                    value: (r) =>
                      r["stage"] === 0 ? "ร่างพื้นฐาน" : r["stage"] === 1 ? "ร่างพัฒนา" : "ร่างรวม",
                  },
                  { label: "ค่าพลังงาน", value: (r) => `${text(r["cost"])} พลังงาน` },
                  {
                    label: "พลัง",
                    value: (r) =>
                      r["card_type"] === "unit"
                        ? `โจมตี ${text(r["atk"])} · พลังชีวิต ${text(r["hp"])}`
                        : "—",
                  },
                  { label: "ความสามารถ", value: (r) => keywords(r["keywords"]) },
                  { label: "ความหายาก", value: (r) => label("rarity", r["rarity"]) },
                  { label: "ใส่ใน Deck ได้", value: (r) => yesNo(r["deckable"]) },
                ]}
              />
            </Section>
            <Section title="สูตรพัฒนาร่าง" help="ตัวละครร่างพื้นฐานจ่ายพลังงานเพื่อเปลี่ยนเป็นร่างใหม่">
              <RowList
                rows={asRows(field(data, "evolutions"))}
                title={(r) => `${card(r["source_card_id"])} → ${card(r["target_card_id"])}`}
                columns={[{ label: "ค่าพลังงาน", value: (r) => `${text(r["cost"])} พลังงาน` }]}
              />
            </Section>
            <Section title="สูตรรวมร่าง" help="รวมตัวละคร 2 ตัวบนสนามเป็นตัวใหม่">
              <RowList
                rows={asRows(field(data, "fusions"))}
                title={(r) =>
                  `${card(r["parent_a_card_id"])} + ${card(r["parent_b_card_id"])} → ${card(r["result_card_id"])}`
                }
                columns={[
                  { label: "ค่าพลังงาน", value: (r) => `${text(r["cost"])} พลังงาน` },
                  { label: "รับความสามารถ", value: (r) => keywords(r["inherited_keywords"]) },
                ]}
              />
            </Section>
          </>
        );
      case "decks": {
        const rows = asRows(data);
        const total = rows.reduce((n, r) => n + Number(r["quantity"] ?? 0), 0);
        return (
          <Section title={`ชุดการ์ดเริ่มต้น (${total.toLocaleString("th-TH")} ใบ)`}>
            <RowList
              rows={rows}
              title={(r) => card(r["card_definition_id"])}
              columns={[{ label: "จำนวน", value: (r) => `${text(r["quantity"])} ใบ` }]}
            />
          </Section>
        );
      }
      case "rooms": {
        const rows = asRows(data);
        const stale = rows.filter(
          (r) => r["stale_reason"] !== null && r["stale_reason"] !== undefined,
        ).length;
        return (
          <>
            <p className="text-sm">
              การปิดห้องจะนำห้องออกจากรายการและยุติเกมที่ยังไม่จบในห้องนั้น (เกมนั้นไม่มีผู้ชนะ) — ประวัติยังเก็บไว้
            </p>
            <StickerButton
              variant="danger"
              disabled={pending || stale === 0}
              onClick={() =>
                void run(`ปิดห้องที่ค้างทั้งหมด ${String(stale)} ห้อง?`, "rooms.close_stale", {})
              }
            >
              ปิดห้องที่ค้างทั้งหมด ({stale.toLocaleString("th-TH")})
            </StickerButton>
            <RowList
              rows={rows}
              empty="ไม่มีห้องที่เปิดอยู่"
              title={(r) => `ห้อง ${shortId(r["id"])} · ${label("mode", r["mode"])}`}
              columns={[
                { label: "สถานะ", value: (r) => label("roomStatus", r["status"]) },
                {
                  label: "ห้องค้าง?",
                  value: (r) =>
                    typeof r["stale_reason"] === "string"
                      ? `⚠️ ${label("stale", r["stale_reason"])}`
                      : "ไม่ ✅ ใช้งานปกติ",
                },
                { label: "ผู้เล่นในห้อง", value: (r) => `${text(r["players"])} / 2` },
                {
                  label: "เกมในห้อง",
                  value: (r) =>
                    r["match_status"] ? label("matchStatus", r["match_status"]) : "ยังไม่เริ่ม",
                },
                { label: "ความเคลื่อนไหวล่าสุด", value: (r) => ago(r["last_activity"]) },
                { label: "สร้างเมื่อ", value: (r) => ago(r["created_at"]) },
              ]}
              actions={(r) => (
                <SmallButton
                  danger
                  disabled={pending}
                  onClick={() =>
                    void run(
                      r["match_status"] === "active"
                        ? "ปิดห้องนี้? เกมที่กำลังเล่นอยู่จะถูกยุติทันที (ไม่มีผู้ชนะ)"
                        : "ปิดห้องนี้?",
                      "room.close",
                      { roomId: r["id"] },
                    )
                  }
                >
                  ปิดห้อง
                </SmallButton>
              )}
            />
          </>
        );
      }
      case "matches":
        return (
          <RowList
            rows={asRows(data)}
            empty="ไม่มีเกมที่กำลังเล่น"
            title={(r) => `เกม ${shortId(r["id"])} · ${label("mode", r["mode"])}`}
            columns={[
              { label: "สถานะ", value: (r) => label("matchStatus", r["status"]) },
              {
                label: "ตอนนี้",
                value: (r) => `เทิร์น ${text(r["turn"])} · ${label("phase", r["phase"])}`,
              },
              { label: "ผู้เล่น", value: (r) => seats(r["players"]) },
              { label: "เริ่มเมื่อ", value: (r) => ago(r["started_at"]) },
            ]}
            actions={(r) => (
              <SmallButton
                danger
                disabled={pending}
                onClick={() =>
                  void run("ยุติเกมนี้? เกมจะจบทันทีโดยไม่มีผู้ชนะ", "match.abandon", { matchId: r["id"] })
                }
              >
                ยุติเกม
              </SmallButton>
            )}
          />
        );
      case "bots": {
        const sim = extra;
        return (
          <>
            {env !== "development" && <p className="font-semibold">ใช้ได้เฉพาะระบบทดสอบ (Dev)</p>}
            <StickerButton
              disabled={pending || env !== "development"}
              onClick={() =>
                void run("ให้ Bot แข่งกันเอง 20 เกม?", "bots.simulate", { games: 20 }, true)
              }
            >
              {pending ? "กำลังจำลอง…" : "เริ่มจำลอง 20 เกม"}
            </StickerButton>
            {sim !== null && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat title="จำนวนเกม" value={text(field(sim, "games"))} />
                <Stat title="ฝั่งที่ 1 ชนะ" value={text(field(sim, "seat0"))} />
                <Stat title="ฝั่งที่ 2 ชนะ" value={text(field(sim, "seat1"))} />
                <Stat
                  title="เฉลี่ยกี่เทิร์นต่อเกม"
                  value={text(field(sim, "avgTurns"))}
                  note={`เสมอ ${text(field(sim, "draw"))} เกม`}
                />
              </div>
            )}
          </>
        );
      }
      case "logs":
        return (
          <>
            <Section title="สิ่งที่ Admin ทำ" help="บันทึกนี้แก้ไขหรือลบไม่ได้">
              <RowList
                rows={asRows(field(data, "audit"))}
                title={(r) => label("action", r["action"])}
                columns={[
                  { label: "ทำโดย", value: (r) => text(r["actor"]) },
                  { label: "เป้าหมาย", value: (r) => shortId(r["target_id"]) },
                  { label: "เวลา", value: (r) => dateTime(r["created_at"]) },
                ]}
              />
            </Section>
            <Section title="คำขอที่ถูกปฏิเสธหรือผิดพลาด" help="เช่น ไม่ได้ล็อกอิน ไม่มีสิทธิ์ หรือส่งถี่เกินไป">
              <RowList
                rows={asRows(field(data, "rejected"))}
                empty="ไม่มีรายการ"
                title={(r) => label("httpStatus", r["status"])}
                columns={[
                  { label: "ส่วนของระบบ", value: (r) => text(r["function_name"]) },
                  { label: "เวลา", value: (r) => dateTime(r["created_at"]) },
                ]}
              />
            </Section>
            <StickerButton
              disabled={pending}
              onClick={() =>
                void api("logs.game").then((rows) => {
                  setExtra(rows);
                })
              }
            >
              ดูเหตุการณ์ในเกมล่าสุด
            </StickerButton>
            {extra !== null && (
              <RowList
                rows={asRows(extra)}
                title={(r) => eventText(r["public_payload"])}
                columns={[
                  {
                    label: "เกม",
                    value: (r) => `${shortId(r["match_id"])} · เทิร์น ${text(r["round_number"])}`,
                  },
                  { label: "เวลา", value: (r) => ago(r["created_at"]) },
                ]}
              />
            )}
          </>
        );
      case "health":
        return (
          <>
            <Section title="ความเร็วของแต่ละส่วน (24 ชม.)" help="ยิ่งตัวเลขเวลาน้อยยิ่งเร็ว; ควรต่ำกว่า 800 ms">
              <RowList
                rows={asRows(field(data, "functions"))}
                title={(r) => text(r["function_name"])}
                columns={[
                  { label: "จำนวนคำขอ", value: (r) => text(r["requests"]) },
                  { label: "เวลาตอบปกติ", value: (r) => `${text(r["p50_ms"])} ms` },
                  { label: "ช้าสุด (95%)", value: (r) => `${text(r["p95_ms"])} ms` },
                  { label: "ผิดพลาด", value: (r) => text(r["server_errors"]) },
                  { label: "ถูกจำกัดความถี่", value: (r) => text(r["rate_limited"]) },
                ]}
              />
            </Section>
            <Section title="เกมรายวัน">
              <RowList
                rows={asRows(field(data, "matchesDaily"))}
                title={(r) => dateTime(r["day"]).split(" ")[0] ?? "—"}
                columns={[
                  { label: "เริ่ม", value: (r) => text(r["created"]) },
                  { label: "จบ", value: (r) => text(r["finished"]) },
                  { label: "ถูกยุติ", value: (r) => text(r["abandoned"]) },
                  {
                    label: "เวลาเฉลี่ยต่อเกม",
                    value: (r) =>
                      typeof r["avg_duration_s"] === "number"
                        ? `${Math.round(r["avg_duration_s"] / 60)} นาที`
                        : "—",
                  },
                ]}
              />
            </Section>
          </>
        );
      case "settings":
        return (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat
              title="สภาพแวดล้อม"
              value={<span className="text-xl">{label("env", field(data, "env"))}</span>}
            />
            <Stat title="กติกาชุดที่" value={text(field(data, "rulesetVersion"))} note="1v1 TCG" />
            <Stat
              title="เวอร์ชันระบบเกม"
              value={<span className="text-xl">{text(field(data, "engineVersion"))}</span>}
            />
            <Stat
              title="เวลาต่อเทิร์น"
              value={`${String(Number(field(data, "turnTimeoutMs") ?? 0) / 1000)} วินาที`}
            />
            <Stat
              title="เครื่องมือทดสอบ"
              value={field(data, "devToolsEnabled") === true ? "เปิด" : "ปิด"}
              note="เปิดเฉพาะ Dev"
            />
            <Stat title="ยืนยัน 2 ชั้น (MFA)" value="บังคับ" note="สำหรับ Admin ทุกคน" />
          </div>
        );
    }
  })();

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">Admin</h1>
        <span className="rounded-full bg-am-round px-3 py-1 text-xs font-bold text-am-ink">
          {label("env", env)}
        </span>
      </div>
      <nav aria-label="Admin sections" className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <NavLink
            key={s.id}
            to={`/admin/${s.id}`}
            className={() =>
              `am-sticker am-pressable px-3 py-1.5 text-sm font-semibold ${s.id === current ? "bg-am-hover" : "bg-am-card"}`
            }
          >
            {s.label}
          </NavLink>
        ))}
      </nav>
      <div>
        <h2 className="font-display text-2xl font-bold">{meta.label}</h2>
        <p className="text-sm text-am-muted">{meta.help}</p>
      </div>
      {error && (
        <p role="alert" className="border-l-4 border-am-danger pl-2 font-semibold">
          {error}
        </p>
      )}
      {data !== null && body}
    </section>
  );
}
