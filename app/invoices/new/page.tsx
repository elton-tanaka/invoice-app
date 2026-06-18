'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ItemInput {
  description: string;
  quantity: string;
  unit_price: string;
}

const emptyItem = (): ItemInput => ({ description: '', quantity: '1', unit_price: '' });

export default function NewInvoicePage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<ItemInput[]>([emptyItem()]);
  const [discountPct, setDiscountPct] = useState('0');
  const [taxPct, setTaxPct] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateItem(index: number, field: keyof ItemInput, value: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        customer_name: customerName.trim(),
        items: items.map((item) => ({
          description: item.description.trim(),
          quantity: parseInt(item.quantity, 10),
          unit_price_cents: Math.round(parseFloat(item.unit_price) * 100),
        })),
        discount_bps: Math.round(parseFloat(discountPct || '0') * 100),
        tax_bps: Math.round(parseFloat(taxPct || '0') * 100),
      };

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create invoice');
        return;
      }

      router.push(`/invoices/${data.id}`);
    } catch {
      setError('Network error — please try again');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← Invoices
      </Link>
      <h1 className="mt-4 mb-8 text-2xl font-semibold">New Invoice</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Customer name</label>
          <input
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Acme Corp"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Items</span>
            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, emptyItem()])}
              className="text-sm text-blue-600 hover:underline"
            >
              + Add item
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 items-start">
                <input
                  required
                  value={item.description}
                  onChange={(e) => updateItem(i, 'description', e.target.value)}
                  placeholder="Description"
                  className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                  placeholder="Qty"
                  className="w-20 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => updateItem(i, 'unit_price', e.target.value)}
                  placeholder="Unit price"
                  className="w-28 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                    className="mt-2 text-zinc-400 hover:text-red-500 text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Discount (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={discountPct}
              onChange={(e) => setDiscountPct(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Tax (%)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={taxPct}
              onChange={(e) => setTaxPct(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create Invoice'}
        </button>
      </form>
    </main>
  );
}
