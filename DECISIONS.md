# DECISIONS.md

## [D1] Data model: two-table relational schema

- **Chose:** `invoices` (header) + `invoice_items` (line items) as separate tables.
- **Rejected:** Items as a JSONB column — loses row-level integrity and makes aggregation harder.
- **Rejected:** Storing a `total_cents` column on `invoices` — total is always derived server-side; persisting it creates a consistency risk if items ever change.
- **Why:** Clean relational model. Total derived at read time guarantees correctness by construction, satisfying the CLAUDE.md non-negotiable rule.
- **Trade-off:** Every invoice read requires a JOIN. Acceptable at this scale.

## [D2] Money as integer cents; rates as basis points

- **Chose:** All monetary amounts as `integer` cents (`unit_price_cents`). Percentage rates (discount, tax) as integer basis points (100 bps = 1%).
- **Rejected:** Floats or NUMERIC for monetary values — floating-point arithmetic introduces rounding errors unacceptable in financial data.
- **Rejected:** Storing rates as decimal strings — basis points extend the "integers only" rule to percentages with no parsing overhead.
- **Why:** CLAUDE.md non-negotiable. Basis points give 0.01% granularity with plain integers.
- **Trade-off:** Basis points cap resolution at 0.01% — sufficient for this domain.

### Calculation formula (locked)
```
subtotal    = Σ (quantity × unit_price_cents)
total_cents = round_half_up(subtotal × (1 − discount_bps / 10000) × (1 + tax_bps / 10000))
```
Discount applied before tax. Rounding once at the final step, half-up.

## [D3] UUID v4 primary keys

- **Chose:** `uuid` with `gen_random_uuid()` default for all PKs, exposed directly in URLs.
- **Rejected:** Serial integers — enumerable, leaks row count, unsafe for public URLs.
- **Why:** Standard safe default for public-facing APIs.
- **Trade-off:** UUIDs are larger than ints; non-issue at this scale.

## [D4] API: REST with payment as a sub-resource event

- **Chose:** REST on `/api/invoices`. Payment registered via `POST /api/invoices/[id]/payments` (sub-resource).
- **Rejected:** `PATCH /api/invoices/[id] { status: "PAID" }` — payment is an event/action, not a field mutation. Sub-resource models the intent and leaves room for future payment metadata.
- **Rejected:** RPC-style paths — REST is the agreed convention (CLAUDE.md).
- **Why:** Resource-oriented REST with an event sub-resource is idiomatic and semantically clear.
- **Trade-off:** One extra route, but the clarity justifies it.

### Status codes
| Scenario | Code |
|---|---|
| Created | 201 |
| Success read / payment | 200 |
| Invalid input (Zod) | 422 |
| Not found | 404 |
| Already paid | 409 |
| Infra error | 500 |

## [D5] Domain errors as typed Result; infra errors as thrown exceptions

- **Chose:** Domain functions return `{ ok: true; value: T } | { ok: false; error: DomainErrorCode }`. Route handlers pattern-match on `.ok` and map to 4xx + `{ "error": "CODE" }`.
- **Rejected:** Throwing exceptions for domain errors — domain violations are predictable and should be modeled as data, not exceptions.
- **Why:** Forces explicit handling at the call site. Keeps domain logic pure and directly unit-testable. Satisfies CLAUDE.md requirement for a distinct typed error on domain failures.
- **Trade-off:** Slightly more verbose than throw/catch, but safer.

## [D6] Test runner: Vitest

- **Chose:** Vitest with `--passWithNoTests` flag during early slices.
- **Rejected:** Jest — heavier config, slower cold start, requires babel/ts-jest transform.
- **Why:** Native TypeScript, near-zero config, integrates cleanly with the existing tsconfig.
- **Trade-off:** One extra dev dependency; minimal.

## [D7] Discount is a percentage, not a flat amount

- **Chose:** Discount stored as basis points (percentage rate), same as tax.
- **Rejected:** Flat cent amount — less flexible, and percentage discounts are the norm in invoicing software.
- **Why:** Spec says "desconto opcional" without specifying type. Percentage is the safer, more common default.
- **Trade-off:** Constrains the create-invoice form to accept a percentage, not a fixed amount.

