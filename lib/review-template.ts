import { BRAND, stripEmEnDashPunctuation } from "@/lib/brand";
import { DRAFT_MAX_LENGTH } from "@/lib/categories";
import { formatResultLines } from "@/lib/metrics";
import { resolveReviewEditMode } from "@/lib/review-mode";
import type {
  ExperienceFields,
  ResultMetric,
  ReviewEditMode,
} from "@/lib/types";

/** Warm first-person openings for local template drafts (craft mode). */
const OPENINGS: readonly string[] = [
  `I am so grateful for ${BRAND.shortName}'s care.`,
  `Wonderful experience with ${BRAND.practitionerName}.`,
  `Happy to recommend ${BRAND.shortName}.`,
];

/** Warm closings for local template drafts (craft mode). */
const CLOSINGS: readonly string[] = [
  "I would warmly recommend her to anyone who wants real clarity.",
  `Thank you, ${BRAND.shortName}. Highly recommended.`,
];

/**
 * Ensures a fragment ends with sentence punctuation.
 */
function ensureSentence(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return "";
  }

  const capitalized =
    trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  if (/[.!?]$/.test(capitalized)) {
    return capitalized;
  }
  return `${capitalized}.`;
}

/**
 * Builds a warm first-person sentence from the "before" answer (craft mode).
 */
function craftStruggleSentence(struggle: string): string {
  const trimmed = struggle.trim();
  if (trimmed.length === 0) {
    return "";
  }

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("i was") ||
    lower.startsWith("i've") ||
    lower.startsWith("i have") ||
    lower.startsWith("before")
  ) {
    return ensureSentence(trimmed);
  }

  return ensureSentence(`Before the workshop, I was dealing with ${lower}`);
}

/**
 * Builds a warm first-person sentence from the "what changed" answer (craft mode).
 */
function craftChangeSentence(change: string): string {
  const trimmed = change.trim();
  if (trimmed.length === 0) {
    return "";
  }

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("i ") ||
    lower.startsWith("what changed") ||
    lower.startsWith("after")
  ) {
    return ensureSentence(trimmed);
  }

  return ensureSentence(`After the workshop, ${lower}`);
}

/**
 * Builds a warm first-person sentence from the optional "stood out" answer (craft mode).
 */
function craftExtraSentence(extra: string): string {
  const trimmed = extra.trim();
  if (trimmed.length === 0) {
    return "";
  }

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("i ") ||
    lower.startsWith("what stood") ||
    lower.startsWith("she ") ||
    lower.startsWith("dr ")
  ) {
    return ensureSentence(trimmed);
  }

  return ensureSentence(`What stood out most: ${lower}`);
}

/**
 * Light cleanup: keep the user's wording, only capitalize and punctuate.
 */
function lightCleanupSentence(text: string): string {
  return ensureSentence(text);
}

/**
 * Picks a stable opening/closing index from a seed.
 */
function pickIndex(seed: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  const normalized = Math.abs(Math.floor(seed));
  return normalized % length;
}

/**
 * Appends optional results and name sign-off to an assembled draft body.
 */
function appendResultsAndSignOff(
  parts: string[],
  resultLines: readonly string[],
  name: string,
  closing: string
): string {
  const assembled = [...parts];

  if (resultLines.length > 0) {
    assembled.push("Here are my results:");
    assembled.push(
      resultLines
        .map((line, index) => `${index + 1}. ${line}`)
        .join(" ")
    );
  }

  if (closing) {
    assembled.push(closing);
  }

  if (name) {
    assembled.push(name);
  }

  const draft = assembled.join(" ").replace(/\s{2,}/g, " ").trim();
  return stripEmEnDashPunctuation(draft).slice(0, DRAFT_MAX_LENGTH);
}

/**
 * Stitches substantial user answers with light cleanup (template light-touch).
 */
function buildLightTemplateReview(
  experience: ExperienceFields,
  resultLines: readonly string[]
): string {
  const storyParts: string[] = [];
  if (experience.struggle.trim()) {
    storyParts.push(lightCleanupSentence(experience.struggle));
  }
  if (experience.change.trim()) {
    storyParts.push(lightCleanupSentence(experience.change));
  }
  if (experience.extra.trim()) {
    storyParts.push(lightCleanupSentence(experience.extra));
  }

  const name = experience.name.trim();

  if (storyParts.length === 0 && resultLines.length === 0) {
    const fallback = `Happy to recommend ${BRAND.shortName}.`;
    return stripEmEnDashPunctuation(fallback).slice(0, DRAFT_MAX_LENGTH);
  }

  return appendResultsAndSignOff(storyParts, resultLines, name, "");
}

/**
 * Fuller template craft for short or sparse notes (opening + wrapped sentences + closing).
 */
function buildCraftTemplateReview(
  experience: ExperienceFields,
  resultLines: readonly string[],
  variantSeed: number
): string {
  const struggle = craftStruggleSentence(experience.struggle);
  const change = craftChangeSentence(experience.change);
  const extra = craftExtraSentence(experience.extra);
  const name = experience.name.trim();

  const openingIndex = pickIndex(variantSeed, OPENINGS.length);
  const closingIndex = pickIndex(variantSeed + 1, CLOSINGS.length);
  const opening = OPENINGS[openingIndex] ?? OPENINGS[0] ?? "";
  const closing = CLOSINGS[closingIndex] ?? CLOSINGS[0] ?? "";

  const storyParts: string[] = [];
  if (struggle) {
    storyParts.push(struggle);
  }
  if (change) {
    storyParts.push(change);
  }
  if (extra) {
    storyParts.push(extra);
  }

  if (storyParts.length === 0 && resultLines.length === 0) {
    const fallback = [opening, closing].filter((part) => part.length > 0).join(" ");
    return stripEmEnDashPunctuation(fallback).slice(0, DRAFT_MAX_LENGTH);
  }

  const parts: string[] = [];
  if (opening) {
    parts.push(opening);
  }
  parts.push(...storyParts);

  return appendResultsAndSignOff(parts, resultLines, name, closing);
}

/**
 * Builds a local starter review from name, guided answers, and optional metrics.
 * Used when OpenAI is unavailable or the generate API fails.
 * Substantial answers get a light stitch/cleanup; short notes get fuller craft.
 */
export function buildTemplateReview(
  experience: ExperienceFields,
  results: readonly ResultMetric[] = [],
  variantSeed: number = Date.now(),
  editMode?: ReviewEditMode
): string {
  const mode = editMode ?? resolveReviewEditMode(experience);
  const resultLines = formatResultLines(results);

  if (mode === "light") {
    return buildLightTemplateReview(experience, resultLines);
  }

  return buildCraftTemplateReview(experience, resultLines, variantSeed);
}
