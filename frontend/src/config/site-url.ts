/**
 * The storefront's public address (NEXT_PUBLIC_SITE_URL), e.g. https://sokofresh.co.ke.
 *
 * It decides whether HSTS and `upgrade-insecure-requests` are sent, and is the
 * base for metadata links. Those headers are baked in at build time, so a
 * production build or server must not silently fall back to localhost
 * (review findings ARCH-7 / SEC-3): there it is required and must be https,
 * except for a local address used to test a production build on one's own machine.
 */

export const DEFAULT_DEV_SITE_URL = "http://localhost:3000";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export class SiteUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SiteUrlError";
  }
}

type Env = Record<string, string | undefined>;

export function resolveSiteUrl(env: Env, { required = false }: { required?: boolean } = {}): URL {
  const raw = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) {
    if (required) {
      throw new SiteUrlError("NEXT_PUBLIC_SITE_URL must be set for production builds (for example https://sokofresh.co.ke).");
    }
    return new URL(DEFAULT_DEV_SITE_URL);
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new SiteUrlError(`NEXT_PUBLIC_SITE_URL is not a valid URL: "${raw}"`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new SiteUrlError("NEXT_PUBLIC_SITE_URL must use https (or http for a local address).");
  }
  if (url.protocol === "http:" && !LOCAL_HOSTS.has(url.hostname)) {
    throw new SiteUrlError("NEXT_PUBLIC_SITE_URL must use https unless it is a local address (localhost or 127.0.0.1).");
  }
  if (url.username || url.password || (url.pathname && url.pathname !== "/") || url.search || url.hash) {
    throw new SiteUrlError("NEXT_PUBLIC_SITE_URL must be an origin only, such as https://sokofresh.co.ke.");
  }
  return new URL(url.origin);
}
