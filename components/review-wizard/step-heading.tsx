import type { ReactElement } from "react";

import { cn } from "@/lib/utils";

type StepHeadingProps = {
  /**
   * Optional 1-based step number shown in the accent label.
   * Omit when the card heading should not show a wizard step numeral.
   */
  number?: number;
  /**
   * Text shown before the number (e.g. "Step " → "Step 1").
   * Ignored when `number` is omitted.
   */
  numberPrefix?: string;
  /** Short section title (one job). */
  title: string;
  /** Optional hand-holding hint (right-aligned on wider screens). */
  hint?: string;
  /** Supporting sentence under the title row. */
  description?: string;
  /**
   * Heading level for the title. Use h3 for nested action steps inside a panel.
   * Defaults to h2.
   */
  heading?: "h2" | "h3";
  /** Slightly larger numeral + title for elderly-friendly nested steps. */
  emphasize?: boolean;
  className?: string;
};

/**
 * MMC-inspired numbered section heading: accent numeral, title, optional hint.
 * Keeps a single job clear at the top of each wizard card.
 */
export function StepHeading({
  number,
  numberPrefix = "",
  title,
  hint,
  description,
  heading = "h2",
  emphasize = false,
  className,
}: StepHeadingProps): ReactElement {
  const TitleTag = heading;
  const showNumber = typeof number === "number";

  return (
    <div className={cn("mb-3.5", className)}>
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        {showNumber ? (
          <span
            className={cn(
              "font-heading font-bold leading-none text-[color:var(--brand-accent)] tabular-nums",
              emphasize ? "text-[1.45rem]" : "text-[1.25rem]"
            )}
            aria-hidden="true"
          >
            {[numberPrefix, String(number)].join("")}
          </span>
        ) : null}
        <TitleTag
          className={cn(
            "m-0 font-bold tracking-[-0.01em] text-[color:var(--brand-ink)]",
            emphasize ? "text-[1.2rem]" : "text-[1.12rem]"
          )}
        >
          {title}
        </TitleTag>
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
