import { describe, expect, it } from "vitest";
import { ApiError } from "../../lib/api.ts";
import { gateFromError, gateFromMe } from "./guard.ts";

describe("admin gate", () => {
  it("maps server answers to screens", () => {
    expect(gateFromError(new ApiError(401, "unauthenticated", ""))).toBe("signed_out");
    expect(gateFromError(new ApiError(403, "forbidden", ""))).toBe("forbidden");
    expect(gateFromError(new ApiError(403, "mfa_required", ""))).toBe("mfa");
    expect(gateFromError(new Error("x"))).toBe("error");
    expect(gateFromMe({ aal: "aal1" })).toBe("mfa");
    expect(gateFromMe({ aal: "aal2" })).toBe("ok");
  });
});
