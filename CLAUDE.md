@AGENTS.md
# Project: Invoice Manager

## Stack
- Next.js (App Router) + TypeScript, strict mode
- Postgres (Neon) via Drizzle ORM
- Deployed on Vercel

## Money / correctness rules (NON-NEGOTIABLE)
- All monetary values stored and computed as INTEGER CENTS. Never floats.
- Invoice total is ALWAYS derived server-side from items. Never trust a
  client-sent total.
- Calculation order: subtotal -> apply discount -> apply tax.
- Rounding: TWO steps, both half-up.
    1. discounted_cents = round_half_up(subtotal × (1 − discount_bps / 10000))
    2. total_cents      = round_half_up(discounted_cents × (1 + tax_bps / 10000))

## Domain rules
- Invoice statuses: OPEN, PAID.
- Payment only allowed when status == OPEN.
- Paying an already-PAID invoice is a DOMAIN error, not an infra error —
  must return a distinct, typed error and a 4xx (409), not a 500.

## API conventions
- REST. Resource: /api/invoices. Document status codes per route.
- Validation with Zod at the boundary. Reject invalid input with 422.

## Code conventions
- No `any`. Prefer explicit return types on exported functions.
- Keep domain logic (calculation, state transitions) in pure functions,
  separate from route handlers, so they're unit-testable.

## Testing
- Unit tests for the calculation + state-transition logic are required.
- Run `npm run typecheck` and `npm test` before considering a slice done.

## Workflow
- Propose a plan before writing code for any new slice.
- Make small, reviewable changes. Stop and surface trade-offs.

## Decision logging
- Maintain a file DECISIONS.md at the project root.
- Whenever we make a non-trivial engineering decision (data model,
  API shape, error strategy, library choice, a rule interpretation),
  append an entry BEFORE writing the code that depends on it.
- Entry format:
  ## [Dn] <short title>
  - Chose: ...
  - Rejected: ... (and why)
  - Why: ...
  - Trade-off: ...
- Also keep an "## AI corrections" section at the bottom: when I reject
  or correct something you proposed, log what changed and why.
- Never delete entries. If a decision is reversed, add a new entry that
  supersedes the old one and reference it.

  ## Maintain PLAN.md
- Keep PLAN.md with: the agreed build order (vertical slices), a checkbox
  per slice, and a "Deferred / out of scope" section.
- Mark a slice done only after it's deployed and verified on the live URL.
- Re-read PLAN.md and DECISIONS.md at the start of each slice.