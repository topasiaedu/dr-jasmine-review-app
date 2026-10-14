"use client";

import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Pencil,
} from "lucide-react";
import {
  useCallback,
  useState,
  type ReactElement,
  type SVGProps,
} from "react";
import { toast } from "sonner";

import { ResultsStepFields } from "@/components/review-wizard/results-step";
import { StepHeading } from "@/components/review-wizard/step-heading";
import { StepIndicator } from "@/components/review-wizard/step-indicator";
import { StepPanel } from "@/components/review-wizard/step-panel";
import { StickyActions } from "@/components/review-wizard/sticky-actions";
import { WizardPrimaryButton } from "@/components/review-wizard/wizard-primary-button";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { BRAND } from "@/lib/brand";
import {
  ANSWER_MIN_LENGTH,
  DRAFT_MAX_LENGTH,
  DRAFT_MIN_LENGTH,
} from "@/lib/categories";
import { copyText } from "@/lib/copy-text";
import { createEmptyResult, isResultFilled } from "@/lib/metrics";
import { buildTemplateReview } from "@/lib/review-template";
import { cn } from "@/lib/utils";
import type {
  ExperienceFields,
  GenerateReviewPayload,
  GenerateReviewSuccess,
  ResultMetric,
  StepId,
} from "@/lib/types";

const EMPTY_EXPERIENCE: ExperienceFields = {
  name: "",
  struggle: "",
  change: "",
  extra: "",
};

/**
 * TEST DEFAULTS. Flip to `false` (or delete this block) before shipping.
 * Prefills guided answers and sample metrics for click-through testing.
 */
const PREFILL_FOR_TESTING = true;

/** Sample answers used only when `PREFILL_FOR_TESTING` is true. */
const TEST_EXPERIENCE: ExperienceFields = {
  name: "Mei",
  struggle:
    "diabetes for years, confusing blood sugar readings, always tired and worried about long-term medication",
  change:
    "clearer plan, less guessing about food, more energy for family walks",
  extra: "felt heard, explanations were clear, workshop was worth the time",
};

/**
 * Builds sample metric rows for easy click-through testing.
 */
function buildTestResults(): ResultMetric[] {
  const hba1c = createEmptyResult("hba1c");
  hba1c.before = "6.5%";
  hba1c.after = "5.3%";

  const weight = createEmptyResult("weight");
  weight.before = "75 kg";
  weight.after = "61 kg";

  return [hba1c, weight];
}

type FieldKey = keyof ExperienceFields;

/** Guided story fields that count toward MMC-style "one answer is enough". */
type AnswerKey = "struggle" | "change" | "extra";

type StatusKind = "ok" | "error" | "";

/**
 * Type guard for successful generate-review JSON.
 */
function isGenerateSuccess(value: unknown): value is GenerateReviewSuccess {
  if (typeof value !== "object" || value === null || !("review" in value)) {
    return false;
  }
  return typeof value.review === "string";
}

/**
 * Returns true when a guided answer has enough detail to count.
 */
function isSubstantialAnswer(value: string): boolean {
  return value.trim().length >= ANSWER_MIN_LENGTH;
}

/**
 * Guided multi-step Google review craft helper for Dr Jasmine / Metanova.
 * Flow: questions → numbers → draft (AI when available, template fallback) → post.
 */
