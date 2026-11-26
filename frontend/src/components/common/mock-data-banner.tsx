import { isApiMockingEnabled } from "@/config/public-env";

/**
 * Shown on every page while MSW mock data is switched on, so mock prices or
 * stock can never be mistaken for live backend data (role brief §8).
 */
export function MockDataBanner({ enabled = isApiMockingEnabled }: { enabled?: boolean }) {
  if (!enabled) return null;
  return (
    <div role="note" className="bg-gold px-4 py-2 text-center text-small font-semibold text-gold-foreground">
      Development mode: the data on this page is mock data, not the live SokoFresh backend.
    </div>
  );
}
