import { buildSystemPrompt, stripEmEnDashPunctuation } from "@/lib/brand";
import { asResultList, asText, isObject } from "@/lib/api-utils";
import { formatResultLines } from "@/lib/metrics";
import type { GenerateReviewPayload } from "@/lib/types";

export const runtime = "nodejs";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

/**
 * Normalizes and validates the POST body for review generation.
 */
function normalizePayload(body: unknown): GenerateReviewPayload {
  const input = isObject(body) ? body : {};

  return {
    name: asText(input.name, 40),
    struggle: asText(input.struggle, 220),
    change: asText(input.change, 220),
    extra: asText(input.extra, 220),
    tone: "warm",
    results: asResultList(input.results),
  };
}

/**
 * Builds the user message for the chat completion.
 */
function buildUserPrompt(payload: GenerateReviewPayload): string {
  const resultLines = formatResultLines(payload.results);
  const resultsBlock =
    resultLines.length > 0
      ? [
          "Results / numbers the reviewer provided (use these EXACT figures; do not invent others):",
          ...resultLines.map((line, index) => `${index + 1}. ${line}`),
        ].join("\n")
      : "Results / numbers: none provided (do not invent any labs or metrics).";

  return [
    "Write one authentic Google review for Dr Jasmine Chiew (Metanova Health).",
    "",
    `Tone: ${payload.tone}`,
    `Reviewer first name: ${payload.name || "not provided"}`,
    `Before the workshop / what they were dealing with: ${payload.struggle || "not provided"}`,
    `What changed for them: ${payload.change || "not provided"}`,
    `What stood out: ${payload.extra || "not provided"}`,
    "",
    resultsBlock,
    "",
    "Formatting: no em dashes, en dashes, or spaced hyphen-minus as punctuation. Use commas, periods, or colons instead.",
  ].join("\n");
}

/**
 * OpenAI proxy — generates a warm Google review draft from user answers.
 * Key stays server-side via OPENAI_API_KEY.
 */
export async function POST(request: Request): Promise<Response> {
  const apiKey = String(process.env.OPENAI_API_KEY ?? "").trim();
  const model = String(process.env.OPENAI_MODEL ?? "gpt-4o-mini").trim();

  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY is not set on the server" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = normalizePayload(body);
  const hasResults = payload.results.length > 0;

  if (
    !payload.struggle &&
    !payload.change &&
    !payload.extra &&
    !hasResults
  ) {
    return Response.json(
      { error: "Need at least one personal detail or result" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.8,
        max_tokens: 320,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: buildUserPrompt(payload) },
        ],
      }),
    });

    const data: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const apiMessage =
        isObject(data) &&
        isObject(data.error) &&
        typeof data.error.message === "string"
          ? data.error.message
          : `OpenAI request failed (${response.status})`;
      return Response.json({ error: apiMessage }, { status: 502 });
    }

    const content =
      isObject(data) &&
      Array.isArray(data.choices) &&
      isObject(data.choices[0]) &&
      isObject(data.choices[0].message) &&
      typeof data.choices[0].message.content === "string"
        ? data.choices[0].message.content.trim()
        : "";

    if (!content) {
      return Response.json(
        { error: "OpenAI returned an empty review" },
        { status: 502 }
      );
    }

    const review = stripEmEnDashPunctuation(
      content.replace(/^["']|["']$/g, "")
    ).slice(0, 800);
    return Response.json({ review });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
