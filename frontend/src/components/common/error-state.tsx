import { AlertTriangle, RotateCw } from "lucide-react";

import { userMessageFor } from "@/api/errors";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  /** The thrown value; its message is translated into safe, friendly wording. */
  error?: unknown;
  title?: string;
  /** Overrides the message derived from `error`. */
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  headingLevel?: 2 | 3;
}

/**
 * Never shows raw error text, stack traces or server details to customers:
 * only wording chosen in api/errors.ts.
 */
export function ErrorState({
  error,
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  className,
  headingLevel = 2,
}: ErrorStateProps) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-card border-2 border-accent/30 bg-card px-6 py-10 text-center",
        className,
      )}
    >
      <span aria-hidden="true" className="text-accent [&_svg]:size-8">
        <AlertTriangle />
      </span>
      <H className="font-display text-h3 font-extrabold text-ink">{title}</H>
      <p className="max-w-prose text-sub text-ink-muted">{message ?? userMessageFor(error)}</p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry} className="mt-2">
          <RotateCw aria-hidden="true" />
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
