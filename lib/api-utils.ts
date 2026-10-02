import { createResultId, isMetricKind } from "@/lib/metrics";
import type { ResultMetric } from "@/lib/types";

/**
 * Type guard for plain objects (not arrays / null).
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Coerces an unknown value to a trimmed string capped at `max` characters.
 */
export function asText(value: unknown, max: number): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().slice(0, max);
}

/**
 * Coerces an unknown value to a list of non-empty trimmed strings (max 12).
 */
export function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

const MAX_RESULTS = 8;
const FIELD_MAX = 80;
const CUSTOM_LINE_MAX = 160;

/**
 * Normalizes an unknown payload field into a capped list of ResultMetric rows.
 * Drops empty / invalid rows. Caps at MAX_RESULTS.
 */
export function asResultList(value: unknown): ResultMetric[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const results: ResultMetric[] = [];

  for (const item of value) {
    if (results.length >= MAX_RESULTS) {
      break;
    }
    if (!isObject(item)) {
      continue;
    }

    const kindRaw = asText(item.kind, 40);
    const kind = isMetricKind(kindRaw) ? kindRaw : "other";
    const before = asText(item.before, FIELD_MAX);
    const after = asText(item.after, FIELD_MAX);
    const note = asText(item.note, FIELD_MAX);
    const customLine = asText(item.customLine, CUSTOM_LINE_MAX);
    const idRaw = asText(item.id, 64);
    const id = idRaw || createResultId();

    if (!before && !after && !note && !customLine) {
      continue;
    }

    results.push({
      id,
      kind,
      before,
      after,
      note,
      customLine,
    });
  }

  return results;
}
