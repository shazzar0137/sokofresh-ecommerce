import { describe, expect, it } from "vitest";

import { BackendOriginError, DEFAULT_DEV_BACKEND_ORIGIN, resolveBackendOrigin } from "@/config/backend-origin";

describe("resolveBackendOrigin", () => {
  it("defaults to local Django outside production", () => {
    expect(resolveBackendOrigin({ NODE_ENV: "development" })).toBe(DEFAULT_DEV_BACKEND_ORIGIN);
    expect(resolveBackendOrigin({ NODE_ENV: "test" })).toBe(DEFAULT_DEV_BACKEND_ORIGIN);
  });

  it("is required in production", () => {
    expect(() => resolveBackendOrigin({ NODE_ENV: "production" })).toThrow(BackendOriginError);
    expect(() => resolveBackendOrigin({ NODE_ENV: "production", BACKEND_ORIGIN: "   " })).toThrow(BackendOriginError);
  });

  it("honours an explicit required flag", () => {
    expect(() => resolveBackendOrigin({ NODE_ENV: "production" }, { required: false })).not.toThrow();
    expect(() => resolveBackendOrigin({ NODE_ENV: "development" }, { required: true })).toThrow(BackendOriginError);
  });

  it.each([
    ["https://api.sokofresh.co.ke", "https://api.sokofresh.co.ke"],
    ["https://api.sokofresh.co.ke/", "https://api.sokofresh.co.ke"],
    ["http://127.0.0.1:8000", "http://127.0.0.1:8000"],
    ["  http://backend.internal:8000  ", "http://backend.internal:8000"],
  ])("normalises %j to the origin %s", (input, expected) => {
    expect(resolveBackendOrigin({ NODE_ENV: "production", BACKEND_ORIGIN: input })).toBe(expected);
  });

  it.each([
    ["not a url", "invalid URL"],
    ["ftp://backend.internal", "wrong scheme"],
    ["javascript:alert(1)", "script scheme"],
    ["https://user:pass@backend.internal", "embedded credentials"],
    ["https://backend.internal/api", "path"],
    ["https://backend.internal?x=1", "query"],
    ["https://backend.internal#x", "fragment"],
  ])("rejects %j (%s)", (input) => {
    expect(() => resolveBackendOrigin({ NODE_ENV: "development", BACKEND_ORIGIN: input })).toThrow(BackendOriginError);
  });
});
