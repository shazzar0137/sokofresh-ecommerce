import { setupServer } from "msw/node";

import { handlers } from "./handlers";

/** Used by Vitest (see tests/setup.ts). */
export const server = setupServer(...handlers);
