import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/src/lib/db/index';
import { calculateTotal } from '@/src/lib/domain/invoices';
import PayButton from './PayButton';

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const invoice = await db.query.invoices.findFirst({
    where: (inv, { eq }) => eq(inv.id, id),
    with: { items: true },
  });

  if (!invoice) notFound();

  const subtotalCents = invoice.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceCents,
    0,
  );
  const discountedCents = Math.round(subtotalCents * (1 - invoice.discountBps / 10000));
  const totalCents = calculateTotal(
    invoice.items.map((i) => ({ quantity: i.quantity, unitPriceCents: i.unitPriceCents })),
    invoice.discountBps,
    invoice.taxBps,
  );
  const taxCents = totalCents - discountedCents;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← Invoices
      </Link>

      <div className="mt-4 mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{invoice.customerName}</h1>
          <p className="mt-1 text-xs text-zinc-400 font-mono">{invoice.id}</p>
          <p className="mt-1 text-sm text-zinc-500">
            Created {new Date(invoice.createdAt).toLocaleDateString()}
            {invoice.paidAt && (
              <> · Paid {new Date(invoice.paidAt).toLocaleDateString()}</>
            )}
          </p>
        </div>
        <span
          className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium ${
            invoice.status === 'PAID'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {invoice.status}
        </span>
      </div>

      <table className="w-full text-sm border-collapse mb-6">
        <thead>
          <tr className="border-b text-left text-zinc-500">
            <th className="pb-2 font-medium">Description</th>
            <th className="pb-2 font-medium text-right">Qty</th>
            <th className="pb-2 font-medium text-right">Unit price</th>
            <th className="pb-2 font-medium text-right">Line total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => (
            <tr key={item.id} className="border-b last:border-0">
              <td className="py-2">{item.description}</td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">{formatCents(item.unitPriceCents)}</td>
              <td className="py-2 text-right">{formatCents(item.quantity * item.unitPriceCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col items-end gap-1 text-sm mb-8">
        <div className="flex gap-8">
          <span className="text-zinc-500">Subtotal</span>
          <span>{formatCents(subtotalCents)}</span>
        </div>
        {invoice.discountBps > 0 && (
          <div className="flex gap-8">
            <span className="text-zinc-500">Discount ({invoice.discountBps / 100}%)</span>
            <span className="text-green-700">−{formatCents(subtotalCents - discountedCents)}</span>
          </div>
        )}
        {invoice.taxBps > 0 && (
          <div className="flex gap-8">
            <span className="text-zinc-500">Tax ({invoice.taxBps / 100}%)</span>
            <span>{formatCents(taxCents)}</span>
          </div>
        )}
        <div className="flex gap-8 border-t pt-1 font-semibold">
          <span>Total</span>
          <span>{formatCents(totalCents)}</span>
        </div>
      </div>

      {invoice.status === 'OPEN' && <PayButton invoiceId={invoice.id} />}
    </main>
  );
}
