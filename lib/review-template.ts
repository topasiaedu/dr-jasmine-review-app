import { BRAND, stripEmEnDashPunctuation } from "@/lib/brand";
import { DRAFT_MAX_LENGTH } from "@/lib/categories";
import { formatResultLines } from "@/lib/metrics";
import type { ExperienceFields, ResultMetric } from "@/lib/types";

/** Warm first-person openings for local template drafts. */
const OPENINGS: readonly string[] = [
  `I am so grateful for ${BRAND.shortName}'s care.`,
  `Wonderful experience with ${BRAND.practitionerName}.`,
  `Happy to recommend ${BRAND.shortName}.`,
];

/** Warm closings for local template drafts. */
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
 * Builds a warm first-person sentence from the "before" answer.
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
 * Builds a warm first-person sentence from the "what changed" answer.
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
 * Builds a warm first-person sentence from the optional "stood out" answer.
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
 * Builds a local starter review from name, guided answers, and optional metrics.
 * Used when OpenAI is unavailable or the generate API fails.
 * Warm tone, first person, no dash punctuation, brand guardrails only.
 */
export function buildTemplateReview(
  experience: ExperienceFields,
  results: readonly ResultMetric[] = [],
  variantSeed: number = Date.now()
): string {
  const struggle = craftStruggleSentence(experience.struggle);
  const change = craftChangeSentence(experience.change);
  const extra = craftExtraSentence(experience.extra);
  const resultLines = formatResultLines(results);
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

  if (
    storyParts.length === 0 &&
    resultLines.length === 0
  ) {
    const fallback = [opening, closing].filter((part) => part.length > 0).join(" ");
    return stripEmEnDashPunctuation(fallback).slice(0, DRAFT_MAX_LENGTH);
  }

  const parts: string[] = [];
  if (opening) {
    parts.push(opening);
  }
  parts.push(...storyParts);

  if (resultLines.length > 0) {
    parts.push("Here are my results:");
    parts.push(
      resultLines
        .map((line, index) => `${index + 1}. ${line}`)
        .join(" ")
    );
  }

  if (closing) {
    parts.push(closing);
  }

  if (name) {
    parts.push(name);
  }

  const draft = parts.join(" ").replace(/\s{2,}/g, " ").trim();
  return stripEmEnDashPunctuation(draft).slice(0, DRAFT_MAX_LENGTH);
}