export function ReviewWizard() {
  const [currentStep, setCurrentStep] = useState<StepId>("questions");
  const [experience, setExperience] = useState<ExperienceFields>(
    PREFILL_FOR_TESTING ? TEST_EXPERIENCE : EMPTY_EXPERIENCE
  );
  const [results, setResults] = useState<ResultMetric[]>(() =>
    PREFILL_FOR_TESTING ? buildTestResults() : []
  );
  const [invalidFields, setInvalidFields] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [draft, setDraft] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [copiedFlash, setCopiedFlash] = useState(false);
  const [questionsStatus, setQuestionsStatus] = useState({
    message: "",
    kind: "" as StatusKind,
  });
  const [resultsStatus, setResultsStatus] = useState({
    message: "",
    kind: "" as StatusKind,
  });
  const [draftStatus, setDraftStatus] = useState({
    message: "",
    kind: "" as StatusKind,
  });

  /**
   * Scrolls to top and updates the active step.
   */
  const goTo = useCallback((step: StepId) => {
    setCurrentStep(step);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  /**
   * Name plus at least one substantial guided answer (MMC-style).
   */
  const hasRequiredExperience = useCallback((): boolean => {
    const hasName = Boolean(experience.name.trim());
    const hasAnswer =
      isSubstantialAnswer(experience.struggle) ||
      isSubstantialAnswer(experience.change) ||
      isSubstantialAnswer(experience.extra);
    return hasName && hasAnswer;
  }, [experience]);

  /**
   * True when at least one result row has usable content.
   */
  const hasFilledResults = useCallback((): boolean => {
    return results.some(isResultFilled);
  }, [results]);

  /**
   * Validates name + at least one guided answer (MMC-style one-answer rule).
   */
  const validateQuestions = useCallback((): boolean => {
    const hasName = Boolean(experience.name.trim());
    const answerKeys: AnswerKey[] = ["struggle", "change", "extra"];
    const hasAnswer = answerKeys.some((key) =>
      isSubstantialAnswer(experience[key])
    );

    setInvalidFields({ name: !hasName });

    if (!hasName || !hasAnswer) {
      setQuestionsStatus({
        message:
          "Please add your name and answer at least one question (a short sentence is enough).",
        kind: "error",
      });
      return false;
    }

    setQuestionsStatus({ message: "", kind: "" });
    return true;
  }, [experience]);

  /**
   * Builds the OpenAI request payload (tone always warm).
   */
  const collectPayload = useCallback((): GenerateReviewPayload => {
    return {
      name: experience.name.trim(),
      struggle: experience.struggle.trim(),
      change: experience.change.trim(),
      extra: experience.extra.trim(),
      tone: "warm",
      results: results.filter(isResultFilled),
    };
  }, [experience, results]);

  /**
   * Applies a local template draft from the user's answers and numbers.
   * Used when the generate API is unavailable or fails.
   */
  const applyTemplateDraft = useCallback(
    (payload: GenerateReviewPayload): boolean => {
      const review = buildTemplateReview(
        {
          name: payload.name,
          struggle: payload.struggle,
          change: payload.change,
          extra: payload.extra,
        },
        payload.results
      ).trim();

      if (review.length === 0) {
        return false;
      }

      setDraft(review.slice(0, DRAFT_MAX_LENGTH));
      setResultsStatus({ message: "", kind: "" });
      setDraftStatus({ message: "", kind: "" });
      return true;
    },
    []
  );

  /**
   * Tries the generate-review API first. On missing key, 503, or any error,
   * builds a template draft locally so the flow is never blocked.
   */
  const generateDraft = useCallback(async (): Promise<boolean> => {
    if (aiBusy) {
      return false;
    }
    if (!hasRequiredExperience()) {
      setResultsStatus({
        message: "Please complete your name and at least one answer first.",
        kind: "error",
      });
      return false;
    }

    const payload = collectPayload();
    setAiBusy(true);
    setResultsStatus({ message: "Writing your review…", kind: "" });

    try {
      const res = await fetch("/api/generate-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: unknown = await res.json().catch(() => ({}));

      if (res.ok && isGenerateSuccess(data) && data.review.trim()) {
        const review = data.review.trim();
        setDraft(review.slice(0, DRAFT_MAX_LENGTH));
        setResultsStatus({ message: "", kind: "" });
        setDraftStatus({ message: "", kind: "" });
        return true;
      }

      if (applyTemplateDraft(payload)) {
        return true;
      }

      setResultsStatus({
        message: "Could not create a draft. Please check your answers and try again.",
        kind: "error",
      });
      return false;
    } catch {
      if (applyTemplateDraft(payload)) {
        return true;
      }

      setResultsStatus({
        message: "Could not create a draft. Please check your answers and try again.",
        kind: "error",
      });
      return false;
    } finally {
      setAiBusy(false);
    }
  }, [aiBusy, applyTemplateDraft, collectPayload, hasRequiredExperience]);

  /**
   * Returns the previous step for the Back control.
   */
  function previousStep(): StepId {
    if (currentStep === "results") {
      return "questions";
    }
    if (currentStep === "draft") {
      return "results";
    }
    if (currentStep === "post") {
      return "draft";
    }
    return "questions";
  }

  /**
   * Goes back one step.
   */
  function goBack(): void {
    goTo(previousStep());
  }

  /**
   * Updates one experience field and clears the name invalid flag when needed.
   */
  function updateField(key: FieldKey, value: string): void {
    setExperience((prev) => ({ ...prev, [key]: value }));
    if (key === "name") {
      setInvalidFields((prev) => ({ ...prev, name: false }));
    }
  }

  /**
   * Copies draft text and briefly flashes the copy control.
   */
  async function handleCopyOnly(): Promise<void> {
    if (!hasRequiredExperience()) {
      toast.message("Complete your name and at least one answer first");
      goTo("questions");
      return;
    }
    const text = draft.trim();
    if (text.length < DRAFT_MIN_LENGTH) {
      toast.message("Add a bit more to your review first");
      return;
    }
    const ok = await copyText(text);
    if (ok) {
      setCopiedFlash(true);
      window.setTimeout(() => setCopiedFlash(false), 1600);
    }
    toast.message(
      ok ? "Copied. Ready to paste" : "Could not copy. Select the text manually"
    );
  }

  /**
   * Copies the draft, then opens a post destination in a new tab.
   */
  async function handleCopyAndOpenDestination(
    url: string,
    destinationLabel: "Google" | "Facebook"
  ): Promise<void> {
    if (!hasRequiredExperience()) {
      toast.message("Complete your name and at least one answer first");
      goTo("questions");
      return;
    }
    const text = draft.trim();
    if (text.length < DRAFT_MIN_LENGTH) {
      return;
    }
    const ok = await copyText(text);
    toast.message(
      ok
        ? `Copied. Opening ${destinationLabel}. Paste and submit`
        : `Opening ${destinationLabel}. Copy the draft manually, then paste`
    );
    window.setTimeout(() => {
      window.open(url, "_blank", "noopener,noreferrer");
    }, 350);
  }

  const canContinueQuestions = hasRequiredExperience();
  const draftMeetsMinLength = draft.trim().length >= DRAFT_MIN_LENGTH;
  const canContinueDraft = draftMeetsMinLength && hasRequiredExperience();
  const canGenerateAi = !aiBusy;
  const canPost = draftMeetsMinLength && hasRequiredExperience();

  return (
    <div className="mx-auto w-full max-w-[560px]">
      <header className="mb-5 text-center">
        <p className="font-heading m-0 text-[0.95rem] font-bold tracking-[0.14em] text-[color:var(--brand-accent)] uppercase">
          {BRAND.clinicBrand}
        </p>
        <h1 className="font-heading mt-1.5 mb-0 overflow-visible pb-[0.04em] text-[clamp(1.75rem,5.5vw,2.15rem)] leading-[1.2] font-bold tracking-[-0.01em] text-[color:var(--brand-ink)]">
          {BRAND.shortName}
        </h1>
        <StepIndicator currentStep={currentStep} />
      </header>

      {currentStep === "questions" ? (
        <StepPanel stepKey="questions">
          <StepHeading
            number={1}
            title="Tell us how it went"
            hint="One answer is enough"
            description="The more specific, the better."
          />
          <FieldGroup className="pb-2">
            <Field data-invalid={invalidFields.name ? true : undefined}>
              <FieldLabel htmlFor="name">Your first name</FieldLabel>
              <Input
                id="name"
                type="text"
                maxLength={40}
                placeholder="e.g. Mei"
                autoComplete="given-name"
                required
                aria-required="true"
                aria-invalid={invalidFields.name ? true : undefined}
                value={experience.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
            </Field>

            <GuidedQuestion
              number={1}
              id="struggle"
              label="Before the workshop, what were you dealing with?"
              placeholder="e.g. diabetes for years, confusing blood sugar readings, always tired"
              value={experience.struggle}
              onChange={(value) => updateField("struggle", value)}
            />

            <GuidedQuestion
              number={2}
              id="change"
              label="What changed for you after the workshop?"
              placeholder="e.g. clearer plan, less guessing about food, more energy for family"
              value={experience.change}
              onChange={(value) => updateField("change", value)}
            />

            <GuidedQuestion
              number={3}
              id="extra"
              label="What stood out most?"
              hint="Optional"
              placeholder="e.g. felt heard, clear explanations, workshop was worth my time"
              value={experience.extra}
              onChange={(value) => updateField("extra", value)}
            />
          </FieldGroup>
          <StickyActions>
            <WizardPrimaryButton
              disabled={!canContinueQuestions}
              onClick={() => {
                if (!validateQuestions()) {
                  return;
                }
                setResultsStatus({ message: "", kind: "" });
                goTo("results");
              }}
            >
              Continue
            </WizardPrimaryButton>
            <p className="mt-2 mb-0 text-center text-[0.82rem] text-[color:var(--brand-muted)]">
              Answer at least one question ({ANSWER_MIN_LENGTH} characters or more).
            </p>
            <StatusLine
              message={questionsStatus.message}
              kind={questionsStatus.kind}
            />
          </StickyActions>
        </StepPanel>
      ) : null}

      {currentStep === "results" ? (
        <StepPanel stepKey="results">
          <BackButton onClick={goBack} />
          <StepHeading
            number={2}
            title="Your numbers"
            hint="Optional"
          />
          <ResultsStepFields
            results={results}
            onChange={setResults}
            statusMessage=""
            statusKind=""
          />
          <StickyActions>
            <WizardPrimaryButton
              disabled={!canGenerateAi}
              onClick={async () => {
                if (!hasRequiredExperience()) {
                  setResultsStatus({
                    message: "Please complete your name and at least one answer first.",
                    kind: "error",
                  });
                  goTo("questions");
                  return;
                }
                const ok = await generateDraft();
                if (ok) {
                  goTo("draft");
                }
              }}
            >
              {aiBusy ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Writing…
                </>
              ) : (
                "Generate my draft"
              )}
            </WizardPrimaryButton>
            {!hasFilledResults() ? (
              <p className="mt-2 mb-0 text-center text-[0.82rem] text-[color:var(--brand-muted)]">
                Numbers are optional. Generate works even if you leave this blank.
              </p>
            ) : null}
            <StatusLine
              message={resultsStatus.message}
              kind={resultsStatus.kind}
              busy={aiBusy && resultsStatus.message.startsWith("Writing")}
            />
          </StickyActions>
        </StepPanel>
      ) : null}

      {currentStep === "draft" ? (
        <StepPanel stepKey="draft">
          <BackButton onClick={goBack} />
          <StepHeading number={3} title="Your draft" />
          <div className="relative">
            <span
              className="pointer-events-none absolute top-3 right-3 z-10 inline-flex size-11 items-center justify-center rounded-full bg-[color:var(--brand-accent-soft)] text-[color:var(--brand-accent)] shadow-[0_1px_3px_rgba(28,42,36,0.12)] ring-1 ring-[color:var(--brand-line-strong)]"
              aria-hidden="true"
            >
              <Pencil className="size-5" strokeWidth={2.25} />
            </span>
            <label htmlFor="draft" className="sr-only">
              Review draft
            </label>
            <Textarea
              id="draft"
              value={draft}
              maxLength={DRAFT_MAX_LENGTH}
              placeholder="Your review draft will show here"
              autoFocus
              onChange={(event) => setDraft(event.target.value)}
              className={cn(
                "draft-editable-field min-h-[240px] resize-y rounded-[12px] border-2",
                "border-[color:var(--brand-line-strong)] bg-[#fafcfb]",
                "px-4 py-3.5 pr-[3.75rem] text-[1.05rem] leading-[1.8] text-[color:var(--brand-ink)] md:text-[1.05rem]",
                "shadow-[inset_0_2px_8px_rgba(28,42,36,0.07),0_2px_6px_rgba(28,42,36,0.05)]",
                "caret-[color:var(--brand-accent)] transition-[border-color,box-shadow] duration-200",
                "focus-visible:border-[color:var(--brand-accent)]",
                "focus-visible:ring-4 focus-visible:ring-[color:var(--brand-accent)]/30",
                "focus-visible:shadow-[inset_0_2px_8px_rgba(28,42,36,0.05),0_2px_8px_rgba(31,107,79,0.12)]"
              )}
            />
          </div>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2.5 text-[0.85rem] text-[color:var(--brand-muted)]">
            <span>
              {draft.length} / {DRAFT_MAX_LENGTH}
            </span>
            {!draftMeetsMinLength ? (
              <span>Add a little more before continuing</span>
            ) : null}
          </div>
          {/* Errors only — never show success/helper status under the draft. */}
          {draftStatus.kind === "error" && draftStatus.message ? (
            <StatusLine message={draftStatus.message} kind="error" />
          ) : null}
          <StickyActions>
            <WizardPrimaryButton
              disabled={!canContinueDraft}
              onClick={() => {
                if (!hasRequiredExperience()) {
                  toast.message("Please complete your name and at least one answer first");
                  goTo("questions");
                  return;
                }
                if (draft.trim().length < DRAFT_MIN_LENGTH) {
                  setDraftStatus({
                    message: "Add a bit more to your review before continuing.",
                    kind: "error",
                  });
                  return;
                }
                setDraftStatus({ message: "", kind: "" });
                goTo("post");
              }}
            >
              Continue to post
            </WizardPrimaryButton>
          </StickyActions>
        </StepPanel>
      ) : null}

      {currentStep === "post" ? (
        <StepPanel stepKey="post">
          <BackButton onClick={goBack} />
          <StepHeading
            number={4}
            title="Ready to post"
            description="Copy your review, open Google or Facebook, paste it, then submit."
          />

          <div className="mb-3 max-h-[160px] overflow-y-auto rounded-[10px] border border-[color:var(--brand-line)] bg-[color:var(--brand-paper)] px-3.5 py-3 text-[0.95rem] leading-relaxed text-[color:var(--brand-ink-soft)]">
            {draft.trim() || "Your draft will show here."}
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11 flex-1 border-[1.5px]"
              onClick={() => {
                void handleCopyOnly();
              }}
            >
              {copiedFlash ? (
                <>
                  <Check data-icon="inline-start" aria-hidden="true" />
                  Copied
                </>
              ) : (
                <>
                  <Copy data-icon="inline-start" aria-hidden="true" />
                  Copy text
                </>
              )}
            </Button>
          </div>

          <div className="mt-4 rounded-[10px] bg-[color:var(--brand-accent-soft)] px-3.5 py-3.5">
            <h3 className="font-heading m-0 text-[1.05rem] font-bold tracking-[-0.01em] text-[color:var(--brand-accent-deep)]">
              Last step
            </h3>
            <div className="mt-3 flex flex-col gap-2.5">
              <WizardPrimaryButton
                className="text-[1.05rem]"
                disabled={!canPost}
                onClick={() => {
                  void handleCopyAndOpenDestination(
                    BRAND.googleShareUrl,
                    "Google"
                  );
                }}
              >
                <GoogleMarkIcon data-icon="inline-start" />
                Go to Google to post
                <ExternalLink data-icon="inline-end" aria-hidden="true" />
              </WizardPrimaryButton>
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={!canPost}
                className="h-12 w-full border-[1.5px] text-[1.05rem]"
                onClick={() => {
                  void handleCopyAndOpenDestination(
                    BRAND.facebookReviewsUrl,
                    "Facebook"
                  );
                }}
              >
                <FacebookMarkIcon data-icon="inline-start" />
                Go to Facebook to post
                <ExternalLink data-icon="inline-end" aria-hidden="true" />
              </Button>
            </div>
          </div>

        </StepPanel>
      ) : null}

      <footer className="mt-7 text-center text-[0.78rem] leading-relaxed text-[color:var(--brand-muted)]">
        <p className="m-0">
          {BRAND.clinicBrand}
          {" · "}
          {BRAND.practitionerName}
        </p>
      </footer>
    </div>
  );
}

type GuidedQuestionProps = {
  number: number;
  id: string;
  label: string;
  hint?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

/**
 * MMC-style numbered question with a concrete e.g. placeholder.
 */
function GuidedQuestion({
  number,
  id,
  label,
  hint,
  placeholder,
  value,
  onChange,
}: GuidedQuestionProps): ReactElement {
  return (
    <Field>
      <div className="mb-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <FieldLabel htmlFor={id} className="text-[1rem] leading-snug">
          <span className="text-[color:var(--brand-accent)] tabular-nums">
            {number}.
          </span>{" "}
          {label}
        </FieldLabel>
        {hint ? (
          <span className="text-[0.8rem] text-[color:var(--brand-muted)]">
            {hint}
          </span>
        ) : null}
      </div>
      <Textarea
        id={id}
        maxLength={220}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[96px] bg-[color:var(--brand-paper)] text-[1rem] leading-relaxed"
      />
    </Field>
  );
}

type BrandIconProps = SVGProps<SVGSVGElement>;

/**
 * Multicolor Google "G" mark for the post destination button.
 */
function GoogleMarkIcon(props: BrandIconProps): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1.25em"
      height="1.25em"
      aria-hidden="true"
      {...props}
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

/**
 * Facebook "f" mark for the post destination button.
 */
function FacebookMarkIcon(props: BrandIconProps): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1.25em"
      height="1.25em"
      aria-hidden="true"
      {...props}
    >
      <path
        fill="#1877F2"
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953h-1.513c-1.49 0-1.955.925-1.955 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
      />
    </svg>
  );
}

type BackButtonProps = {
  onClick: () => void;
};

/**
 * Subtle back control for wizard steps after the first screen.
 */
function BackButton({ onClick }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-3 inline-flex min-h-10 items-center gap-1 border-0 bg-transparent p-0 text-[0.88rem] font-semibold text-[color:var(--brand-muted)] hover:text-[color:var(--brand-accent-deep)]"
    >
      <ArrowLeft aria-hidden="true" />
      Back
    </button>
  );
}

type StatusLineProps = {
  message: string;
  kind: StatusKind;
  busy?: boolean;
};

/**
 * Inline status under step actions.
 */
function StatusLine({ message, kind, busy = false }: StatusLineProps) {
  if (!message) {
    return <p className="mt-2.5 min-h-[1.2em] text-[0.88rem]" role="status" aria-live="polite" />;
  }

  return (
    <p
      className={cn(
        "mt-2.5 flex min-h-[1.2em] items-center gap-2 text-[0.88rem]",
        kind === "error" && "text-destructive",
        kind === "ok" && "text-[color:var(--brand-accent-deep)]",
        kind === "" && "text-[color:var(--brand-muted)]"
      )}
      role="status"
      aria-live="polite"
    >
      {busy ? <Spinner /> : null}
      {message}
    </p>
  );
}
