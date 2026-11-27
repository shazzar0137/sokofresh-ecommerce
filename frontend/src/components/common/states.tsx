import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Loading and empty states (FE-60). The error state is in error-state.tsx
 * (it is interactive, so it is a Client Component).
 */

export interface LoadingStateProps {
  /** Announced to screen readers, e.g. "Loading products". */
  label?: string;
  /** Number of placeholder rows to show. */
  rows?: number;
  className?: string;
}

export function LoadingState({ label = "Loading", rows = 3, className }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col gap-3", className)}>
      <span className="sr-only">{label}…</span>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-6 w-full last:w-2/3" />
      ))}
    </div>
  );
}

export interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
  /** Heading level for the title (keeps the page outline correct). */
  headingLevel?: 2 | 3;
}

export function EmptyState({ title, description, action, icon, className, headingLevel = 2 }: EmptyStateProps) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-card bg-tint px-6 py-10 text-center", className)}>
      <span aria-hidden="true" className="text-ink-muted [&_svg]:size-8">
        {icon ?? <Inbox />}
      </span>
      <H className="font-display text-h3 font-extrabold text-ink">{title}</H>
      {description ? <div className="max-w-prose text-sub text-ink-muted">{description}</div> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
