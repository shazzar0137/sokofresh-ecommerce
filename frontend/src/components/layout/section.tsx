import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { PageContainer } from "./page-container";

const tones = {
  cream: "bg-cream",
  tint: "bg-tint",
} as const;

export interface SectionProps extends Omit<ComponentProps<"section">, "title"> {
  /** Section title, rendered as an <h2> in the design's section style. */
  title?: ReactNode;
  subtitle?: ReactNode;
  tone?: keyof typeof tones;
}

/** A full-width page band (e.g. "Tonight's plate", "Fresh from the soko"). */
export function Section({ title, subtitle, tone = "cream", className, children, id, ...props }: SectionProps) {
  const headingId = title && id ? `${id}-title` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(tones[tone], "py-12 md:py-16", className)}
      {...props}
    >
      <PageContainer>
        {title ? (
          <header className="mb-6 md:mb-8">
            <h2 id={headingId} className="font-display text-h1 font-extrabold text-ink">
              {title}
            </h2>
            {subtitle ? <p className="mt-2 text-sub text-ink-muted">{subtitle}</p> : null}
          </header>
        ) : null}
        {children}
      </PageContainer>
    </section>
  );
}
