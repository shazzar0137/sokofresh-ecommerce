import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw/http";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { createApiClient, unwrap } from "@/api/client";
import { makeQueryClient } from "@/api/query-client";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/states";
import { server } from "@/mocks/node";
import { problemResponse } from "@/mocks/problem";

/** A component using the API client through TanStack Query, the way pages will. */
const api = createApiClient({ baseUrl: "http://localhost:3000" });

function HealthBadge() {
  const query = useQuery({
    queryKey: ["health"],
    queryFn: ({ signal }) => unwrap(api.GET("/api/v1/health", { signal })),
    retryDelay: 0,
  });
  if (query.isPending) return <LoadingState label="Checking service" rows={1} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  return <p>Service: {query.data.status}</p>;
}

function renderWithClient(ui: ReactNode) {
  return render(<QueryClientProvider client={makeQueryClient()}>{ui}</QueryClientProvider>);
}

describe("API client + TanStack Query + UI states", () => {
  it("shows loading, then data", async () => {
    renderWithClient(<HealthBadge />);
    expect(screen.getByRole("status")).toHaveTextContent("Checking service");
    expect(await screen.findByText("Service: ok")).toBeInTheDocument();
  });

  it("retries a temporary 503 and then shows the data", async () => {
    let calls = 0;
    server.use(
      http.get("*/api/v1/health", () => {
        calls += 1;
        return calls === 1 ? problemResponse(503, "service_unavailable") : HttpResponse.json({ status: "ok", database: "ok" });
      }),
    );
    renderWithClient(<HealthBadge />);
    expect(await screen.findByText("Service: ok")).toBeInTheDocument();
    expect(calls).toBe(2);
  });

  it("does not retry a 404, shows a friendly error and recovers on 'Try again'", async () => {
    let calls = 0;
    server.use(
      http.get("*/api/v1/health", () => {
        calls += 1;
        return calls === 1
          ? problemResponse(404, "not_found", { detail: "No route matched /internal/secret" })
          : HttpResponse.json({ status: "ok", database: "ok" });
      }),
    );
    renderWithClient(<HealthBadge />);
    const alert = await screen.findByRole("alert");
    expect(calls).toBe(1);
    expect(alert).toHaveTextContent("We couldn't find that.");
    expect(alert).not.toHaveTextContent("/internal/secret");

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Service: ok")).toBeInTheDocument();
  });
});
