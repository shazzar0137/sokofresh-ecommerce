import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Text input with the design's 2 px ink border (area select, search, M-Pesa number). */
export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(
        "h-12 w-full min-w-0 rounded-control border-2 border-border-strong bg-card px-4 text-body text-ink",
        "placeholder:text-ink-muted",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "aria-invalid:border-accent",
        className,
      )}
      {...props}
    />
  );
}
