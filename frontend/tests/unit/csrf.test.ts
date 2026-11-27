import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CSRF_BOOTSTRAP_PATH,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  ensureCsrfToken,
  isUnsafeMethod,
  readCookie,
} from "@/api/csrf";

describe("contract values (CONTRACTS.md F-6), checked as literals", () => {
  it("matches Django's names and allauth's bootstrap path", () => {
    expect(CSRF_COOKIE_NAME).toBe("csrftoken");
    expect(CSRF_HEADER_NAME).toBe("X-CSRFToken");
    expect(CSRF_BOOTSTRAP_PATH).toBe("/_allauth/browser/v1/config");
  });
});

describe("readCookie", () => {
  it.each([
    ["csrftoken=abc", "abc"],
    ["sessionid=x; csrftoken=abc; other=1", "abc"],
    ["  csrftoken=a%20b ", "a b"],
    ["csrftoken=a=b", "a=b"],
    ["csrftoken=%E0%A4%A", "%E0%A4%A"],
  ])("reads csrftoken from %j", (cookies, expected) => {
    expect(readCookie("csrftoken", cookies)).toBe(expected);
  });

  it.each(["", "other=1", "csrftoken=", "xcsrftoken=abc"])("returns null for %j", (cookies) => {
    expect(readCookie("csrftoken", cookies)).toBeNull();
  });
});

describe("isUnsafeMethod", () => {
  it.each(["POST", "PUT", "PATCH", "DELETE", "post"])("%s needs a CSRF token", (m) => {
    expect(isUnsafeMethod(m)).toBe(true);
  });
  it.each(["GET", "HEAD", "OPTIONS", "get"])("%s does not", (m) => {
    expect(isUnsafeMethod(m)).toBe(false);
  });
});

describe("ensureCsrfToken", () => {
  afterEach(() => {
    document.cookie = "csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  });

  it("uses the existing cookie without a request", async () => {
    document.cookie = "csrftoken=existing; path=/";
    const fetchSpy = vi.fn<typeof fetch>();
    await expect(ensureCsrfToken(fetchSpy)).resolves.toBe("existing");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("makes one bootstrap request even when callers overlap while it is still in flight", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const fetchSpy = vi.fn<typeof fetch>(async () => {
      await gate; // still in flight when the second caller arrives
      document.cookie = "csrftoken=fresh; path=/";
      return new Response("{}", { status: 200 });
    });
    const first = ensureCsrfToken(fetchSpy);
    const second = ensureCsrfToken(fetchSpy);
    release();
    await expect(Promise.all([first, second])).resolves.toEqual(["fresh", "fresh"]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe("http://localhost:3000/_allauth/browser/v1/config");
    expect(fetchSpy.mock.calls[0]?.[1]).toMatchObject({ method: "GET", credentials: "same-origin" });
  });

  it("gives up after its timeout instead of hanging, and tries again next time", async () => {
    const hanging = vi.fn<typeof fetch>(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
        }),
    );
    await expect(ensureCsrfToken(hanging, 30)).resolves.toBeNull();
    // The failed attempt is not cached: a later call makes a fresh request.
    const ok = vi.fn<typeof fetch>(async () => {
      document.cookie = "csrftoken=later; path=/";
      return new Response("{}");
    });
    await expect(ensureCsrfToken(ok, 30)).resolves.toBe("later");
    expect(ok).toHaveBeenCalledTimes(1);
  });

  it("returns null when Django answers but sets no cookie", async () => {
    const fetchSpy = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }));
    await expect(ensureCsrfToken(fetchSpy)).resolves.toBeNull();
  });

  it("returns null (and does not throw) when the bootstrap request fails", async () => {
    const fetchSpy = vi.fn<typeof fetch>(async () => {
      throw new TypeError("offline");
    });
    await expect(ensureCsrfToken(fetchSpy)).resolves.toBeNull();
  });
});
