import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));
const shared = fileURLToPath(new URL("../shared", import.meta.url));
const emptyModule = fileURLToPath(new URL("./tests/support/empty-module.ts", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@/": `${src}/`,
      "@shared/": `${shared}/`,
      // `server-only` is provided by Next.js at build time; in unit tests it is a no-op.
      "server-only": emptyModule,
    },
  },
  test: {
    environment: "jsdom",
    environmentOptions: { jsdom: { url: "http://localhost:3000/" } },
    setupFiles: ["./tests/support/setup.ts"],
    include: ["tests/{unit,component,integration,accessibility}/**/*.test.{ts,tsx}"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/api/schema.d.ts", "src/app/**/page.tsx", "src/app/**/layout.tsx", "src/mocks/browser.ts"],
      reporter: ["text-summary", "text", "json-summary"],
    },
  },
});
