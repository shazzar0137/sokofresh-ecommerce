import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Grey placeholder shape while content loads. Hidden from screen readers (LoadingState announces instead). */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-control bg-tint", className)}
      {...props}
    />
  );
}
