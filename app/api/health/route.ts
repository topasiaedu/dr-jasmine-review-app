import { BRAND } from "@/lib/brand";

export const runtime = "nodejs";

/**
 * Health check for the review helper — reports whether an OpenAI key is configured.
 */
export async function GET(): Promise<Response> {
  const hasKey = Boolean(String(process.env.OPENAI_API_KEY ?? "").trim());
  const model = String(process.env.OPENAI_MODEL ?? "gpt-4o-mini").trim();

  return Response.json({
    ok: true,
    hasKey,
    model,
    brand: BRAND.shortName,
  });
}
