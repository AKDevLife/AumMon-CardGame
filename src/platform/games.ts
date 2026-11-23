/**
 * Client game registry (Game Center). Availability comes from public.games (is_enabled, RLS);
 * this list only holds presentation and routes. Internal ids match supabase public.games.id.
 */
export type GameId = "edo_battle" | "dummy" | "poker";

export interface ClientGame {
  readonly id: GameId;
  readonly name: string;
  readonly tagline: string;
  readonly icon: string;
  readonly minPlayers: number;
  readonly maxPlayers: number;
  /** Route of the solo setup page. */
  readonly soloPath: string;
  /** Route of the online (private room / quick match) page. */
  readonly onlinePath: string;
  /** Route of a running match. */
  readonly matchPath: (matchId: string) => string;
}

export const GAMES: readonly ClientGame[] = [
  {
    id: "edo_battle",
    name: "EDO Battle",
    tagline: "เกมไพ่ทิ้งให้หมดมือ 2–8 คน · สิ่งของรอบตัวมีชีวิต",
    icon: "🧸",
    minPlayers: 2,
    maxPlayers: 8,
    soloPath: "/play/solo",
    onlinePath: "/play/online",
    matchPath: (id) => `/game/${id}`,
  },
  {
    id: "dummy",
    name: "ดัมมี่",
    tagline: "ไพ่ดัมมี่ 2–4 คน · เกิด ฝาก น็อค",
    icon: "🃏",
    minPlayers: 2,
    maxPlayers: 4,
    soloPath: "/games/dummy/solo",
    onlinePath: "/games/dummy/online",
    matchPath: (id) => `/games/dummy/match/${id}`,
  },
  {
    id: "poker",
    name: "โป๊กเกอร์",
    tagline: "Texas Hold'em 2–8 คน · ชิปจำลอง ไม่ใช่เงินจริง",
    icon: "♠️",
    minPlayers: 2,
    maxPlayers: 8,
    soloPath: "/games/poker/solo",
    onlinePath: "/games/poker/online",
    matchPath: (id) => `/games/poker/match/${id}`,
  },
];

export const gameById = (id: string): ClientGame | undefined => GAMES.find((g) => g.id === id);
