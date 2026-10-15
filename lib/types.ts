/** Wizard step identifiers for the guided AI review flow. */
export type StepId = "questions" | "results" | "draft" | "post";

/** Always warm. No tone picker in the UI. */
export type ReviewTone = "warm";

/**
 * How the model (or template) should shape the draft.
 * - craft: write a warm coherent review from short/sparse notes (default).
 * - light: polish grammar/flow only when the person already wrote a lot.
 */
export type ReviewEditMode = "craft" | "light";

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

/**
 * Guided story answers collected before drafting.
 * Maps to MMC-style numbered prompts in the Questions step.
 */
export type ExperienceFields = {
  name: string;
  /** Q1: Before the workshop, what were you dealing with? */
  struggle: string;
  /** Q2: What changed for you? */
  change: string;
  /** Q3: What stood out most? (optional) */
  extra: string;
};

/** Payload sent to `/api/generate-review`. */
export type GenerateReviewPayload = ExperienceFields & {
  tone: ReviewTone;
  /** Structured results / numbers the user provided. */
  results: ResultMetric[];
  /**
   * Optional client hint. Server re-derives from story length when omitted
   * or when the hint disagrees with the substantial-text heuristic.
   */
  editMode?: ReviewEditMode;
};

/** Successful AI generation response. */
export type GenerateReviewSuccess = {
  review: string;
};

/** API error shape. */
export type ApiErrorBody = {
  error: string;
};
