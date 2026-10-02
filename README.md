# Dr Jasmine Review Helper (Next.js + Vercel)

Guided Google review craft helper for **Dr Jasmine Chiew (Metanova Health)**.  
Choose write-yourself or AI assist → answer a few questions → edit draft → copy → open Google → paste → submit.

Built for a thank-you / workshop page link or iframe from GoHighLevel.

## Stack

| Piece | Role |
|-------|------|
| `app/page.tsx` + `components/review-wizard/` | Guided multi-step UI (Tailwind + shadcn/ui) |
| `app/api/generate-review/route.ts` | OpenAI proxy (key stays server-side, Node runtime) |
| `app/api/health/route.ts` | Key / model status for the AI badge |
| `lib/brand.ts` | Dr Jasmine / Metanova context for the model |

## Setup

```bash
npm install
cp .env.example .env.local
# paste OPENAI_API_KEY into .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `OPENAI_API_KEY` | Yes (for AI path) | Server-side only |
| `OPENAI_MODEL` | No | Defaults to `gpt-4o-mini` |

In Vercel → Project Settings → Environment Variables, add the same keys, then redeploy.

### Deploy

```bash
npm run build   # verify locally
npx vercel      # preview
npx vercel --prod
```

Or connect the GitHub repo in the Vercel dashboard (framework: Next.js).

## Flow

1. **Start** — Write myself vs Help me write it (AI)
2. **You** — First name, dealing with, what changed, anything else (all required)
3. **Topics** (AI only) — tap what stood out → generate draft
4. **Draft** — edit freely (self path: optional starter template; AI path: rewrite)
5. **Post** — Copy & open Google, or copy only

Tone is always **warm** (no tone picker). No attendance/context chips.

## Brand facts baked into AI

From Tim craft wiki:

- **Dr Jasmine Chiew (Metanova Health)**
- Reversing Diabetes Workshop: medication trap, 3 mechanisms, supervised med-reduction roadmap
- Audience: MY/SG diabetics & prediabetics; clients often older adults (~60s)
- Voice: clear international authority, layman-friendly, not heavy Manglish
- Guardrails: no em dashes, no miracle / guaranteed zero-med claims, no invented labs or meal plans

## Google review link

Default share link in `lib/brand.ts`:

`https://share.google/SPNWFpQZpW7j8Py1D`

Swap for a Google Business “Get more reviews” deep link when you have one (`g.page/r/.../review`).

## GHL

Use the Vercel production URL as a button/link or iframe.  
Do **not** paste the OpenAI key into GHL custom HTML.

## Files to tweak first

1. `googleShareUrl` in `lib/brand.ts`
2. Topic chips in `lib/categories.ts`
3. `lib/brand.ts` if positioning or guardrails change
