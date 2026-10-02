/**
 * Writing path chosen on the first step.
 * `self` opens Google immediately (no in-app wizard).
 * `ai` runs about → results → topics → draft → post.
 */
export type PathId = "self" | "ai";

/** Wizard step identifiers. */
export type StepId = "path" | "about" | "results" | "topics" | "draft" | "post";

/** Always warm. No tone picker in the UI. */
export type ReviewTone = "warm";

/**
 * Metric kinds users can pick as chips on the Results step.
 * Keep in sync with `METRIC_PRESETS` in `lib/metrics.ts`.
 */
export type MetricKind =
  | "hba1c"
  | "weight"
  | "egfr"
  | "blood_pressure"
  | "medications"
  | "years_diabetes"
  | "years_hypertension"
  | "energy_symptoms"
  | "other";

/**
 * One structured before/after (or custom) result row.
 * Only include numbers the user actually entered.
 */
export type ResultMetric = {
  /** Client-generated row id for React keys. */
  id: string;
  kind: MetricKind;
  /** Starting value, e.g. "6.5%" or "75 kg". */
  before: string;
  /** Ending value, e.g. "5.3%" or "61 kg". */
  after: string;
  /** Legacy API field; UI no longer collects notes (always empty from the wizard). */
  note: string;
  /** Freeform full result line (overrides before/after phrasing when set). */
  customLine: string;
};

/** Identity / story fields collected before drafting. */
export type ExperienceFields = {
  name: string;
  /** What they were dealing with before care (user-facing: health concern / context). */
  struggle: string;
  /** Optional freeform "what changed" (results often cover this). */
  change: string;
  /** Optional extra note. */
  extra: string;
};

/** Payload sent to `/api/generate-review`. */
export type GenerateReviewPayload = ExperienceFields & {
  topics: string[];
  tone: ReviewTone;
  /** Structured results / numbers the user provided. */
  results: ResultMetric[];
};

/** Topic chip used for AI guidance when drafting. */
export type ReviewCategory = {
  id: string;
  label: string;
  lines: readonly [string, string];
};

/** Successful AI generation response. */
export type GenerateReviewSuccess = {
  review: string;
};

/** API error shape. */
export type ApiErrorBody = {
  error: string;
};

/** Health check response. */
export type HealthResponse = {
  ok: boolean;
  hasKey: boolean;
  model: string;
  brand: string;
};
