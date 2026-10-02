"use client";

import { ArrowLeft, PenLine, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ResultsStepFields } from "@/components/review-wizard/results-step";
import { StepIndicator } from "@/components/review-wizard/step-indicator";
import { StepPanel } from "@/components/review-wizard/step-panel";
import { WizardPrimaryButton } from "@/components/review-wizard/wizard-primary-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { BRAND } from "@/lib/brand";
import {
  CATEGORIES,
  DRAFT_MAX_LENGTH,
  DRAFT_MIN_LENGTH,
} from "@/lib/categories";
import { copyText } from "@/lib/copy-text";
import { createEmptyResult, isResultFilled } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import type {
  ApiErrorBody,
  ExperienceFields,
  GenerateReviewPayload,
  GenerateReviewSuccess,
  HealthResponse,
  PathId,
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
 * Prefills experience fields, sample metrics, and a few AI topic chips.
 */
const PREFILL_FOR_TESTING = true;

/** Sample answers used only when `PREFILL_FOR_TESTING` is true. */
const TEST_EXPERIENCE: ExperienceFields = {
  name: "Mei",
  struggle:
    "confusing blood sugar readings, low energy, worried about long-term medication",
  change: "clearer plan, less guessing, more energy for family",
  extra: "felt heard, workshop was worth the time",
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

/** Sample topic chip ids (see `CATEGORIES`) used only when prefilling. */
const TEST_TOPIC_IDS: readonly string[] = [
  "clarity",
  "care",
  "results",
];

type FieldKey = keyof ExperienceFields;

type StatusKind = "ok" | "error" | "";

/**
 * Type guard for API error JSON.
 */
function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null || !("error" in value)) {
    return false;
  }
  return typeof value.error === "string";
}

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
 * Type guard for health-check JSON.
 */
function isHealthResponse(value: unknown): value is HealthResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return (
    "ok" in value &&
    typeof value.ok === "boolean" &&
    "hasKey" in value &&
    typeof value.hasKey === "boolean"
  );
}

/**
 * Guided multi-step Google review craft helper for Dr Jasmine / Metanova.
 */
