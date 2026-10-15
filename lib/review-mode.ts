import type { ExperienceFields, ReviewEditMode } from "@/lib/types";

/**
 * Combined trimmed length of struggle + change + extra that triggers light-touch.
 * Name is excluded. ~250 sits in the middle of a 220–280 range so short/sparse
 * notes still get full craft, while already-substantial stories are preserved.
 */
export const LIGHT_EDIT_COMBINED_THRESHOLD = 250;

/**
 * Any one story field at or above this length also triggers light-touch,
 * even if the other fields are empty (near the 220-char field cap).
 */
export const LIGHT_EDIT_SINGLE_FIELD_THRESHOLD = 180;

/**
 * Combined trimmed character count for guided story answers (name excluded).
 */
export function combinedStoryLength(experience: Pick<
  ExperienceFields,
  "struggle" | "change" | "extra"
>): number {
  return (
    experience.struggle.trim().length +
    experience.change.trim().length +
    experience.extra.trim().length
  );
}

/**
 * Longest single trimmed story field length (name excluded).
 */
export function longestStoryFieldLength(experience: Pick<
  ExperienceFields,
  "struggle" | "change" | "extra"
>): number {
  return Math.max(
    experience.struggle.trim().length,
    experience.change.trim().length,
    experience.extra.trim().length
  );
}

/**
 * Resolves craft vs light-edit mode from how much the person already wrote.
 * Light-touch only when answers are already substantial, not for short notes.
 */
export function resolveReviewEditMode(experience: Pick<
  ExperienceFields,
  "struggle" | "change" | "extra"
>): ReviewEditMode {
  const combined = combinedStoryLength(experience);
  const longest = longestStoryFieldLength(experience);

  if (
    combined >= LIGHT_EDIT_COMBINED_THRESHOLD ||
    longest >= LIGHT_EDIT_SINGLE_FIELD_THRESHOLD
  ) {
    return "light";
  }

  return "craft";
}

/**
 * Type guard for optional client-sent edit mode.
 */
export function isReviewEditMode(value: unknown): value is ReviewEditMode {
  return value === "craft" || value === "light";
}
