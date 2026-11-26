import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Horizontal page frame from the design: 20 px side margins on phones,
 * growing to 80 px at desktop, with content up to 1280 px wide (1440 px frame).
 */
export function PageContainer({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[calc(var(--container-page)+10rem)] px-5 sm:px-8 lg:px-12 xl:px-20", className)}
      {...props}
    />
  );
}
