import Link from "next/link";

import { cn } from "@/lib/utils";

/** "SokoFresh" wordmark: "Soko" in brand green, "Fresh" in accent red (design). */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="SokoFresh home"
      className={cn("font-display text-[1.625rem] leading-none font-extrabold tracking-tight md:text-[1.75rem]", className)}
    >
      <span className="text-brand">Soko</span>
      <span className="text-accent">Fresh</span>
    </Link>
  );
}
