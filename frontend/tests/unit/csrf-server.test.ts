// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { ensureCsrfToken } from "@/api/csrf";

describe("ensureCsrfToken on the server", () => {
  it("returns null without any request: there are no browser cookies there", async () => {
    const fetchSpy = vi.fn<typeof fetch>();
    await expect(ensureCsrfToken(fetchSpy)).resolves.toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
