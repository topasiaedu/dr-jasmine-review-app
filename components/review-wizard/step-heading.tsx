import type { ReactElement } from "react";

import { cn } from "@/lib/utils";

type StepHeadingProps = {
  /** 1-based step number shown in the accent numeral. */
  number: number;
  /** Short section title (one job). */
  title: string;
  /** Optional hand-holding hint (right-aligned on wider screens). */
  hint?: string;
  /** Supporting sentence under the title row. */
  description?: string;
  className?: string;
};

/**
 * MMC-inspired numbered section heading: accent numeral, title, optional hint.
 * Keeps a single job clear at the top of each wizard card.
 */
export function StepHeading({
  number,
  title,
  hint,
  description,
  className,
}: StepHeadingProps): ReactElement {
  return (
    <div className={cn("mb-3.5", className)}>
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span
          className="font-heading text-[1.25rem] font-bold leading-none text-[color:var(--brand-accent)] tabular-nums"
          aria-hidden="true"
        >
          {number}
        </span>
        <h2 className="m-0 text-[1.12rem] font-bold tracking-[-0.01em] text-[color:var(--brand-ink)]">
          {title}
        </h2>
        {hint ? (
          <span className="w-full text-[0.82rem] text-[color:var(--brand-muted)] sm:ml-auto sm:w-auto">
            {hint}
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="mt-1.5 mb-0 text-[0.92rem] leading-relaxed text-[color:var(--brand-muted)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
