"use client";

import { Progress, ProgressLabel } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { PathId, StepId } from "@/lib/types";

type StepDef = {
  id: StepId;
  /** Human-readable title shown above the progress bar. */
  title: string;
};

/**
 * Returns ordered step definitions for the AI writing path.
 * Progress is hidden until "Help me write it" is chosen.
 * AI steps: about → results → topics → draft → post.
 * Self path exits to Google and never uses these defs.
 */
export function getStepDefs(path: PathId | null): StepDef[] {
  if (path === "ai") {
    return [
      { id: "about", title: "About you" },
      { id: "results", title: "Your results" },
      { id: "topics", title: "What stood out" },
      { id: "draft", title: "Draft your review" },
      { id: "post", title: "Ready to post" },
    ];
  }

  return [];
}

type StepIndicatorProps = {
  path: PathId | null;
  currentStep: StepId;
};

/**
 * Progress bar + current step title for the guided AI review flow.
 * On the path chooser (before AI is selected), only shows "Get started".
 */
export function StepIndicator({ path, currentStep }: StepIndicatorProps) {
  const defs = getStepDefs(path);

  /** Path chooser / self exit: no multi-step progress yet. */
  if (path !== "ai" || defs.length === 0) {
    return (
      <div className="mt-3.5 w-full" aria-label="Get started">
        <p className="m-0 text-[1.05rem] font-bold tracking-[-0.01em] text-[color:var(--brand-accent-deep)]">
          Get started
        </p>
      </div>
    );
  }

  const currentIndex = Math.max(
    0,
    defs.findIndex((def) => def.id === currentStep)
  );
  const total = defs.length;
  const stepNumber = currentIndex + 1;
  const currentTitle = defs[currentIndex]?.title ?? "About you";
  /** Percent complete for the bar (step 1 of N → small fill; last step → 100). */
  const percent = Math.round((stepNumber / total) * 100);

  return (
    <div className="mt-3.5 w-full" aria-label="Steps">
      <Progress
        value={percent}
        className={cn(
          "w-full gap-2",
          "[&_[data-slot=progress-track]]:h-1.5",
          "[&_[data-slot=progress-track]]:bg-[color:var(--brand-accent-soft)]",
          "[&_[data-slot=progress-indicator]]:bg-[color:var(--brand-accent)]"
        )}
        getAriaValueText={() =>
          `Step ${stepNumber} of ${total}: ${currentTitle}`
        }
      >
        <div className="flex w-full min-w-0 flex-col gap-1">
          <ProgressLabel className="text-[1.05rem] font-bold tracking-[-0.01em] text-[color:var(--brand-accent-deep)]">
            {currentTitle}
          </ProgressLabel>
          <p className="m-0 text-[0.8rem] text-[color:var(--brand-muted)]">
            {`Step ${stepNumber} of ${total}`}
          </p>
        </div>
      </Progress>
    </div>
  );
}
