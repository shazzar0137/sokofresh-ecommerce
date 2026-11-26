import { http, HttpResponse } from "msw/http";

import type { components } from "@/api/schema";

/**
 * MSW request handlers: mock answers for API calls during development and tests.
 *
 * Rules (ADR-0009, role brief §8):
 * - Only endpoints that exist in shared/contracts/openapi.yaml are mocked, and
 *   every body is typed with the generated contract types, so a mock cannot drift
 *   from the real API without a type error.
 * - Endpoints that are planned but not yet in the contract are NOT invented here.
 * - Every mocked response carries `X-SokoFresh-Mock: true` so it can be spotted in
 *   the browser's network tab, and the UI shows the MockDataBanner.
 */

export const MOCK_HEADER = "X-SokoFresh-Mock";

type Health = components["schemas"]["Health"];

const healthy = { status: "ok", database: "ok" } satisfies Health;

export const handlers = [
  http.get("*/api/v1/health", () =>
    HttpResponse.json<Health>(healthy, { headers: { [MOCK_HEADER]: "true" } }),
  ),
];
