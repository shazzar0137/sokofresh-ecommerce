import type { components } from "./schema";

/**
 * Error handling for the SokoFresh API.
 *
 * The backend returns RFC 9457 "problem details" for every error, with a stable
 * machine-readable `code` (contract point F-1). Code should switch on `code`,
 * never on `title` or `detail`, whose wording may change.
 *
 * Types come from the generated contract (schema.d.ts); nothing here is
 * hand-copied from the backend.
 */

export type ProblemDetail = components["schemas"]["ProblemDetail"];
export type ProblemCode = ProblemDetail["code"];
export type FieldError = components["schemas"]["FieldError"];

/** Failures that happen before the API answers, or when its answer is unusable. */
export type ClientErrorCode = "network_error" | "timeout" | "invalid_response";
export type ApiErrorCode = ProblemCode | ClientErrorCode;

/**
 * Friendly wording for every code. Typed as a complete Record: when the
 * backend adds a code to the contract and types are regenerated, this file
 * stops compiling until the new code has a message.
 */
const USER_MESSAGES: Record<ApiErrorCode, string> = {
  validation_error: "Some details need checking. Please correct the highlighted fields.",
  malformed_request: "Something went wrong sending your request. Please try again.",
  bad_request: "Something went wrong sending your request. Please try again.",
  not_authenticated: "Please sign in to continue.",
  authentication_failed: "We couldn't confirm who you are. Please sign in again.",
  permission_denied: "You don't have access to this.",
  csrf_failed: "Your session needs refreshing. Please reload the page and try again.",
  not_found: "We couldn't find that.",
  method_not_allowed: "Something went wrong. Please try again.",
  not_acceptable: "Something went wrong. Please try again.",
  unsupported_media_type: "Something went wrong. Please try again.",
  rate_limited: "Too many attempts. Please wait a moment and try again.",
  service_unavailable: "SokoFresh is briefly unavailable. Please try again in a few minutes.",
  server_error: "Something went wrong on our side. Please try again.",
  error: "Something went wrong. Please try again.",
  network_error: "We couldn't reach SokoFresh. Check your connection and try again.",
  timeout: "This is taking too long. Check your connection and try again.",
  invalid_response: "Something went wrong on our side. Please try again.",
};

const KNOWN_CODES = new Set<string>(Object.keys(USER_MESSAGES));

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly title: string;
  readonly detail: string;
  readonly fieldErrors: readonly FieldError[];
  /** Seconds to wait, from the `Retry-After` header on 429 responses. */
  readonly retryAfterSeconds: number | undefined;

  constructor(init: {
    status: number;
    code: ApiErrorCode;
    title: string;
    detail: string;
    fieldErrors?: readonly FieldError[];
    retryAfterSeconds?: number;
    cause?: unknown;
  }) {
    super(init.detail, { cause: init.cause });
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.title = init.title;
    this.detail = init.detail;
    this.fieldErrors = init.fieldErrors ?? [];
    this.retryAfterSeconds = init.retryAfterSeconds;
  }

  /** Whether trying the same request again might succeed. */
  get isRetryable(): boolean {
    return (
      this.code === "network_error" ||
      this.code === "timeout" ||
      this.status === 502 ||
      this.status === 503 ||
      this.status === 504
    );
  }

  /** Field-level messages keyed by dotted field path (null field → "_request"). */
  fieldMessages(): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    for (const fe of this.fieldErrors) {
      const key = fe.field ?? "_request";
      (out[key] ??= []).push(fe.message);
    }
    return out;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFieldError(value: unknown): value is FieldError {
  return (
    isRecord(value) &&
    (value.field === null || typeof value.field === "string") &&
    typeof value.code === "string" &&
    typeof value.message === "string"
  );
}

/** Runtime check: responses are untrusted input, even from our own API. */
export function isProblemDetail(value: unknown): value is ProblemDetail {
  return (
    isRecord(value) &&
    typeof value.type === "string" &&
    typeof value.title === "string" &&
    typeof value.status === "number" &&
    typeof value.detail === "string" &&
    typeof value.code === "string" &&
    Array.isArray(value.errors) &&
    value.errors.every(isFieldError)
  );
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds) : undefined;
}

/**
 * Builds an ApiError from a failed response and its already-parsed body.
 * If the body is not valid problem details (for example an HTML 502 page from a
 * proxy), a generic error is produced. The raw body is never shown to users.
 */
export function apiErrorFromResponse(response: Response, body: unknown): ApiError {
  const retryAfterSeconds = parseRetryAfter(response.headers.get("Retry-After"));

  if (isProblemDetail(body)) {
    const code: ApiErrorCode = KNOWN_CODES.has(body.code) ? (body.code as ProblemCode) : "error";
    return new ApiError({
      status: response.status,
      code,
      title: body.title,
      detail: body.detail,
      fieldErrors: body.errors,
      retryAfterSeconds,
    });
  }

  const fallbackCode: ApiErrorCode =
    response.status === 429
      ? "rate_limited"
      : response.status === 503
        ? "service_unavailable"
        : response.status >= 500
          ? "server_error"
          : "invalid_response";

  return new ApiError({
    status: response.status,
    code: fallbackCode,
    title: response.statusText || "Request failed",
    detail: `The server answered with status ${response.status}.`,
    retryAfterSeconds,
  });
}

/** For any thrown value: a message that is safe and useful to show a customer. */
export function userMessageFor(error: unknown): string {
  if (error instanceof ApiError) return USER_MESSAGES[error.code];
  return USER_MESSAGES.error;
}
