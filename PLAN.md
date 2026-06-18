# PLAN.md

## Agreed build order

- [x] **Slice 0 — Foundation:** DB schema (Drizzle), migration, Vitest setup, `typecheck` npm script
- [x] **Slice 1 — Domain logic + tests:** `calculateTotal`, `canPay` pure functions + unit tests (no HTTP, no DB)
- [x] **Slice 2 — Health endpoint:** `GET /api/health`
- [x] **Slice 3 — Create invoice:** `POST /api/invoices`, Zod validation, DB insert
- [x] **Slice 4 — List + Get:** `GET /api/invoices`, `GET /api/invoices/[id]`
- [ ] **Slice 5 — Pay invoice:** `POST /api/invoices/[id]/payments`, domain guard, 409 path
- [ ] **Slice 6 — Frontend:** list page, create form, detail view, pay button
- [ ] **Slice 7 — Deploy + verify:** Vercel deploy, smoke test on live URL

## Calculation rule (locked)

```
subtotal         = Σ (quantity × unit_price_cents)
discounted_cents = round_half_up(subtotal × (1 − discount_bps / 10000))
total_cents      = round_half_up(discounted_cents × (1 + tax_bps / 10000))
```

Two rounding steps, both half-up. Discount rounded to whole cents first, tax applied to that result.

## Deferred / out of scope

- Pagination on invoice list
- Separate customers table / customer management
- Per-item tax rates
- Fractional quantities
- Payment metadata (method, reference, etc.)
