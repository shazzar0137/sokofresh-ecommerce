import { queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "../client";

/** GET /api/v1/health: the only endpoint in the Phase 3 contract. */
export const healthQuery = () =>
  queryOptions({
    queryKey: ["health"] as const,
    queryFn: ({ signal }) => unwrap(api.GET("/api/v1/health", { signal })),
  });
