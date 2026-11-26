import { HttpResponse } from "msw/http";

import type { ProblemCode, ProblemDetail } from "@/api/errors";

import { MOCK_HEADER } from "./handlers";

/** Builds a contract-shaped RFC 9457 error response for tests and mocks. */
export function problemResponse(
  status: number,
  code: ProblemCode,
  overrides: Partial<ProblemDetail> = {},
  headers: Record<string, string> = {},
) {
  const body: ProblemDetail = {
    type: "about:blank",
    title: "Request failed",
    status,
    detail: "Mock problem response.",
    code,
    errors: [],
    ...overrides,
  };
  return HttpResponse.json(body, {
    status,
    headers: { "Content-Type": "application/problem+json", [MOCK_HEADER]: "true", ...headers },
  });
}
