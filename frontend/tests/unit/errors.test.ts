import { describe, expect, it } from "vitest";

import { ApiError, apiErrorFromResponse, isProblemDetail, userMessageFor, type ProblemDetail } from "@/api/errors";

const problem = (overrides: Partial<ProblemDetail> = {}): ProblemDetail => ({
  type: "about:blank",
  title: "Validation failed",
  status: 422,
  detail: "One or more fields are invalid.",
  code: "validation_error",
  errors: [
    { field: "phone", code: "invalid", message: "Enter a valid Kenyan mobile number." },
    { field: "address.landmark", code: "max_length", message: "Too long." },
    { field: null, code: "invalid", message: "Prices changed." },
  ],
  ...overrides,
});

describe("isProblemDetail", () => {
  it("accepts a contract-shaped body", () => {
    expect(isProblemDetail(problem())).toBe(true);
  });

  it.each([
    ["null", null],
    ["a string", "Internal Server Error"],
    ["an array", []],
    ["missing code", { ...problem(), code: undefined }],
    ["status as text", { ...problem(), status: "422" }],
    ["errors not an array", { ...problem(), errors: {} }],
    ["malformed field error", { ...problem(), errors: [{ field: 3, code: "x", message: "y" }] }],
  ])("rejects %s", (_label, value) => {
    expect(isProblemDetail(value)).toBe(false);
  });
});

describe("apiErrorFromResponse", () => {
  it("keeps code, status and field errors from problem details", () => {
    const error = apiErrorFromResponse(new Response(null, { status: 422 }), problem());
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.code).toBe("validation_error");
    expect(error.fieldMessages()).toEqual({
      phone: ["Enter a valid Kenyan mobile number."],
      "address.landmark": ["Too long."],
      _request: ["Prices changed."],
    });
  });

  it("maps an unknown future code to the generic 'error' code", () => {
    const body = { ...problem(), code: "brand_new_code" };
    const error = apiErrorFromResponse(new Response(null, { status: 400 }), body);
    expect(error.code).toBe("error");
  });

  it("reads Retry-After on rate limiting", () => {
    const response = new Response(null, { status: 429, headers: { "Retry-After": "30" } });
    const error = apiErrorFromResponse(response, problem({ status: 429, code: "rate_limited", errors: [] }));
    expect(error.code).toBe("rate_limited");
    expect(error.retryAfterSeconds).toBe(30);
  });

  it.each([
    [502, "server_error", true],
    [503, "service_unavailable", true],
    [500, "server_error", false],
    [429, "rate_limited", false],
    [404, "invalid_response", false],
  ])("falls back safely for a non-problem %i body", (status, code, retryable) => {
    const error = apiErrorFromResponse(new Response("<html>Bad gateway</html>", { status }), "<html>Bad gateway</html>");
    expect(error.code).toBe(code);
    expect(error.isRetryable).toBe(retryable);
    expect(error.detail).not.toContain("<html>");
  });

  it("ignores an invalid Retry-After value", () => {
    const response = new Response(null, { status: 429, headers: { "Retry-After": "soon" } });
    expect(apiErrorFromResponse(response, null).retryAfterSeconds).toBeUndefined();
  });
});

describe("userMessageFor", () => {
  it("gives friendly wording, never the server's detail", () => {
    const error = apiErrorFromResponse(
      new Response(null, { status: 500 }),
      problem({ status: 500, code: "server_error", detail: "Traceback: KeyError in orders/views.py", errors: [] }),
    );
    const message = userMessageFor(error);
    expect(message).toBe("Something went wrong on our side. Please try again.");
    expect(message).not.toContain("Traceback");
  });

  it("handles non-ApiError values", () => {
    expect(userMessageFor(new Error("secret internal detail"))).toBe("Something went wrong. Please try again.");
    expect(userMessageFor(undefined)).toBe("Something went wrong. Please try again.");
  });

  it("has wording for network problems", () => {
    const error = new ApiError({ status: 0, code: "network_error", title: "x", detail: "y" });
    expect(userMessageFor(error)).toMatch(/connection/);
    expect(error.isRetryable).toBe(true);
  });
});
