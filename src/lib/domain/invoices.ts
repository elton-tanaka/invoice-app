export type InvoiceStatus = 'OPEN' | 'PAID';

export type Result<T, E extends string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export interface LineItem {
  quantity: number;
  unitPriceCents: number;
}

/**
 * Two-step half-up rounding per DECISIONS.md D9:
 *   1. discounted_cents = round_half_up(subtotal × (1 − discount_bps / 10000))
 *   2. total_cents      = round_half_up(discounted_cents × (1 + tax_bps / 10000))
 *
 * Math.round is half-up for non-negative values, which all cent amounts are.
 */
export function calculateTotal(
  items: LineItem[],
  discountBps: number,
  taxBps: number,
): number {
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceCents,
    0,
  );
  const discountedCents = Math.round(subtotal * (1 - discountBps / 10000));
  const totalCents = Math.round(discountedCents * (1 + taxBps / 10000));
  return totalCents;
}

export function canPay(
  status: InvoiceStatus,
): Result<true, 'INVOICE_ALREADY_PAID'> {
  if (status === 'PAID') {
    return { ok: false, error: 'INVOICE_ALREADY_PAID' };
  }
  return { ok: true, value: true };
}
