import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routes } from "../../app/routes.tsx";
import type { MatchResponse } from "../../platform/useMatch.ts";
import { normalizeJoinCode } from "./join.ts";

const send = vi.fn();
let current: Partial<MatchResponse<unknown>> & { view: Record<string, unknown> };
vi.mock("../../platform/useMatch.ts", () => ({
  useMatch: () => ({
    data: current,
    error: null,
    busy: false,
    send,
    refresh: vi.fn(),
    leave: vi.fn(),
    rematch: vi.fn(),
    seconds: 12,
    live: true,
  }),
}));

const item = { prompt: "มื้อดึก จะสั่งอะไร", options: ["กะเพรา", "มาม่า", "โจ๊ก", "นอน"] };
const base = (view: Record<string, unknown>, extra: Partial<MatchResponse<unknown>> = {}) => ({
  matchId: "m1",
  gameId: "bluff",
  mode: "online" as const,
  version: 3,
  seat: 0,
  names: ["ออม", "บอส", "ฟ้า"],
  pending: [],
  autoSeats: [],
  roomId: "r1",
  ...extra,
  view: {
    round: 1,
    rounds: 5,
    finalRound: false,
    item,
    players: ["a", "b", "c"],
    acts: [null, { kind: "claim", option: 1 }, null],
    locked: [false, false, false],
    myLock: null,
    scores: [0, 0, 0],
    hits: [0, 0, 0],
    reveal: null,
    placements: null,
    ...view,
  },
});

const renderAt = (path: string) =>
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />);

describe("party home", () => {
  it("asks for a nickname and offers create / join (disabled in preview)", () => {
    renderAt("/");
    expect(screen.getByLabelText("ชื่อเล่น")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "สร้างห้อง" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "เข้าห้องด้วยโค้ด" })).toBeDisabled();
    const size = screen.getByLabelText(/จำนวนผู้เล่น/);
    expect(Array.from((size as HTMLSelectElement).options).map((o) => o.value)).toEqual([
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
    ]);
    expect(screen.getByRole("button", { name: /ตั้งค่า/ })).toBeInTheDocument();
  });

  it("normalizes join codes", () => {
    expect(normalizeJoinCode(" ab-cd ef12 ")).toBe("ABCDEF12");
  });
});

describe("BLUFF game screen", () => {
  beforeEach(() => {
    send.mockReset();
  });

  it("claim phase: buttons show the option text and send intents only", () => {
    current = base({ phase: "claim" }, { pending: [0, 2] });
    renderAt("/party/game/m1");
    const d = screen.getByRole("button", { name: /ฉันเลือก D/ });
    expect(d).toHaveTextContent("นอน");
    expect(screen.getByRole("list", { name: "คำประกาศ" })).toHaveTextContent(
      "บอส: ฉันเลือก B (มาม่า)",
    );
    fireEvent.click(d);
    expect(send).toHaveBeenCalledWith({ type: "claim", option: 3 });
  });

  it("lock phase: lock needs an answer and a prediction", () => {
    current = base({ phase: "lock" }, { pending: [0] });
    renderAt("/party/game/m1");
    const lock = screen.getByRole("button", { name: "ล็อก" });
    expect(lock).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /^A กะเพรา/ }));
    fireEvent.click(screen.getByRole("button", { name: "C" }));
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    fireEvent.click(lock);
    expect(send).toHaveBeenCalledWith({ type: "lock", answer: 0, prediction: 2, wager: 2 });
  });

  it("waiting seats see who still decides, never others' answers", () => {
    current = base(
      { phase: "lock", locked: [true, false, false], myLock: { answer: 1 } },
      {
        pending: [1, 2],
      },
    );
    renderAt("/party/game/m1");
    expect(screen.getByText("ล็อกแล้ว รอคนอื่น…")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "สถานะผู้เล่น" })).toHaveTextContent("บอส …");
  });

  it("reveal shows answers, liars and points; results rank with correct reads", () => {
    current = base({
      phase: "reveal",
      scores: [3, 3, 5],
      reveal: {
        round: 1,
        itemId: "bluff-th-food-01",
        itemVersion: 1,
        claims: [null, 1, null],
        locks: [
          { answer: 0, prediction: 2, wager: 1 },
          { answer: 2, prediction: 2, wager: 0 },
          { answer: 2, prediction: 2, wager: 2 },
        ],
        points: [{ total: 3 }, { total: 3 }, { total: 5 }],
      },
    });
    const { unmount } = renderAt("/party/game/m1");
    expect(screen.getByRole("list", { name: "ใครโกหก" })).toHaveTextContent("โกหก!");
    expect(screen.getByRole("button", { name: /รายงานคำถามนี้/ })).toBeEnabled();
    unmount();

    current = base({
      phase: "finished",
      scores: [9, 4, 12],
      hits: [3, 1, 4],
      placements: [2, 3, 1],
    });
    renderAt("/party/game/m1");
    const ranking = screen.getByRole("list", { name: "อันดับ" });
    expect(ranking.firstElementChild).toHaveTextContent("ฟ้า");
    expect(ranking).toHaveTextContent("อ่านใจถูก 4 ครั้ง");
    expect(screen.getByRole("link", { name: /กลับห้อง/ })).toHaveAttribute("href", "/party/lobby/r1");
  });
});
