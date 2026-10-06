"use client";

import { useState, type ReactElement } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  getMetricPreset,
  getMoreMetricPresets,
  getPrimaryMetricPresets,
  createEmptyResult,
} from "@/lib/metrics";
import { cn } from "@/lib/utils";
import type { MetricKind, ResultMetric } from "@/lib/types";
import type { MetricPreset } from "@/lib/metrics";

const MAX_RESULTS = 8;

const RESULT_INPUT_CLASS =
  "h-11 text-base md:text-base placeholder:text-[color:var(--brand-muted)]";

type ResultsStepFieldsProps = {
  results: ResultMetric[];
  onChange: (next: ResultMetric[]) => void;
  statusMessage: string;
  statusKind: "ok" | "error" | "";
};

/**
 * Renders one tap-to-add metric chip with a large touch target.
 */
function MetricAddChip({
  preset,
  disabled,
  onAdd,
}: {
  preset: MetricPreset;
  disabled: boolean;
  onAdd: (kind: MetricKind) => void;
}): ReactElement {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onAdd(preset.kind)}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 py-2.5 text-[1rem] font-semibold leading-snug transition-[background,border-color,color,transform] duration-150 active:scale-[0.98]",
        disabled
          ? "cursor-not-allowed border-[color:var(--brand-line)] bg-[color:var(--brand-paper)] text-[color:var(--brand-muted)] opacity-60"
          : "border-[color:var(--brand-line)] bg-[color:var(--brand-paper)] text-[color:var(--brand-ink-soft)] hover:border-[color:var(--brand-line-hover)] hover:bg-white"
      )}
    >
      <Plus aria-hidden="true" className="size-4 shrink-0" />
      {preset.label}
    </button>
  );
}

/**
 * Mobile-first Results / numbers editor: common metrics first, optional extras.
 */
