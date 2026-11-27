"use client";

/**
 * Last-resort error page, used only if the root layout itself fails. It
 * replaces the whole document, so it cannot use the app's styles or fonts:
 * minimal inline styles in the brand colours instead.
 */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fbf8f1", color: "#16130f" }}>
        <main style={{ maxWidth: "36rem", margin: "0 auto", padding: "4rem 1.25rem" }}>
          <h1 style={{ fontSize: "2rem", margin: "0 0 1rem" }}>Something went wrong</h1>
          <p style={{ color: "#6b6459", margin: "0 0 1.5rem" }}>
            SokoFresh could not load this page. Please try again.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              background: "#0c6b3f",
              color: "#fff",
              border: 0,
              borderRadius: "0.5rem",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
