/**
 * Client game registry (Game Center). Availability comes from public.games (is_enabled, RLS);
 * this list only holds presentation and routes. Internal ids match supabase public.games.id.
 */
export type GameId = "edo_battle";

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
];

export const gameById = (id: string): ClientGame | undefined => GAMES.find((g) => g.id === id);
