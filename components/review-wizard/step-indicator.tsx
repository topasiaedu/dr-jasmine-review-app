"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { StepId } from "@/lib/types";

type StepDef = {
  id: StepId;
  /** Human-readable title for accessibility / aria text. */
  title: string;
};

/**
 * Ordered step definitions for the guided review flow.
 * questions → results → draft → post.
 */
export function getStepDefs(): StepDef[] {
  return [
    { id: "questions", title: "Your experience" },
    { id: "results", title: "Your numbers" },
    { id: "draft", title: "Your draft" },
    { id: "post", title: "Ready to post" },
  ];
}

type StepIndicatorProps = {
  currentStep: StepId;
};

/**
 * Slim progress track for the guided flow (MMC-style calm pacing).
 * Detailed numbered titles live inside each step card via StepHeading.
 */
export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const defs = getStepDefs();
  const currentIndex = Math.max(
    0,
    defs.findIndex((def) => def.id === currentStep)
  );
  const total = defs.length;
  const stepNumber = currentIndex + 1;
  const currentTitle = defs[currentIndex]?.title ?? "Your experience";
  /** Percent complete for the bar (step 1 of N → small fill; last step → 100). */
  const percent = Math.round((stepNumber / total) * 100);

  return (
    <div className="mx-auto mt-4 w-full max-w-[280px]" aria-label="Steps">
      <Progress
        value={percent}
        className={cn(
          "w-full gap-1.5",
          "[&_[data-slot=progress-track]]:h-1.5",
          "[&_[data-slot=progress-track]]:bg-[color:var(--brand-accent-soft)]",
          "[&_[data-slot=progress-indicator]]:bg-[color:var(--brand-accent)]"
        )}
        getAriaValueText={() =>
          `Step ${stepNumber} of ${total}: ${currentTitle}`
        }
      >
        <p className="m-0 w-full text-center text-[0.8rem] font-medium text-[color:var(--brand-muted)]">
          {`Step ${stepNumber} of ${total}`}
        </p>
      </Progress>
    </div>
  );
}
