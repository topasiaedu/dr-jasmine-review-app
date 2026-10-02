import { CATEGORIES, CLOSINGS, OPENINGS } from "@/lib/categories";
import { formatResultLines } from "@/lib/metrics";
import type { ExperienceFields, ResultMetric } from "@/lib/types";

/**
 * Builds a local starter-template review from experience fields,
 * selected topics, and optional structured results.
 * Used on the self-write path only (not AI).
 */
export function buildTemplateReview(
  experience: ExperienceFields,
  selectedIds: ReadonlySet<string>,
  variantSeed: number,
  results: readonly ResultMetric[] = []
): string {
  const chosen = CATEGORIES.filter((category) => selectedIds.has(category.id));
  const extras: string[] = [];
  const struggle = experience.struggle.trim();
  const change = experience.change.trim();
  const extra = experience.extra.trim();
  const resultLines = formatResultLines(results);

  if (struggle) {
    extras.push(`I was dealing with ${struggle.toLowerCase()}.`);
  }
  if (change) {
    extras.push(`What changed for me: ${change}.`);
  }
  if (extra) {
    extras.push(extra.endsWith(".") ? extra : `${extra}.`);
  }

  if (chosen.length === 0 && extras.length === 0 && resultLines.length === 0) {
    const openingIndex = variantSeed % OPENINGS.length;
    const closingIndex = variantSeed % CLOSINGS.length;
    const opening = OPENINGS[openingIndex];
    const closing = CLOSINGS[closingIndex];
    if (typeof opening === "string" && typeof closing === "string") {
      return `${opening} ${closing}`;
    }
    return "";
  }

  const body = chosen.map((category, index) => {
    const lineIndex = (variantSeed + index) % category.lines.length;
    return category.lines[lineIndex];
  });

  const openingIndex = variantSeed % OPENINGS.length;
  const opening = OPENINGS[openingIndex];
  if (typeof opening !== "string") {
    return "";
  }

  const parts: string[] = [opening, ...extras];

  if (resultLines.length > 0) {
    parts.push("Here are my results:");
    parts.push(
      resultLines.map((line, index) => `${index + 1}. ${line}`).join(" ")
    );
  }

  parts.push(...body);

  if (chosen.length + extras.length + resultLines.length <= 5) {
    const closingIndex = variantSeed % CLOSINGS.length;
    const closing = CLOSINGS[closingIndex];
    if (typeof closing === "string") {
      parts.push(closing);
    }
  }

  const name = experience.name.trim();
  if (name) {
    parts.push(name);
  }

  return parts.join(" ");
}
