import type { MetricKind, ResultMetric } from "@/lib/types";

/** Preset chip shown on the Results step. */
export type MetricPreset = {
  kind: MetricKind;
  label: string;
  /** Short hint under before/after fields. */
  hint: string;
  beforePlaceholder: string;
  afterPlaceholder: string;
  /** Placeholder for the freeform "Something else" field only. */
  notePlaceholder?: string;
};

/** Shown first on the Results step (most common). */
export const PRIMARY_METRIC_KINDS: readonly MetricKind[] = [
  "hba1c",
  "weight",
  "medications",
  "blood_pressure",
  "other",
];

/** Shown after tapping "More options". */
export const MORE_METRIC_KINDS: readonly MetricKind[] = [
  "egfr",
  "years_diabetes",
  "years_hypertension",
  "energy_symptoms",
];

/**
 * Common metric presets for diabetes / metabolic program reviews.
 * Primary kinds are listed first for the simplified Results UI.
 */
export const METRIC_PRESETS: readonly MetricPreset[] = [
  {
    kind: "hba1c",
    label: "HbA1c",
    hint: "Blood sugar average from your lab test. Use percent.",
    beforePlaceholder: "6.5%",
    afterPlaceholder: "5.3%",
  },
  {
    kind: "weight",
    label: "Weight",
    hint: "Your weight in kg before and after.",
    beforePlaceholder: "75 kg",
    afterPlaceholder: "61 kg",
  },
  {
    kind: "medications",
    label: "Medications",
    hint: "How many pills or types before and after.",
    beforePlaceholder: "9 types",
    afterPlaceholder: "1 tablet",
  },
  {
    kind: "blood_pressure",
    label: "Blood pressure",
    hint: "Reading or a short note, before and after.",
    beforePlaceholder: "High, on meds",
    afterPlaceholder: "Below 120/80",
  },
  {
    kind: "other",
    label: "Something else",
    hint: "Write one result in your own words.",
    beforePlaceholder: "",
    afterPlaceholder: "",
    notePlaceholder: "e.g. clothing size 4XL down to M",
  },
  {
    kind: "egfr",
    label: "Kidney function (eGFR)",
    hint: "Kidney test number from your lab. Higher is usually better.",
    beforePlaceholder: "59",
    afterPlaceholder: "79",
  },
  {
    kind: "years_diabetes",
    label: "Years with diabetes",
    hint: "How long you had it, then what changed.",
    beforePlaceholder: "21 years",
    afterPlaceholder: "Reversed",
  },
  {
    kind: "years_hypertension",
    label: "Years with high blood pressure",
    hint: "How long, then what changed.",
    beforePlaceholder: "8 years",
    afterPlaceholder: "Normal now",
  },
  {
    kind: "energy_symptoms",
    label: "Energy and how you feel",
    hint: "Before the program and now.",
    beforePlaceholder: "Tired, numb feet",
    afterPlaceholder: "Much more energy",
  },
];

/**
 * Presets for the first row of add buttons on the Results step.
 */
export function getPrimaryMetricPresets(): MetricPreset[] {
  return PRIMARY_METRIC_KINDS.map((kind) => getMetricPreset(kind));
}

/**
 * Presets hidden behind "More options" on the Results step.
 */
export function getMoreMetricPresets(): MetricPreset[] {
  return MORE_METRIC_KINDS.map((kind) => getMetricPreset(kind));
}

/**
 * Looks up a preset by metric kind.
 */
export function getMetricPreset(kind: MetricKind): MetricPreset {
  const found = METRIC_PRESETS.find((preset) => preset.kind === kind);
  if (found) {
    return found;
  }
  const other = METRIC_PRESETS.find((preset) => preset.kind === "other");
  if (other) {
    return other;
  }
  return {
    kind: "other",
    label: "Something else",
    hint: "Write one result in your own words.",
    beforePlaceholder: "",
    afterPlaceholder: "",
    notePlaceholder: "e.g. clothing size 4XL down to M",
  };
}

/**
 * Creates a new empty result row for the given kind.
 */
export function createEmptyResult(kind: MetricKind): ResultMetric {
  return {
    id: createResultId(),
    kind,
    before: "",
    after: "",
    note: "",
    customLine: "",
  };
}

/**
 * Generates a unique id for a result row (client-safe).
 */
export function createResultId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `result-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

/**
 * True when a result row has enough content to include in a review.
 */
export function isResultFilled(result: ResultMetric): boolean {
  return Boolean(
    result.before.trim() ||
      result.after.trim() ||
      result.note.trim() ||
      result.customLine.trim()
  );
}

/**
 * Formats one result into a short phrase for prompts and templates.
 * Returns empty string when the row has no usable content.
 */
export function formatResultLine(result: ResultMetric): string {
  const custom = result.customLine.trim();
  if (custom) {
    return custom;
  }

  const preset = getMetricPreset(result.kind);
  const before = result.before.trim();
  const after = result.after.trim();
  const label = preset.label;

  if (before && after) {
    return `${label}: ${before} to ${after}`;
  }
  if (before) {
    return `${label}: ${before}`;
  }
  if (after) {
    return `${label}: ${after}`;
  }
  return "";
}

/**
 * Formats all filled results as bullet-ready lines.
 */
export function formatResultLines(results: readonly ResultMetric[]): string[] {
  return results
    .map((result) => formatResultLine(result))
    .filter((line) => line.length > 0);
}

/**
 * Allowed metric kind strings for API validation.
 */
export const METRIC_KIND_SET: ReadonlySet<string> = new Set(
  METRIC_PRESETS.map((preset) => preset.kind)
);

/**
 * Type guard for MetricKind.
 */
export function isMetricKind(value: string): value is MetricKind {
  return METRIC_KIND_SET.has(value);
}
