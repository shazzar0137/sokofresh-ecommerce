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
const STUB_BACKEND_PORT = Number(process.env.STUB_BACKEND_PORT ?? 8765);
// Reuse an already running server only when asked (E2E_REUSE=1), so a stale
// `next dev` on the same port is never tested by mistake (review QA-13).
const reuse = process.env.E2E_REUSE === "1";

// Optional: use an already-installed Chromium instead of Playwright's download
// (for machines without internet access to the browser CDN). CI uses `npx playwright install`.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // A test that only passes on retry fails the run instead of hiding (QA-13).
  failOnFlakyTests: Boolean(process.env.CI),
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
  webServer: [
    {
      // Stand-in for Django, to prove the /api/v1 and /_allauth rewrites (QA-6).
      command: `node tests/e2e/support/stub-backend.mjs`,
      port: STUB_BACKEND_PORT,
      reuseExistingServer: reuse,
      env: { STUB_BACKEND_PORT: String(STUB_BACKEND_PORT) },
    },
    {
      command: `npm run build && npm run start -- -p ${PORT}`,
      url: baseURL,
      reuseExistingServer: reuse,
      timeout: 240_000,
      env: {
        BACKEND_ORIGIN: `http://127.0.0.1:${STUB_BACKEND_PORT}`,
        NEXT_PUBLIC_SITE_URL: baseURL,
        NEXT_PUBLIC_SHOW_DESIGN_SYSTEM: "true",
        NEXT_TELEMETRY_DISABLED: "1",
      },
    },
  ],
});
