import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against a production build (`next build && next start`),
 * so security headers, rewrites and static rendering are tested as shipped.
 * The backend is not needed: Phase 3 pages make no API calls. API behaviour is
 * covered by the Vitest integration tests with MSW.
 *
 * NEXT_PUBLIC_SHOW_DESIGN_SYSTEM=true exposes /design-system in this test build
 * only (it is a 404 in real production builds).
 */

const PORT = Number(process.env.E2E_PORT ?? 3100);

// Optional: use an already-installed Chromium instead of Playwright's download
// (for machines without internet access to the browser CDN). CI uses `npx playwright install`.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: { executablePath },
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    // Mid-range Android phone size (NFR-03); Chromium engine as on Chrome/Samsung Internet.
    { name: "chromium-mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      BACKEND_ORIGIN: process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:8000",
      NEXT_PUBLIC_SITE_URL: baseURL,
      NEXT_PUBLIC_SHOW_DESIGN_SYSTEM: "true",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
