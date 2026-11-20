import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useParams } from "react-router";
import { StickerButton } from "../../components/StickerButton.tsx";
import { ApiError, callFunction } from "../../lib/api.ts";
import { useAuth } from "../auth/auth-context.ts";
import { gateFromError, gateFromMe, SECTIONS, type AdminGate, type SectionId } from "./guard.ts";
import { MfaPanel } from "./MfaPanel.tsx";

type Row = Record<string, unknown>;

const show = (v: unknown): string => {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(v);
};

/** Generic table; horizontally scrollable inside its card so the page never scrolls sideways. */
function Table({ rows, actions }: { rows: Row[]; actions?: (row: Row) => ReactNode }) {
  if (rows.length === 0) return <p className="text-sm text-am-muted">ไม่มีข้อมูล</p>;
  const cols = Object.keys(rows[0] ?? {});
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c} className="border-b-2 border-am-ink px-2 py-1 font-display">
                {c}
              </th>
            ))}
            {actions && <th className="border-b-2 border-am-ink px-2 py-1" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="align-top odd:bg-am-bg">
              {cols.map((c) => (
                <td key={c} className="max-w-56 truncate px-2 py-1" title={show(r[c])}>
                  {show(r[c])}
                </td>
              ))}
              {actions && <td className="px-2 py-1">{actions(r)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Card = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="am-sticker flex flex-col gap-2 bg-am-card p-3">
    <h2 className="font-display text-lg font-bold">{title}</h2>
    {children}
  </section>
);

const asRows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : []);
const field = (v: unknown, key: string): unknown =>
  typeof v === "object" && v !== null ? (v as Row)[key] : undefined;

const ACTION: Record<SectionId, string> = {
  overview: "overview",
  players: "players",
  cards: "cards",
  decks: "decks",
  rooms: "rooms",
  matches: "matches",
  bots: "settings",
  logs: "logs.security",
  settings: "settings",
};

export function AdminPage() {
  const { section = "overview" } = useParams();
  const auth = useAuth();
  const client = auth.mode === "live" ? auth.client : null;
  const [gate, setGate] = useState<AdminGate>("loading");
  const [env, setEnv] = useState("");
  const [data, setData] = useState<unknown>(null);
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

  const current = SECTIONS.find((s) => s.id === section)?.id ?? "overview";

  const load = useCallback(async () => {
    if (gate !== "ok") return;
    setError(null);
    try {
      setData(await api(ACTION[current], current === "players" ? { query } : {}));
    } catch (e) {
      setError(e instanceof ApiError ? `${e.code}: ${e.message}` : "โหลดไม่สำเร็จ");
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

  const mutate = async (label: string, action: string, params: Row) => {
    if (!window.confirm(`${label}?`)) return;
    setPending(true);
    try {
      const out = await api(action, params);
      if (action === "bots.simulate") setData({ simulation: out });
      else await load();
    } catch (e) {
      setError(e instanceof ApiError ? `${e.code}: ${e.message}` : "ไม่สำเร็จ");
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
      case "overview":
        return (
          <>
            <Card title="System">
              <Table
                rows={[{ ...(field(data, "counts") as Row), ...(field(data, "system") as Row) }]}
              />
            </Card>
            <Card title="Recent game events">
              <Table rows={asRows(field(data, "recentEvents"))} />
            </Card>
          </>
        );
      case "players":
        return (
          <Card title="Players">
            <input
              aria-label="ค้นหาผู้เล่น"
              placeholder="ค้นหาชื่อหรืออีเมล"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              className="am-sticker min-h-11 bg-am-card px-3 shadow-none"
            />
            <Table
              rows={asRows(data)}
              actions={(r) =>
                r["is_admin"] === true ? null : (
                  <button
                    type="button"
                    disabled={pending}
                    className="underline"
                    onClick={() =>
                      void mutate(
                        r["disabled"] === true ? "เปิดใช้บัญชี" : "ระงับบัญชี",
                        "player.set_disabled",
                        {
                          userId: r["id"],
                          disabled: r["disabled"] !== true,
                        },
                      )
                    }
                  >
                    {r["disabled"] === true ? "เปิดใช้" : "ระงับ"}
                  </button>
                )
              }
            />
          </Card>
        );
      case "cards":
        return (
          <>
            <p className="text-sm text-am-muted">ดูได้อย่างเดียว — แก้กติกา/การ์ดผ่าน Spec + PR</p>
            <Card title="Cards">
              <Table rows={asRows(field(data, "cards"))} />
            </Card>
            <Card title="Evolution recipes">
              <Table rows={asRows(field(data, "evolutions"))} />
            </Card>
            <Card title="Fusion recipes">
              <Table rows={asRows(field(data, "fusions"))} />
            </Card>
          </>
        );
      case "decks":
        return (
          <Card title="Deck templates (read-only)">
            <Table rows={asRows(data)} />
          </Card>
        );
      case "rooms":
        return (
          <Card title="Open rooms">
            <Table
              rows={asRows(data)}
              actions={(r) =>
                r["status"] === "lobby" ? (
                  <button
                    type="button"
                    className="underline"
                    disabled={pending}
                    onClick={() => void mutate("ปิดห้อง", "room.close", { roomId: r["id"] })}
                  >
                    ปิดห้อง
                  </button>
                ) : null
              }
            />
          </Card>
        );
      case "matches":
        return (
          <Card title="Active matches">
            <Table
              rows={asRows(data)}
              actions={(r) => (
                <button
                  type="button"
                  className="underline"
                  disabled={pending}
                  onClick={() => void mutate("ยุติแมตช์นี้", "match.abandon", { matchId: r["id"] })}
                >
                  ยุติ
                </button>
              )}
            />
          </Card>
        );
      case "bots":
        return (
          <Card title="Bot testing">
            <p className="text-sm">
              จำลอง Bot vs Bot บน Server (ไม่บันทึกข้อมูลเกม) — ใช้ได้เฉพาะ Development
            </p>
            <StickerButton
              disabled={pending || env !== "development"}
              onClick={() => void mutate("จำลอง 20 เกม", "bots.simulate", { games: 20 })}
            >
              จำลอง 20 เกม
            </StickerButton>
            {field(data, "simulation") !== undefined && (
              <Table rows={[field(data, "simulation") as Row]} />
            )}
          </Card>
        );
      case "logs":
        return (
          <>
            <Card title="Admin audit log">
              <Table rows={asRows(field(data, "audit"))} />
            </Card>
            <Card title="Security events (401/403/429/5xx)">
              <Table rows={asRows(field(data, "rejected"))} />
            </Card>
          </>
        );
      case "settings":
        return (
          <Card title="Settings (read-only)">
            <Table rows={[data as Row]} />
          </Card>
        );
    }
  })();

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">Admin</h1>
        <span className="rounded-full bg-am-round px-3 py-1 text-xs font-bold text-am-ink">
          {env}
        </span>
      </div>
      <nav aria-label="Admin sections" className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <NavLink
            key={s.id}
            to={`/admin/${s.id}`}
            className={({ isActive }) =>
              `am-sticker am-pressable px-3 py-1.5 text-sm font-semibold ${isActive || (s.id === "overview" && section === "overview") ? "bg-am-hover" : "bg-am-card"}`
            }
          >
            {s.label}
          </NavLink>
        ))}
      </nav>
      {current === "logs" && (
        <StickerButton
          onClick={() =>
            void api("logs.game").then((rows) => {
              setData({ audit: [], rejected: [], game: rows });
            })
          }
        >
          ดู Game events
        </StickerButton>
      )}
      {current === "logs" && field(data, "game") !== undefined && (
        <Card title="Game events">
          <Table rows={asRows(field(data, "game"))} />
        </Card>
      )}
      {error && (
        <p role="alert" className="border-l-4 border-am-danger pl-2 font-semibold">
          {error}
        </p>
      )}
      {data !== null && body}
    </section>
  );
}
