'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PayButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setPaying(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/payments`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Payment failed');
        return;
      }
      router.refresh();
    } catch {
      setError('Network error — please try again');
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handlePay}
        disabled={paying}
        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {paying ? 'Processing…' : 'Mark as Paid'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