export function ReviewWizard() {
  const [path, setPath] = useState<PathId | null>(null);
  const [currentStep, setCurrentStep] = useState<StepId>("path");
  const [experience, setExperience] = useState<ExperienceFields>(
    PREFILL_FOR_TESTING ? TEST_EXPERIENCE : EMPTY_EXPERIENCE
  );
  const [results, setResults] = useState<ResultMetric[]>(() =>
    PREFILL_FOR_TESTING ? buildTestResults() : []
  );
  const [invalidFields, setInvalidFields] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(
    () => new Set(PREFILL_FOR_TESTING ? TEST_TOPIC_IDS : [])
  );
  const [draft, setDraft] = useState("");
  const [aiReady, setAiReady] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aboutStatus, setAboutStatus] = useState({ message: "", kind: "" as StatusKind });
  const [resultsStatus, setResultsStatus] = useState({ message: "", kind: "" as StatusKind });
  const [topicsStatus, setTopicsStatus] = useState({ message: "", kind: "" as StatusKind });
  const [draftStatus, setDraftStatus] = useState({ message: "", kind: "" as StatusKind });

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
   * Name + what they were dealing with are required; change/extra are optional.
   */
  const hasRequiredExperience = useCallback((): boolean => {
    return Boolean(experience.name.trim() && experience.struggle.trim());
  }, [experience]);

  /**
   * True when at least one result row has usable content.
   */
  const hasFilledResults = useCallback((): boolean => {
    return results.some(isResultFilled);
  }, [results]);

  /**
   * Validates identity / story fields and marks empties as invalid.
   */
  const validateExperience = useCallback((): boolean => {
    const nextInvalid: Partial<Record<FieldKey, boolean>> = {
      name: !experience.name.trim(),
      struggle: !experience.struggle.trim(),
    };
    setInvalidFields(nextInvalid);

    const ok = !Object.values(nextInvalid).some(Boolean);
    if (!ok) {
      setAboutStatus({
        message: "Please add your name and what you were dealing with to continue.",
        kind: "error",
      });
    } else {
      setAboutStatus({ message: "", kind: "" });
    }
    return ok;
  }, [experience]);

  /**
   * Probes `/api/health` when the AI path is selected.
   */
  const checkAiHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health", { method: "GET" });
      if (!res.ok) {
        throw new Error(`health ${res.status}`);
      }
      const data: unknown = await res.json();
      if (!isHealthResponse(data)) {
        throw new Error("invalid health payload");
      }
      const ready = Boolean(data.ok && data.hasKey);
      setAiReady(ready);
      if (data.ok && !data.hasKey) {
        setTopicsStatus({
          message: "Server is up, but no OpenAI key is set yet.",
          kind: "error",
        });
      }
    } catch {
      setAiReady(false);
    }
  }, []);

  useEffect(() => {
    if (path === "ai") {
      void checkAiHealth();
    }
  }, [path, checkAiHealth]);

  /**
   * Builds the OpenAI request payload (tone always warm).
   */
  const collectPayload = useCallback((): GenerateReviewPayload => {
    const topicLabels = CATEGORIES.filter((category) =>
      selectedTopics.has(category.id)
    ).map((category) => category.label);

    return {
      name: experience.name.trim(),
      struggle: experience.struggle.trim(),
      change: experience.change.trim(),
      extra: experience.extra.trim(),
      topics: topicLabels,
      tone: "warm",
      results: results.filter(isResultFilled),
    };
  }, [experience, results, selectedTopics]);

  /**
   * Calls the generate-review API and fills the draft on success.
   */
  const writeWithAi = useCallback(async (): Promise<boolean> => {
    if (!aiReady || aiBusy) {
      return false;
    }
    if (!hasRequiredExperience()) {
      setTopicsStatus({
        message: "Please complete your name and context first.",
        kind: "error",
      });
      return false;
    }

    setAiBusy(true);
    setTopicsStatus({ message: "Writing your review…", kind: "" });

    try {
      const res = await fetch("/api/generate-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(collectPayload()),
      });

      const data: unknown = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage = isApiErrorBody(data)
          ? data.error
          : `Request failed (${res.status})`;
        throw new Error(errorMessage);
      }

      if (!isGenerateSuccess(data) || !data.review.trim()) {
        throw new Error("AI returned an empty review");
      }

      const review = data.review.trim();
      setDraft(review.slice(0, DRAFT_MAX_LENGTH));
      const okMessage = "Draft ready. Edit anything that does not sound like you.";
      setTopicsStatus({ message: okMessage, kind: "ok" });
      setDraftStatus({ message: okMessage, kind: "ok" });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not generate review";
      setTopicsStatus({ message, kind: "error" });
      return false;
    } finally {
      setAiBusy(false);
    }
  }, [aiBusy, aiReady, collectPayload, hasRequiredExperience]);

  /**
   * Self path: open Google in a new tab and stay on start (no in-app draft).
   * AI path: begin the guided about → results → topics → draft → post flow.
   */
  function choosePath(nextPath: PathId): void {
    if (nextPath === "self") {
      toast.message("Opening Google… Write your review there.");
      window.setTimeout(() => {
        window.open(BRAND.googleShareUrl, "_blank", "noopener,noreferrer");
      }, 350);
      return;
    }
    setPath("ai");
    goTo("about");
  }

  /**
   * Returns the previous step for the Back control (AI path only).
   */
  function previousStep(): StepId {
    if (currentStep === "about") {
      return "path";
    }
    if (currentStep === "results") {
      return "about";
    }
    if (currentStep === "topics") {
      return "results";
    }
    if (currentStep === "draft") {
      return "topics";
    }
    if (currentStep === "post") {
      return "draft";
    }
    return "path";
  }

  /**
   * Goes back one step; clearing the AI path when returning to the chooser.
   */
  function goBack(): void {
    const prev = previousStep();
    if (prev === "path") {
      setPath(null);
    }
    goTo(prev);
  }

  /**
   * Updates one experience field and clears its invalid flag.
   */
  function updateField(key: FieldKey, value: string): void {
    setExperience((prev) => ({ ...prev, [key]: value }));
    setInvalidFields((prev) => ({ ...prev, [key]: false }));
  }

  /**
   * Toggles a topic chip on the AI path.
   */
  function toggleTopic(id: string): void {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const canContinueAbout = hasRequiredExperience();
  const draftMeetsMinLength = draft.trim().length >= DRAFT_MIN_LENGTH;
  const canContinueDraft = draftMeetsMinLength && hasRequiredExperience();
  const canGenerateAi = aiReady && !aiBusy;
  const canPost = draftMeetsMinLength && hasRequiredExperience();

  return (
    <div className="mx-auto w-full max-w-[560px]">
      <header className="mb-[18px]">
        <p className="mb-1.5 text-[0.8rem] font-bold tracking-[0.06em] text-[color:var(--brand-accent-deep)] uppercase">
          {BRAND.clinicBrand}
        </p>
        <p className="font-heading mb-2 overflow-visible pb-[0.06em] text-[clamp(1.7rem,5.5vw,2.1rem)] leading-[1.25] font-bold tracking-[-0.01em] whitespace-nowrap text-[color:var(--brand-accent-deep)]">
          {BRAND.shortName}
        </p>
        <StepIndicator path={path} currentStep={currentStep} />
        {path === "ai" ? (
          <div className="mt-2.5 inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-[color:var(--brand-muted)]">
            <span
              className={cn(
                "size-2 rounded-full",
                aiReady ? "bg-[color:var(--brand-success)]" : "bg-[color:var(--brand-idle)]"
              )}
              aria-hidden="true"
            />
            <span>{aiReady ? "AI ready" : "AI offline. Try again later"}</span>
          </div>
        ) : null}
      </header>

      {currentStep === "path" ? (
        <StepPanel stepKey="path">
          <h2 className="mb-1 text-[1.12rem] font-bold">How do you want to write it?</h2>
          <p className="mb-3.5 text-[0.92rem] text-[color:var(--brand-muted)]">
            Write on Google yourself, or let us help you draft a review first.
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => choosePath("self")}
              className="w-full rounded-[14px] border-[1.5px] border-[color:var(--brand-line)] bg-[color:var(--brand-paper)] px-3.5 py-4 text-left transition-[border-color,background,transform] duration-150 hover:border-[color:var(--brand-line-hover)] hover:bg-white active:scale-[0.985]"
            >
              <span className="mb-1 flex items-center gap-2 text-[1.05rem] font-bold text-[color:var(--brand-accent-deep)]">
                <PenLine data-icon="inline-start" aria-hidden="true" />
                I will write it myself
              </span>
              <span className="block text-[0.9rem] leading-snug text-[color:var(--brand-muted)]">
                Opens Google so you can write and post your review there.
              </span>
            </button>
            <button
              type="button"
              onClick={() => choosePath("ai")}
              className="w-full rounded-[14px] border-[1.5px] border-[color:var(--brand-line)] bg-[color:var(--brand-paper)] px-3.5 py-4 text-left transition-[border-color,background,transform] duration-150 hover:border-[color:var(--brand-line-hover)] hover:bg-white active:scale-[0.985]"
            >
              <span className="mb-1 flex items-center gap-2 text-[1.05rem] font-bold text-[color:var(--brand-accent-deep)]">
                <Sparkles data-icon="inline-start" aria-hidden="true" />
                Help me write it
              </span>
              <span className="block text-[0.9rem] leading-snug text-[color:var(--brand-muted)]">
                Share your story and numbers, then we draft a warm review for you to edit.
              </span>
            </button>
          </div>
        </StepPanel>
      ) : null}

      {currentStep === "about" ? (
        <StepPanel stepKey="about">
          <BackButton onClick={goBack} />
          <h2 className="mb-1 text-[1.12rem] font-bold">A bit about you</h2>
          <p className="mb-3.5 text-[0.92rem] text-[color:var(--brand-muted)]">
            Your name and what you were dealing with are required. The rest is optional.
          </p>
          <FieldGroup>
            <Field data-invalid={invalidFields.name ? true : undefined}>
              <FieldLabel htmlFor="name">Name</FieldLabel>
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
            <Field data-invalid={invalidFields.struggle ? true : undefined}>
              <FieldLabel htmlFor="struggle">What were you dealing with?</FieldLabel>
              <FieldDescription>
                A short note about your health concern before you came.
              </FieldDescription>
              <Textarea
                id="struggle"
                maxLength={220}
                placeholder="e.g. diabetes for years, confusing blood sugar readings, always tired"
                required
                aria-required="true"
                aria-invalid={invalidFields.struggle ? true : undefined}
                value={experience.struggle}
                onChange={(event) => updateField("struggle", event.target.value)}
                className="min-h-[72px]"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="change">What changed? (optional)</FieldLabel>
              <FieldDescription>
                What feels different now: energy, clarity, daily life, meds, and so on.
              </FieldDescription>
              <Textarea
                id="change"
                maxLength={220}
                placeholder="e.g. clearer plan, less guessing (numbers go on the next step)"
                value={experience.change}
                onChange={(event) => updateField("change", event.target.value)}
                className="min-h-[64px]"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="extra">Anything else? (optional)</FieldLabel>
              <FieldDescription>
                Anything else worth mentioning: how she made you feel, materials, workshop, and so on.
              </FieldDescription>
              <Textarea
                id="extra"
                maxLength={220}
                placeholder="e.g. felt heard, workshop was worth my time"
                value={experience.extra}
                onChange={(event) => updateField("extra", event.target.value)}
                className="min-h-[64px]"
              />
            </Field>
          </FieldGroup>
          <WizardPrimaryButton
            className="mt-3.5"
            disabled={!canContinueAbout}
            onClick={() => {
              if (!validateExperience()) {
                return;
              }
              goTo("results");
            }}
          >
            Continue
          </WizardPrimaryButton>
          <StatusLine message={aboutStatus.message} kind={aboutStatus.kind} />
        </StepPanel>
      ) : null}

      {currentStep === "results" ? (
        <StepPanel stepKey="results">
          <BackButton onClick={goBack} />
          <ResultsStepFields
            results={results}
            onChange={setResults}
            statusMessage={resultsStatus.message}
            statusKind={resultsStatus.kind}
          />
          <WizardPrimaryButton
            className="mt-3.5"
            onClick={() => {
              setResultsStatus({ message: "", kind: "" });
              goTo("topics");
            }}
          >
            Continue
          </WizardPrimaryButton>
          {!hasFilledResults() ? (
            <p className="mt-2.5 text-center text-[0.95rem] leading-relaxed text-[color:var(--brand-muted)]">
              Numbers help your story sound real. Continue works even if you leave
              this blank.
            </p>
          ) : null}
        </StepPanel>
      ) : null}

      {currentStep === "topics" ? (
        <StepPanel stepKey="topics">
          <BackButton onClick={goBack} />
          <h2 className="mb-1 text-[1.12rem] font-bold">What stood out?</h2>
          <p className="mb-3.5 text-[0.92rem] text-[color:var(--brand-muted)]">
            Optional. Tap a few if you like. Your numbers matter most.
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Review topics">
            {CATEGORIES.map((category) => {
              const pressed = selectedTopics.has(category.id);
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => toggleTopic(category.id)}
                  className={cn(
                    "rounded-full border-[1.5px] px-3.5 py-2.5 text-[0.95rem] font-semibold transition-[background,border-color,color,transform] duration-150 active:scale-[0.98]",
                    pressed
                      ? "border-[color:var(--brand-accent)] bg-[color:var(--brand-accent)] text-white"
                      : "border-[color:var(--brand-line)] bg-[color:var(--brand-paper)] text-[color:var(--brand-ink-soft)] hover:border-[color:var(--brand-line-hover)]"
                  )}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
          <WizardPrimaryButton
            className="mt-3.5"
            disabled={!canGenerateAi}
            onClick={async () => {
              if (!hasRequiredExperience()) {
                setTopicsStatus({
                  message: "Please complete your name and context first.",
                  kind: "error",
                });
                goTo("about");
                return;
              }
              const ok = await writeWithAi();
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
          <StatusLine
            message={topicsStatus.message}
            kind={topicsStatus.kind}
            busy={aiBusy && topicsStatus.message.startsWith("Writing")}
          />
        </StepPanel>
      ) : null}

      {currentStep === "draft" ? (
        <StepPanel stepKey="draft">
          <BackButton onClick={goBack} />
          <h2 className="mb-1 text-[1.12rem] font-bold">Your draft</h2>
          <p className="mb-3.5 text-[0.92rem] text-[color:var(--brand-muted)]">
            We drafted this from your answers and numbers. Edit freely.
          </p>
          <label htmlFor="draft" className="sr-only">
            Review draft
          </label>
          <Textarea
            id="draft"
            value={draft}
            maxLength={DRAFT_MAX_LENGTH}
            placeholder="Write your review here…"
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-[180px] text-[1.02rem] leading-relaxed"
          />
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2.5 text-[0.85rem] text-[color:var(--brand-muted)]">
            <span>
              {draft.length} / {DRAFT_MAX_LENGTH}
            </span>
          </div>
          <StatusLine message={draftStatus.message} kind={draftStatus.kind} />
          <WizardPrimaryButton
            className="mt-3.5"
            disabled={!canContinueDraft}
            onClick={() => {
              if (!hasRequiredExperience()) {
                toast.message("Please complete your name and context first");
                goTo("about");
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
            Continue
          </WizardPrimaryButton>
        </StepPanel>
      ) : null}

      {currentStep === "post" ? (
        <StepPanel stepKey="post">
          <BackButton onClick={goBack} />
          <h2 className="mb-1 text-[1.12rem] font-bold">Ready to post</h2>
          <p className="mb-3.5 text-[0.92rem] text-[color:var(--brand-muted)]">
            We will copy your review, then open Google. Paste it there and submit.
          </p>
          <div className="flex flex-col gap-2">
            <WizardPrimaryButton
              className="text-[1.08rem]"
              disabled={!canPost}
              onClick={async () => {
                if (!hasRequiredExperience()) {
                  toast.message("Complete your name and context first");
                  goTo("about");
                  return;
                }
                const text = draft.trim();
                if (text.length < DRAFT_MIN_LENGTH) {
                  return;
                }
                const ok = await copyText(text);
                toast.message(
                  ok
                    ? "Copied! Opening Google. Paste and submit"
                    : "Opening Google. Copy the draft manually, then paste"
                );
                window.setTimeout(() => {
                  window.open(BRAND.googleShareUrl, "_blank", "noopener,noreferrer");
                }, 350);
              }}
            >
              Copy &amp; open Google
            </WizardPrimaryButton>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11 w-full"
              onClick={async () => {
                if (!hasRequiredExperience()) {
                  toast.message("Complete your name and context first");
                  goTo("about");
                  return;
                }
                const text = draft.trim();
                if (text.length < DRAFT_MIN_LENGTH) {
                  toast.message("Add a bit more to your review first");
                  return;
                }
                const ok = await copyText(text);
                toast.message(
                  ok ? "Copied. Ready to paste" : "Could not copy. Select the text manually"
                );
              }}
            >
              Copy only
            </Button>
          </div>
          <p className="mt-2.5 text-center text-[0.8rem] text-[color:var(--brand-muted)]">
            Paste into Google, then submit. Google cannot auto-fill the text.
          </p>
          <div className="mt-3 flex justify-center">
            <Badge variant="secondary">Warm tone · edited by you</Badge>
          </div>
        </StepPanel>
      ) : null}
    </div>
  );
}

type BackButtonProps = {
  onClick: () => void;
};

/**
 * Subtle back control for wizard steps after the start screen.
 */
function BackButton({ onClick }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-3 inline-flex items-center gap-1 border-0 bg-transparent p-0 text-[0.88rem] font-semibold text-[color:var(--brand-muted)] hover:text-[color:var(--brand-accent-deep)]"
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
