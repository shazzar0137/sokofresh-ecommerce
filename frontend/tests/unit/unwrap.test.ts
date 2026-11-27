import { describe, expect, it } from "vitest";

import { unwrap } from "@/api/client";
import { ApiError, apiErrorFromResponse } from "@/api/errors";

/** unwrap() when the response started but reading the body failed (review ARCH-3). */
describe("unwrap body-read failures", () => {
  it.each([
    [new DOMException("timed out", "TimeoutError"), "timeout"],
    [new SyntaxError("Unexpected token <"), "invalid_response"],
    [new TypeError("terminated"), "network_error"],
  ])("maps %s to %s", async (thrown, code) => {
    await expect(unwrap(Promise.reject(thrown))).rejects.toMatchObject({ code });
  });

  it("passes a caller's cancellation through unchanged", async () => {
    const abort = new DOMException("aborted", "AbortError");
    await expect(unwrap(Promise.reject(abort))).rejects.toBe(abort);
  });

  it("re-throws an ApiError unchanged", async () => {
    const original = new ApiError({ status: 0, code: "timeout", title: "t", detail: "d" });
    await expect(unwrap(Promise.reject(original))).rejects.toBe(original);
  });
});

describe("apiErrorFromResponse for odd statuses", () => {
  it("treats an unreadable non-error status (e.g. 3xx) as invalid_response", () => {
    expect(apiErrorFromResponse(new Response(null, { status: 302 }), null).code).toBe("invalid_response");
  });
});
