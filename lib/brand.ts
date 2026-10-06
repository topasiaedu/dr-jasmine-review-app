/**
 * Dr Jasmine / Metanova brand context for review generation.
 * Sourced from Tim craft wiki (entity, workshop deck, customer profile, copy constraints).
 * Keep this factual for the model. Do not invent clinical claims.
 */

export type BrandConfig = {
  practitionerName: string;
  clinicBrand: string;
  shortName: string;
  googleShareUrl: string;
  facebookReviewsUrl: string;
  positioning: readonly string[];
  workshopTeaches: readonly string[];
  programNotes: readonly string[];
  commonAudienceThemes: readonly string[];
  copyGuardrails: readonly string[];
};

export const BRAND: BrandConfig = {
  practitionerName: "Dr Jasmine Chiew",
  clinicBrand: "Metanova Health",
  shortName: "Dr Jasmine",
  googleShareUrl: "https://share.google/SPNWFpQZpW7j8Py1D",
  facebookReviewsUrl: "https://www.facebook.com/drjasminechiew/reviews",

  positioning: [
    "Doctor-led metabolic and diabetes education / care brand under Metanova Health.",
    "Known for Reversing Diabetes Workshop teaching: medication trap, three reversal mechanisms, and a supervised medication-reduction roadmap.",
    "Authority tone: international speaker clarity, layman language (not heavy Manglish).",
    "Audience skew: Malaysian and Singapore diabetics / prediabetics; onboarded clients often older adults (median age around early 60s).",
  ],

  workshopTeaches: [
    "Why medication alone can trap people in management mode",
    "Three reversal mechanisms at principle level: insulin sensitivity + nutrient timing, metabolic flexibility + eating patterns, cellular healing",
    "A safe medication-reduction roadmap under doctor supervision",
  ],

  programNotes: [
    "Free workshop stays at mechanism / principle level.",
    "Personalized nutrition plan and supervised med reduction belong to paid program context.",
    "Do not invent meal plans, lab numbers, or guaranteed zero-medication outcomes in reviews.",
  ],

  commonAudienceThemes: [
    "Tired of confusing advice and random supplements",
    "Want clarity on root causes, not another diet lecture",
    "Care about energy, daily life, family presence",
    "Concerned about long-term medication dependence",
    "Value feeling heard and getting practical next steps",
  ],

  copyGuardrails: [
    "No em dashes (—), en dashes (–), or spaced hyphen-minus used as punctuation in review or UI copy. Prefer commas, periods, colons, or short rephrased sentences. Hyphenated compound words (e.g. blood sugar, doctor-led) are fine.",
    "No miracle claims or guaranteed off-all-meds promises.",
    "Numbers, labs, and metrics the USER provided may be used VERBATIM (HbA1c, weight, eGFR, BP, meds removed, years with condition, clothing size, numbness %, etc.).",
    "Do NOT invent HbA1c, weight, eGFR, blood pressure, medication counts, or any other labs/metrics the user left blank.",
    "Do not invent diagnoses or named case outcomes beyond what the user shared.",
    "Keep language warm, clear, and aunt/uncle friendly.",
    "First person only. Sound human, not brochure copy.",
    "Do not mention AI, templates, ads, webinars as funnels, or NM Media.",
  ],
};

/**
 * Strips em/en dash punctuation from model output (safety net if the model slips).
 * Does not alter ordinary hyphenated compounds (no spaces around the hyphen).
 */
export function stripEmEnDashPunctuation(text: string): string {
  if (text.length === 0) {
    return text;
  }

  let normalized = text.replace(/\s*[—–]\s*/g, ", ");
  normalized = normalized.replace(/,\s*,+/g, ", ");
  normalized = normalized.replace(/,\s*\./g, ".");
  normalized = normalized.replace(/\s{2,}/g, " ");
  return normalized.trim();
}

/**
 * Builds the system prompt for OpenAI review generation.
 */
export function buildSystemPrompt(): string {
  return [
    "You write short, authentic Google reviews for a real patient or workshop attendee.",
    "",
    `Practitioner: ${BRAND.practitionerName} (${BRAND.clinicBrand}).`,
    "They may say Dr Jasmine for short.",
    "",
    "Brand context:",
    ...BRAND.positioning.map((line) => `- ${line}`),
    "",
    "Workshop / teaching context (use only if relevant to user input):",
    ...BRAND.workshopTeaches.map((line) => `- ${line}`),
    "",
    "Program boundaries:",
    ...BRAND.programNotes.map((line) => `- ${line}`),
    "",
    "Common audience themes (optional color, do not force):",
    ...BRAND.commonAudienceThemes.map((line) => `- ${line}`),
    "",
    "Hard rules:",
    ...BRAND.copyGuardrails.map((line) => `- ${line}`),
    "",
    "Output rules:",
    "- Output ONLY the review text. No title, quotes, or commentary.",
    "- Prefer natural Google-review voice: 2 to 5 sentences, or a short opening plus a few concrete result lines if the user shared numbers.",
    "- Aim for 70 to 180 words. Hard max 700 characters.",
    "- Match the requested tone: casual, warm, or clear.",
    "- When the user shared Results / numbers, weave those exact figures in clearly (before to after). Do not bury or omit them.",
    "- Do not write a long testimonial-card essay. Keep it postable as a Google review.",
    "- Weave in the personal details the user shared (before, what changed, what stood out) naturally when present.",
    "- If first name is provided, you may end with a simple sign-off using only the first name (no leading dash).",
    "- Never use em dashes, en dashes, or spaced hyphen-minus as sentence punctuation.",
  ].join("\n");
}