export function ResultsStepFields({
  results,
  onChange,
  statusMessage,
  statusKind,
}: ResultsStepFieldsProps): ReactElement {
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);

  /**
   * Appends a new empty row for the chosen metric kind.
   */
  function addResult(kind: MetricKind): void {
    if (results.length >= MAX_RESULTS) {
      return;
    }
    onChange([...results, createEmptyResult(kind)]);
  }

  /**
   * Updates one field on a result row by id.
   */
  function updateResult(
    id: string,
    key: keyof Pick<ResultMetric, "before" | "after" | "customLine">,
    value: string
  ): void {
    onChange(
      results.map((row) => (row.id === id ? { ...row, [key]: value } : row))
    );
  }

  /**
   * Removes a result row by id.
   */
  function removeResult(id: string): void {
    onChange(results.filter((row) => row.id !== id));
  }

  const atLimit = results.length >= MAX_RESULTS;
  const primaryPresets = getPrimaryMetricPresets();
  const morePresets = getMoreMetricPresets();

  return (
    <div>
      <p className="mb-2.5 text-[0.9rem] font-semibold text-[color:var(--brand-ink-soft)]">
        Tap to add
      </p>
      <div
        className="mb-3 flex flex-wrap gap-2.5"
        role="group"
        aria-label="Add a result"
      >
        {primaryPresets.map((preset) => (
          <MetricAddChip
            key={preset.kind}
            preset={preset}
            disabled={atLimit}
            onAdd={addResult}
          />
        ))}
      </div>

      {moreOptionsOpen ? (
        <div
          className="mb-3 flex flex-wrap gap-2.5"
          role="group"
          aria-label="More result types"
        >
          {morePresets.map((preset) => (
            <MetricAddChip
              key={preset.kind}
              preset={preset}
              disabled={atLimit}
              onAdd={addResult}
            />
          ))}
        </div>
      ) : null}

      <button
        type="button"
        className="mb-4 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-[0.95rem] font-semibold text-[color:var(--brand-accent-deep)] underline-offset-2 hover:underline"
        aria-expanded={moreOptionsOpen}
        onClick={() => setMoreOptionsOpen((open) => !open)}
      >
        {moreOptionsOpen ? (
          <>
            <ChevronUp aria-hidden="true" className="size-4" />
            Hide extra options
          </>
        ) : (
          <>
            <ChevronDown aria-hidden="true" className="size-4" />
            More options
          </>
        )}
      </button>

      {results.length === 0 ? (
        <div className="mb-4 rounded-[14px] border border-dashed border-[color:var(--brand-line)] bg-[color:var(--brand-paper)] px-4 py-6 text-center">
          <p className="m-0 text-[1rem] leading-relaxed text-[color:var(--brand-muted)]">
            Nothing added yet. Try HbA1c or Weight, or tap Continue with no
            numbers.
          </p>
        </div>
      ) : (
        <ul className="mb-4 flex list-none flex-col gap-3.5 p-0">
          {results.map((row, index) => {
            const preset = getMetricPreset(row.kind);
            const isOther = row.kind === "other";

            return (
              <li
                key={row.id}
                className="rounded-[14px] border-2 border-[color:var(--brand-line)] bg-white px-3.5 py-4"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="m-0 text-[1.05rem] font-bold text-[color:var(--brand-accent-deep)]">
                      {preset.label}
                    </p>
                    <p className="m-0 mt-0.5 text-[0.9rem] leading-snug text-[color:var(--brand-muted)]">
                      {preset.hint}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${preset.label} result ${index + 1}`}
                    onClick={() => removeResult(row.id)}
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border-0 bg-[color:var(--brand-paper)] text-[color:var(--brand-muted)] hover:text-destructive"
                  >
                    <Trash2 aria-hidden="true" className="size-5" />
                  </button>
                </div>

                <FieldGroup className="gap-3">
                  {!isOther ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Field>
                        <FieldLabel
                          htmlFor={`before-${row.id}`}
                          className="text-[0.95rem] font-semibold"
                        >
                          Before
                        </FieldLabel>
                        <Input
                          id={`before-${row.id}`}
                          type="text"
                          inputMode="decimal"
                          maxLength={80}
                          className={RESULT_INPUT_CLASS}
                          placeholder={preset.beforePlaceholder}
                          value={row.before}
                          onChange={(event) =>
                            updateResult(row.id, "before", event.target.value)
                          }
                        />
                      </Field>
                      <Field>
                        <FieldLabel
                          htmlFor={`after-${row.id}`}
                          className="text-[0.95rem] font-semibold"
                        >
                          After
                        </FieldLabel>
                        <Input
                          id={`after-${row.id}`}
                          type="text"
                          inputMode="decimal"
                          maxLength={80}
                          className={RESULT_INPUT_CLASS}
                          placeholder={preset.afterPlaceholder}
                          value={row.after}
                          onChange={(event) =>
                            updateResult(row.id, "after", event.target.value)
                          }
                        />
                      </Field>
                    </div>
                  ) : (
                    <Field>
                      <FieldLabel
                        htmlFor={`custom-${row.id}`}
                        className="text-[0.95rem] font-semibold"
                      >
                        Your result
                      </FieldLabel>
                      <Input
                        id={`custom-${row.id}`}
                        type="text"
                        maxLength={160}
                        className={RESULT_INPUT_CLASS}
                        placeholder={preset.notePlaceholder}
                        value={row.customLine}
                        onChange={(event) =>
                          updateResult(row.id, "customLine", event.target.value)
                        }
                      />
                    </Field>
                  )}
                </FieldGroup>
              </li>
            );
          })}
        </ul>
      )}

      {statusMessage ? (
        <p
          className={cn(
            "mt-2 min-h-[1.2em] text-[0.95rem]",
            statusKind === "error" && "text-destructive",
            statusKind === "ok" && "text-[color:var(--brand-accent-deep)]",
            statusKind === "" && "text-[color:var(--brand-muted)]"
          )}
          role="status"
          aria-live="polite"
        >
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
