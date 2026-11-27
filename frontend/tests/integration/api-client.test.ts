import { delay } from "msw";
import { http, HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";

import { createApiClient, unwrap } from "@/api/client";
import { CSRF_BOOTSTRAP_PATH, CSRF_HEADER_NAME } from "@/api/csrf";
import { ApiError } from "@/api/errors";
import { MOCK_HEADER } from "@/mocks/handlers";
import { server } from "@/mocks/node";
import { problemResponse } from "@/mocks/problem";

/**
 * The real API client (openapi-fetch + our middleware) against MSW, which
 * intercepts requests at the network level. Only /api/v1/health exists in the
 * contract; other paths below are test-only endpoints used to exercise
 * behaviour (CSRF on writes), reached through an untyped view of the client.
 */

const ORIGIN = "http://localhost:3000";

type UntypedClient = {
  POST: (path: string, init?: Record<string, unknown>) => Promise<{ data?: unknown; error?: unknown; response: Response }>;
  GET: (path: string, init?: Record<string, unknown>) => Promise<{ data?: unknown; error?: unknown; response: Response }>;
};
const untyped = (client: ReturnType<typeof createApiClient>) => client as unknown as UntypedClient;

async function captureError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    return error as ApiError;
  }
  throw new Error("Expected the request to fail");
}

