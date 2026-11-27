import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * QA-1: the switches that must be OFF in production builds, tested with
 * NODE_ENV=production rather than only through props.
 * Modules read process.env when they load, so each case re-imports them.
 */

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.doUnmock("@/mocks/browser");
});

async function loadPublicEnv() {
  vi.resetModules();
  return import("@/config/public-env");
}

describe("public-env in a production build", () => {
  it("never enables mock data, even when NEXT_PUBLIC_API_MOCKING=enabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_API_MOCKING", "enabled");
    expect((await loadPublicEnv()).isApiMockingEnabled).toBe(false);
  });

  it("hides the design-system page unless NEXT_PUBLIC_SHOW_DESIGN_SYSTEM=true", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SHOW_DESIGN_SYSTEM", "");
    expect((await loadPublicEnv()).isDesignSystemPageEnabled).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_SHOW_DESIGN_SYSTEM", "true");
    expect((await loadPublicEnv()).isDesignSystemPageEnabled).toBe(true);
  });

  it("enables mocking in development only when asked", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_API_MOCKING", "enabled");
    expect((await loadPublicEnv()).isApiMockingEnabled).toBe(true);
    vi.stubEnv("NEXT_PUBLIC_API_MOCKING", "disabled");
    expect((await loadPublicEnv()).isApiMockingEnabled).toBe(false);
  });
});

describe("MockingGate", () => {
  it("in production renders children immediately and never loads the MSW worker", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_API_MOCKING", "enabled");
    const start = vi.fn(async () => undefined);
    vi.doMock("@/mocks/browser", () => ({ worker: { start } }));
    vi.resetModules();
    const { MockingGate } = await import("@/mocks/mocking-gate");
    render(
      <MockingGate>
        <p>shop content</p>
      </MockingGate>,
    );
    expect(screen.getByText("shop content")).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 20));
    expect(start).not.toHaveBeenCalled();
  });

  it("in development with mocking on, waits for the worker before rendering", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_API_MOCKING", "enabled");
    const start = vi.fn(async () => undefined);
    vi.doMock("@/mocks/browser", () => ({ worker: { start } }));
    vi.resetModules();
    const { MockingGate } = await import("@/mocks/mocking-gate");
    render(
      <MockingGate>
        <p>shop content</p>
      </MockingGate>,
    );
    expect(screen.queryByText("shop content")).not.toBeInTheDocument();
    expect(await screen.findByText("shop content")).toBeInTheDocument();
    expect(start).toHaveBeenCalledWith({ onUnhandledFrame: "bypass", quiet: true });
  });
});

describe("MockDataBanner default", () => {
  it("is hidden in production even with mocking requested", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_API_MOCKING", "enabled");
    vi.resetModules();
    const { MockDataBanner } = await import("@/components/common/mock-data-banner");
    const { container } = render(<MockDataBanner />);
    expect(container).toBeEmptyDOMElement();
  });
});
