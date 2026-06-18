import { describe, it, expect } from 'vitest';
import { calculateTotal, canPay } from './invoices';

describe('calculateTotal', () => {
  it('returns 0 for empty items', () => {
    expect(calculateTotal([], 0, 0)).toBe(0);
  });

  it('sums multiple items with no discount or tax', () => {
    const items = [
      { quantity: 2, unitPriceCents: 500 },
      { quantity: 3, unitPriceCents: 200 },
    ];
    expect(calculateTotal(items, 0, 0)).toBe(1600);
  });

  it('applies discount before tax', () => {
    // subtotal=10000, discount=10%, tax=8%
    // discounted = round(10000 × 0.90) = 9000
    // total      = round(9000 × 1.08) = 9720
    const items = [{ quantity: 1, unitPriceCents: 10000 }];
    expect(calculateTotal(items, 1000, 800)).toBe(9720);
  });

  it('applies tax only when discount is zero', () => {
    // subtotal=1000, tax=10%
    // discounted = 1000, total = round(1000 × 1.10) = 1100
    const items = [{ quantity: 1, unitPriceCents: 1000 }];
    expect(calculateTotal(items, 0, 1000)).toBe(1100);
  });

  it('applies discount only when tax is zero', () => {
    // subtotal=1000, discount=10%
    // discounted = round(1000 × 0.90) = 900, total = 900
    const items = [{ quantity: 1, unitPriceCents: 1000 }];
    expect(calculateTotal(items, 1000, 0)).toBe(900);
  });

  it('rounds half-up at the discount step', () => {
    // subtotal=333, discount=10%: 333 × 0.90 = 299.7 → rounds to 300
    const items = [{ quantity: 1, unitPriceCents: 333 }];
    expect(calculateTotal(items, 1000, 0)).toBe(300);
  });

  it('rounds half-up at the tax step', () => {
    // subtotal=1, discount=0, tax=50%: discounted=1, 1 × 1.50 = 1.5 → rounds to 2
    const items = [{ quantity: 1, unitPriceCents: 1 }];
    expect(calculateTotal(items, 0, 5000)).toBe(2);
  });

  it('two-step rounding can differ from single-step', () => {
    // subtotal=3, discount=50%, tax=100%
    // Two-step:   discounted = round(3 × 0.50) = round(1.5) = 2; total = round(2 × 2.0) = 4
    // Single-step: round(3 × 0.50 × 2.0) = round(3.0) = 3  ← would give 3, not 4
    const items = [{ quantity: 1, unitPriceCents: 3 }];
    expect(calculateTotal(items, 5000, 10000)).toBe(4);
  });

  it('handles full discount (100%)', () => {
    // subtotal=1000, discount=100%: discounted = round(0) = 0, total = 0
    const items = [{ quantity: 1, unitPriceCents: 1000 }];
    expect(calculateTotal(items, 10000, 1000)).toBe(0);
  });

  it('handles zero unit price', () => {
    const items = [{ quantity: 5, unitPriceCents: 0 }];
    expect(calculateTotal(items, 500, 1000)).toBe(0);
  });
});

describe('canPay', () => {
  it('returns ok:true for OPEN invoice', () => {
    const result = canPay('OPEN');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(true);
  });

  it('returns ok:false with INVOICE_ALREADY_PAID for PAID invoice', () => {
    const result = canPay('PAID');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('INVOICE_ALREADY_PAID');
  });
});
