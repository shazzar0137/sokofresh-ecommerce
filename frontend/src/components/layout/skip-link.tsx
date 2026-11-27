/** First focusable element: lets keyboard users jump past the header (WCAG 2.4.1). */
export function SkipLink({ targetId = "main-content" }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only rounded-control bg-ink px-4 py-3 font-semibold text-cream focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-3"
    >
      Skip to main content
    </a>
  );
}
