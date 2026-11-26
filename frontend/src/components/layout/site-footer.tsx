import { PageContainer } from "./page-container";

/**
 * Footer (design: black band, cream text). Contact details (WhatsApp, till
 * number, email, address, hours) will come from the store settings API in
 * Phase 4: the design's values are placeholders and must never go live
 * (analysis D-7).
 */
export function SiteFooter() {
  return (
    <footer className="surface-dark mt-auto bg-ink text-cream">
      <PageContainer className="flex flex-col gap-3 py-10 text-small sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-[1.125rem] font-extrabold">SokoFresh</p>
        <p lang="sw">Karibu. Chakula kizuri, bei nzuri.</p>
      </PageContainer>
    </footer>
  );
}
