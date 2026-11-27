import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as api from "../lib/api.ts";
import { ApiError } from "../lib/api.ts";
import { POLL_ERRORS_SHOWN_AFTER, useMatch } from "./useMatch.ts";

const callFunction = vi.fn();
vi.mock("../lib/api.ts", async (orig) => ({
  ...(await orig<typeof api>()),
  callFunction: (...args: unknown[]) => callFunction(...args) as unknown,
}));
const client = {};
vi.mock("../features/auth/auth-context.ts", () => ({
  useAuth: () => ({ mode: "live", client, loading: false, session: null }),
}));

const ok = { mode: "solo", version: 1, serverNow: Date.now(), view: {} };

describe("useMatch polling errors", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    callFunction.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("retries one failed poll silently and shows repeated failures", async () => {
    callFunction.mockResolvedValueOnce(ok);
    const { result } = renderHook(() => useMatch("m1"));
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(result.current.data).not.toBeNull();

    callFunction.mockRejectedValue(new ApiError(504, "error", "เกิดข้อผิดพลาด"));
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(result.current.error).toBeNull();

    for (let i = 1; i < POLL_ERRORS_SHOWN_AFTER; i++)
      await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(result.current.error).toBe("เกิดข้อผิดพลาด");

    callFunction.mockResolvedValue(ok);
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(result.current.error).toBeNull();
  });
});
