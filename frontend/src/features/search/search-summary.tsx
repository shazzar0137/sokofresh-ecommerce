/** Maximum length of a search term we echo back (matches the search box limit). */
export const MAX_QUERY_LENGTH = 100;

/** Reads `?q=` safely: first value only, trimmed, length-limited. */
export function readSearchQuery(q: string | string[] | undefined): string | null {
  const value = (Array.isArray(q) ? q[0] : q)?.trim().slice(0, MAX_QUERY_LENGTH);
  return value ? value : null;
}

/**
 * "You searched for …" line on the shop page. The term is user input: it is
 * rendered as React text (escaped), never as HTML.
 */
export async function SearchSummary({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const { q } = await searchParams;
  const query = readSearchQuery(q);
  if (!query) return null;
  return (
    <p className="mb-4 text-sub text-ink-muted">
      You searched for <strong className="text-ink">“{query}”</strong>.
    </p>
  );
}
