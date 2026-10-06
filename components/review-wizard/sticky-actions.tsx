import type { ReactElement, ReactNode } from "react";

import { cn } from "@/lib/utils";

type StickyActionsProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Keeps the primary wizard CTA reachable on mobile while scrolling long steps.
 * Solid paper fade + safe-area padding so fields are not hidden under the bar.
 */
export function StickyActions({
  children,
  className,
}: StickyActionsProps): ReactElement {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 -mx-[18px] mt-5 border-t border-[color:var(--brand-line)] px-[18px] pt-3",
        "bg-card/95 backdrop-blur-[2px]",
        "pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]",
        "sm:-mx-5 sm:px-5",
        className
      )}
    >
      {children}
    </div>
  );
}
