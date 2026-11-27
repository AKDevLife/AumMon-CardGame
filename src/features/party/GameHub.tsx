import { Link } from "react-router";

/** Platform home (owner 2026-11-27, brand architecture): pick an AumMon game. */
const GAMES = [
  {
    to: "/bluff",
    icon: "🎭",
    name: "AumMon BLUFF",
    category: "Social Party Game",
    tagline: "ทายใจ ตบตาเพื่อน 2–8 คน · ที่ว่างเติม Bot ได้",
  },
  {
    to: "/edo",
    icon: "🧸",
    name: "AumMon Object Battle Card",
    category: "Card Game",
    tagline: "เกมไพ่ทิ้งให้หมดมือ 2–8 คน · สิ่งของรอบตัวมีชีวิต",
  },
] as const;

export function GameHub() {
  return (
    <>
      <section className="flex flex-col gap-2 py-4 text-center">
        <h1 className="text-5xl font-bold">AumMon</h1>
        <p className="text-party-muted">Party Game Platform · เลือกเกมที่อยากเล่น</p>
      </section>
      <nav aria-label="AumMon Games" className="flex flex-col gap-3">
        {GAMES.map((g) => (
          <Link
            key={g.to}
            to={g.to}
            className="flex items-center gap-4 rounded-2xl border border-party-border bg-party-surface p-4 hover:bg-party-surface-raised"
          >
            <span aria-hidden="true" className="text-4xl">
              {g.icon}
            </span>
            <span className="flex flex-col">
              <span className="text-xs text-party-muted">{g.category}</span>
              <span className="text-xl font-bold text-party-accent">{g.name}</span>
              <span className="text-sm text-party-muted">{g.tagline}</span>
            </span>
          </Link>
        ))}
      </nav>
    </>
  );
}
