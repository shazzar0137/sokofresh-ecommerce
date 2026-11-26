import { describe, expect, it } from "vitest";

import { ApiError } from "@/api/errors";
import { makeQueryClient, shouldRetry } from "@/api/query-client";

const err = (status: number, code: ConstructorParameters<typeof ApiError>[0]["code"]) =>
  new ApiError({ status, code, title: "t", detail: "d" });

describe("shouldRetry", () => {
  it.each([
    [err(0, "network_error"), true],
    [err(0, "timeout"), true],
    [err(503, "service_unavailable"), true],
    [err(502, "server_error"), true],
    [err(500, "server_error"), false],
    [err(401, "not_authenticated"), false],
    [err(404, "not_found"), false],
    [err(422, "validation_error"), false],
    [err(429, "rate_limited"), false],
    [new Error("programming bug"), false],
  ])("retries %o: %s", (error, expected) => {
    expect(shouldRetry(0, error)).toBe(expected);
  });

  it("stops after two retries", () => {
    expect(shouldRetry(1, err(0, "network_error"))).toBe(true);
    expect(shouldRetry(2, err(0, "network_error"))).toBe(false);
  });
});

describe("makeQueryClient", () => {
  it("never retries mutations automatically", () => {
    expect(makeQueryClient().getDefaultOptions().mutations?.retry).toBe(false);
  });

  it("creates a separate client each time (no data shared between visitors)", () => {
    expect(makeQueryClient()).not.toBe(makeQueryClient());
  });
});
