// @vitest-environment node
import { http, HttpResponse } from "msw/http";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createServerApiClient } from "@/api/server-client";
import { server } from "@/mocks/node";

describe("createServerApiClient", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("calls Django directly at BACKEND_ORIGIN, without a CSRF header", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BACKEND_ORIGIN", "http://backend.internal:8000");
    let seen: Request | undefined;
    server.use(
      http.get("http://backend.internal:8000/api/v1/health", ({ request }) => {
        seen = request;
        return HttpResponse.json({ status: "ok", database: "ok" });
      }),
    );
    const { data } = await createServerApiClient().GET("/api/v1/health");
    expect(data).toEqual({ status: "ok", database: "ok" });
    expect(seen?.headers.get("X-CSRFToken")).toBeNull();
  });

  it("refuses to run in production without BACKEND_ORIGIN", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BACKEND_ORIGIN", "");
    expect(() => createServerApiClient()).toThrow(/BACKEND_ORIGIN/);
  });
});
