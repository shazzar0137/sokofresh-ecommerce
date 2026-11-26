import { afterEach, describe, expect, it, vi } from "vitest";

import { CSRF_BOOTSTRAP_PATH, ensureCsrfToken, isUnsafeMethod, readCookie } from "@/api/csrf";

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

  it("asks Django for the cookie once, even for concurrent callers", async () => {
    const fetchSpy = vi.fn<typeof fetch>(async () => {
      document.cookie = "csrftoken=fresh; path=/";
      return new Response("{}", { status: 200 });
    });
    const [a, b] = await Promise.all([ensureCsrfToken(fetchSpy), ensureCsrfToken(fetchSpy)]);
    expect(a).toBe("fresh");
    expect(b).toBe("fresh");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe(CSRF_BOOTSTRAP_PATH);
    expect(fetchSpy.mock.calls[0]?.[1]).toMatchObject({ method: "GET", credentials: "same-origin" });
  });

  it("returns null (and does not throw) when the bootstrap request fails", async () => {
    const fetchSpy = vi.fn<typeof fetch>(async () => {
      throw new TypeError("offline");
    });
    await expect(ensureCsrfToken(fetchSpy)).resolves.toBeNull();
  });
});
