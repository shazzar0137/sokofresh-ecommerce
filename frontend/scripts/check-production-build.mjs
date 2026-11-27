// Checks a real production build, built WITHOUT the test-only flags (review QA-1, PERF-1).
//
// Usage (after `npm run build` without NEXT_PUBLIC_SHOW_DESIGN_SYSTEM):
//   BACKEND_ORIGIN=http://127.0.0.1:8000 NEXT_PUBLIC_SITE_URL=http://localhost:3999 node scripts/check-production-build.mjs
//
// It starts `next start`, then fails if:
//   - /design-system is reachable (must be 404),
//   - /mockServiceWorker.js is served (must be 404),
//   - the mock-data banner appears,
//   - MSW code is present in .next/static,
//   - the initial JavaScript of / or /shop exceeds the budget (gzip bytes,
//     excluding the legacy `nomodule` polyfill), see frontend analysis FE-62.
import { spawn } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const PORT = Number(process.env.CHECK_PORT ?? 3999);
const BASE = `http://localhost:${PORT}`;
const JS_BUDGET_GZIP_BYTES = Number(process.env.JS_BUDGET_GZIP_BYTES ?? 170 * 1024);

const failures = [];
const fail = (msg) => failures.push(msg);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

// 1. No MSW code in the browser bundle.
for (const file of walk(".next/static")) {
  if (!file.endsWith(".js")) continue;
  const text = readFileSync(file, "utf8");
  // Markers of MSW's runtime code. (The bare string "mockServiceWorker.js" is
  // expected in the route manifest: it is the path of the production 404 rule.)
  if (/setupWorker|INTEGRITY_CHECKSUM|MSW_ACTIVATE/.test(text)) fail(`MSW code found in ${file}`);
}

// Refuse to run against a server that is already listening: it could be a
// different build and the check would test the wrong thing.
const alreadyUp = await fetch(BASE).then(
  () => true,
  () => false,
);
if (alreadyUp) {
  console.error(`Port ${PORT} is already in use; stop that server or set CHECK_PORT.`);
  process.exit(2);
}

// Own process group, so the whole tree (npx → next → next-server) is stopped afterwards.
const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
  stdio: "ignore",
  env: process.env,
  detached: true,
});
const stopServer = () => {
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    // already stopped
  }
};
try {
  // Wait for the server.
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(BASE);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const status = async (path) => (await fetch(BASE + path, { redirect: "manual" })).status;
  if ((await status("/design-system")) !== 404) fail("/design-system must return 404 in production builds");
  if ((await status("/mockServiceWorker.js")) !== 404) fail("/mockServiceWorker.js must return 404 in production builds");

  for (const path of ["/", "/shop"]) {
    const html = await (await fetch(BASE + path)).text();
    if (/mock data, not the live SokoFresh backend/.test(html)) fail(`mock-data banner shown on ${path}`);

    // Initial scripts referenced by the page, excluding nomodule polyfills.
    const scripts = [...html.matchAll(/<script\b[^>]*>/g)]
      .map(([tag]) => tag)
      .filter((tag) => !/\bnomodule\b/i.test(tag))
      .map((tag) => tag.match(/\bsrc="([^"]+\.js)"/)?.[1])
      .filter(Boolean);
    let total = 0;
    for (const src of new Set(scripts)) {
      const body = Buffer.from(await (await fetch(new URL(src, BASE))).arrayBuffer());
      total += gzipSync(body, { level: 9 }).length;
    }
    console.log(`${path}: ${scripts.length} initial scripts, ${(total / 1024).toFixed(1)} KB gzip (budget ${(JS_BUDGET_GZIP_BYTES / 1024).toFixed(0)} KB)`);
    if (total > JS_BUDGET_GZIP_BYTES) fail(`${path} initial JS ${(total / 1024).toFixed(1)} KB gzip exceeds the budget`);
  }
} finally {
  stopServer();
}

if (failures.length) {
  console.error("Production build check FAILED:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log("Production build check passed.");