## [D8] Wiped placeholder migration; generated fresh from clean state

- **Chose:** Deleted the scaffolded `0000_quick_switch.sql` (which created an unused `test` table) and regenerated from a clean journal, producing `0000_needy_prism.sql` with only `invoices` + `invoice_items`.
- **Rejected:** Creating an additive migration that drops `test` and adds the new tables — would leave dead weight in the migration history and require interactive conflict resolution from drizzle-kit.
- **Why:** The test table was a placeholder with no production data. Starting clean is simpler and produces a migration history that reflects the real schema from day one.
- **Trade-off:** If `test` already existed in the Neon DB, `db:push` will prompt to drop it. Handle once at push time.

---

## [D9] Rounding: two steps, not one (supersedes rounding rule in D2)

- **Chose:** Two half-up rounding steps — once after discount, once after tax:
  ```
  discounted_cents = round_half_up(subtotal × (1 − discount_bps / 10000))
  total_cents      = round_half_up(discounted_cents × (1 + tax_bps / 10000))
  ```
- **Rejected:** Single round at the very end (`round_half_up(subtotal × factor_discount × factor_tax)`) — originally proposed in D2, but superseded here.
- **Why:** Makes the discount amount itself an exact integer cent value before tax is applied. More transparent: the discounted subtotal shown on an invoice is always a whole-cent number, and tax is computed on that exact figure. Requested by user.
- **Trade-off:** Two rounding steps means a ½-cent error can be introduced at each stage (max ~1 cent total difference vs. single-step). Accepted.

---

## [D10] Math.round as half-up rounding implementation

- **Chose:** `Math.round` to implement round-half-up.
- **Rejected:** A custom `roundHalfUp` function — unnecessary, because `Math.round` is half-up for non-negative values, which all cent amounts are by definition.
- **Why:** Simpler with no extra abstraction. The constraint (non-negative) holds for all monetary values in this domain.
- **Trade-off:** If negative cent values were ever introduced (e.g. refunds), `Math.round(-0.5)` returns 0 (rounds toward zero), not -1. That case doesn't exist in this model.

---

## [D11] App directory at project root, not src/app

- **Chose:** Keep route files under `app/` (project root), matching the existing scaffold.
- **Rejected:** Moving to `src/app/` — would require relocating the existing layout/page files and updating tsconfig paths; no benefit at this scale.
- **Why:** The Create Next App scaffold placed the app router at the root `app/` dir. Domain/DB code lives in `src/lib/` by convention. Both conventions coexist cleanly.
- **Trade-off:** The project root has two source roots (`app/` and `src/`). Acceptable given the clear separation of concerns.

---

## [D12] No DB transaction on invoice create — neon-http limitation

- **Chose:** Sequential inserts (invoice then items) without a wrapping transaction.
- **Rejected:** Switching to `drizzle-orm/neon-serverless` (WebSocket) to get real transaction support — adds a WebSocket dependency and more complex connection lifecycle.
- **Why:** `drizzle-orm/neon-http` uses Neon's stateless HTTP API which does not support `BEGIN`/`COMMIT` transactions. The risk (orphaned invoice with no items on a partial failure) is real but extremely unlikely in normal operation, and acceptable for this challenge scope.
- **Trade-off:** If the items insert fails after the invoice insert succeeds, we'd have an orphaned invoice row. Mitigated by: (a) Zod validates items before any DB write, (b) items FK cascade-deletes on invoice delete, (c) out of scope to fix in this session.

## [D13] Zod v4 for input validation

- **Chose:** Zod v4 (already installed as a transitive dep — pinned explicitly in package.json).
- **Rejected:** Downgrading to Zod v3 — unnecessary churn.
- **Why:** Zod v4 is installed; the APIs used here (`z.object`, `z.string`, `z.number().int()`, `.safeParse`, `.error.issues`) are stable across v3 and v4.
- **Trade-off:** Zod v4 has breaking changes in error formatting (`flatten`, `format`) — only use `.issues` directly in responses to stay version-agnostic.

---

## AI corrections

_(Populated as corrections are made during the session.)_