describe("GET /api/v1/health", () => {
  it("returns typed data from the (mocked) contract endpoint", async () => {
    const api = createApiClient({ baseUrl: ORIGIN });
    const { data, response } = await api.GET("/api/v1/health");
    expect(response.status).toBe(200);
    expect(response.headers.get(MOCK_HEADER)).toBe("true");
    expect(data).toEqual({ status: "ok", database: "ok" });
  });

  it("sends JSON Accept headers and no CSRF header on a safe request", async () => {
    let seen: Request | undefined;
    server.use(
      http.get("*/api/v1/health", ({ request }) => {
        seen = request;
        return HttpResponse.json({ status: "ok", database: "ok" });
      }),
    );
    await unwrap(createApiClient({ baseUrl: ORIGIN }).GET("/api/v1/health"));
    expect(seen?.headers.get("Accept")).toContain("application/json");
    expect(seen?.headers.get(CSRF_HEADER_NAME)).toBeNull();
  });

  it("throws an ApiError with the problem code on 503", async () => {
    server.use(
      http.get("*/api/v1/health", () =>
        problemResponse(503, "service_unavailable", { title: "Service unavailable", detail: "Database unreachable." }),
      ),
    );
    const error = await captureError(unwrap(createApiClient({ baseUrl: ORIGIN }).GET("/api/v1/health")));
    expect(error.status).toBe(503);
    expect(error.code).toBe("service_unavailable");
    expect(error.isRetryable).toBe(true);
  });

  it("handles an HTML error page from a proxy without leaking it", async () => {
    server.use(
      http.get(
        "*/api/v1/health",
        () => new HttpResponse("<html><body>502 Bad Gateway</body></html>", { status: 502, headers: { "Content-Type": "text/html" } }),
      ),
    );
    const error = await captureError(unwrap(createApiClient({ baseUrl: ORIGIN }).GET("/api/v1/health")));
    expect(error.code).toBe("server_error");
    expect(error.detail).not.toContain("<html>");
  });

  it("turns a network failure into network_error", async () => {
    server.use(http.get("*/api/v1/health", () => HttpResponse.error()));
    const error = await captureError(unwrap(createApiClient({ baseUrl: ORIGIN }).GET("/api/v1/health")));
    expect(error.code).toBe("network_error");
    expect(error.status).toBe(0);
  });

  it("times out a request that hangs", async () => {
    server.use(
      http.get("*/api/v1/health", async () => {
        await delay("infinite");
        return HttpResponse.json({});
      }),
    );
    const error = await captureError(unwrap(createApiClient({ baseUrl: ORIGIN, timeoutMs: 50 }).GET("/api/v1/health")));
    expect(error.code).toBe("timeout");
  });

  it("lets a caller cancel a request without reporting it as a network error", async () => {
    server.use(
      http.get("*/api/v1/health", async () => {
        await delay(500);
        return HttpResponse.json({ status: "ok", database: "ok" });
      }),
    );
    const controller = new AbortController();
    const pending = createApiClient({ baseUrl: ORIGIN }).GET("/api/v1/health", { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.not.toBeInstanceOf(ApiError);
  });

  it("rejects a 200 response without a body as invalid_response", async () => {
    server.use(http.get("*/api/v1/health", () => new HttpResponse(null, { status: 200 })));
    const error = await captureError(unwrap(createApiClient({ baseUrl: ORIGIN }).GET("/api/v1/health")));
    expect(error.code).toBe("invalid_response");
  });
});

describe("CSRF on writes (contract point F-6)", () => {
  it("copies the csrftoken cookie into X-CSRFToken on POST", async () => {
    document.cookie = "csrftoken=token-from-cookie; path=/";
    let header: string | null = null;
    server.use(
      http.post("*/api/v1/test-write", ({ request }) => {
        header = request.headers.get(CSRF_HEADER_NAME);
        return HttpResponse.json({ ok: true }, { status: 201 });
      }),
    );
    const { response } = await untyped(createApiClient({ baseUrl: ORIGIN })).POST("/api/v1/test-write", { body: {} });
    expect(response.status).toBe(201);
    expect(header).toBe("token-from-cookie");
  });

  it("fetches the token from allauth's config endpoint when the cookie is missing", async () => {
    let bootstrapCalls = 0;
    let header: string | null = null;
    server.use(
      http.get(`*${CSRF_BOOTSTRAP_PATH}`, () => {
        bootstrapCalls += 1;
        document.cookie = "csrftoken=bootstrapped; path=/"; // what Django's Set-Cookie does in a browser
        return HttpResponse.json({ status: 200, data: {} });
      }),
      http.post("*/api/v1/test-write", ({ request }) => {
        header = request.headers.get(CSRF_HEADER_NAME);
        return HttpResponse.json({ ok: true });
      }),
    );
    const fetchWithOrigin: typeof fetch = (input, init) =>
      fetch(typeof input === "string" && input.startsWith("/") ? `${ORIGIN}${input}` : input, init);
    await untyped(createApiClient({ baseUrl: ORIGIN, fetch: fetchWithOrigin })).POST("/api/v1/test-write", { body: {} });
    expect(bootstrapCalls).toBe(1);
    expect(header).toBe("bootstrapped");
  });

  it("surfaces Django's csrf_failed problem as an ApiError", async () => {
    document.cookie = "csrftoken=stale; path=/";
    server.use(http.post("*/api/v1/test-write", () => problemResponse(403, "csrf_failed")));
    const error = await captureError(unwrap(untyped(createApiClient({ baseUrl: ORIGIN })).POST("/api/v1/test-write", { body: {} })));
    expect(error.code).toBe("csrf_failed");
    expect(error.status).toBe(403);
  });

  it("returns field errors from a 422 validation problem", async () => {
    document.cookie = "csrftoken=t; path=/";
    server.use(
      http.post("*/api/v1/test-write", () =>
        problemResponse(422, "validation_error", {
          errors: [{ field: "phone", code: "invalid", message: "Enter a valid Kenyan mobile number." }],
        }),
      ),
    );
    const error = await captureError(unwrap(untyped(createApiClient({ baseUrl: ORIGIN })).POST("/api/v1/test-write", { body: {} })));
    expect(error.fieldMessages()).toEqual({ phone: ["Enter a valid Kenyan mobile number."] });
  });

  it("does not add the header when CSRF handling is switched off (server client)", async () => {
    document.cookie = "csrftoken=t; path=/";
    let header: string | null = "unset";
    server.use(
      http.post("*/api/v1/test-write", ({ request }) => {
        header = request.headers.get(CSRF_HEADER_NAME);
        return HttpResponse.json({ ok: true });
      }),
    );
    await untyped(createApiClient({ baseUrl: ORIGIN, csrf: false })).POST("/api/v1/test-write", { body: {} });
    expect(header).toBeNull();
  });
});

describe("review follow-ups (QA-4, QA-8, ARCH-3)", () => {
  it.each(["PUT", "PATCH", "DELETE"] as const)("adds the CSRF header on %s too", async (method) => {
    document.cookie = "csrftoken=tok; path=/";
    let header: string | null = null;
    const handler = { PUT: http.put, PATCH: http.patch, DELETE: http.delete }[method];
    server.use(
      handler("*/api/v1/test-write", ({ request }) => {
        header = request.headers.get(CSRF_HEADER_NAME);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const client = createApiClient({ baseUrl: ORIGIN }) as unknown as Record<string, (p: string, i?: object) => Promise<{ response: Response }>>;
    const { response } = await client[method]!("/api/v1/test-write", {});
    expect(response.status).toBe(204);
    expect(header).toBe("tok");
  });

  it("does not let a hung CSRF bootstrap freeze a write: it gives up and the write still goes out", async () => {
    server.use(
      http.get(`*${CSRF_BOOTSTRAP_PATH}`, async () => {
        await delay("infinite");
        return HttpResponse.json({});
      }),
      http.post("*/api/v1/test-write", () => problemResponse(403, "csrf_failed")),
    );
    const started = Date.now();
    const error = await captureError(
      unwrap(untyped(createApiClient({ baseUrl: ORIGIN, timeoutMs: 80 })).POST("/api/v1/test-write", { body: {} })),
    );
    expect(error.code).toBe("csrf_failed");
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it("builds every request with credentials: same-origin (checked on the Request itself)", async () => {
    const seen: Request[] = [];
    const spy: typeof fetch = async (input) => {
      seen.push(input as Request);
      return HttpResponse.json({ status: "ok", database: "ok" });
    };
    await unwrap(createApiClient({ baseUrl: ORIGIN, fetch: spy }).GET("/api/v1/health"));
    expect(seen[0]?.credentials).toBe("same-origin");
  });

  it("sends cookies only to the same origin (credentials: same-origin)", async () => {
    let credentials: RequestCredentials | undefined;
    server.use(
      http.get("*/api/v1/health", ({ request }) => {
        credentials = request.credentials;
        return HttpResponse.json({ status: "ok", database: "ok" });
      }),
    );
    await unwrap(createApiClient({ baseUrl: ORIGIN }).GET("/api/v1/health"));
    expect(credentials).toBe("same-origin");
  });

  it("returns undefined for 204 No Content instead of an error", async () => {
    document.cookie = "csrftoken=t; path=/";
    server.use(http.delete("*/api/v1/test-write", () => new HttpResponse(null, { status: 204 })));
    const client = createApiClient({ baseUrl: ORIGIN }) as unknown as { DELETE: (p: string) => Promise<{ data?: unknown; error?: unknown; response: Response }> };
    await expect(unwrap(client.DELETE("/api/v1/test-write"))).resolves.toBeUndefined();
  });

  it("turns an unreadable 200 body (e.g. a captive-portal HTML page sent as JSON) into invalid_response", async () => {
    server.use(
      http.get("*/api/v1/health", () => new HttpResponse("<html>Login to Wi-Fi</html>", { status: 200, headers: { "Content-Type": "application/json" } })),
    );
    const error = await captureError(unwrap(createApiClient({ baseUrl: ORIGIN }).GET("/api/v1/health")));
    expect(error.code).toBe("invalid_response");
  });
});
