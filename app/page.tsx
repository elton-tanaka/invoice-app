import Link from 'next/link';
import { db } from '@/src/lib/db/index';
import { calculateTotal } from '@/src/lib/domain/invoices';

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function HomePage() {
  const rows = await db.query.invoices.findMany({
    with: { items: true },
    orderBy: (inv, { desc }) => [desc(inv.createdAt)],
  });
  console.log('Fetched invoices:', rows);
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <Link
          href="/invoices/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          New Invoice
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-zinc-500 text-sm">No invoices yet.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b text-left text-zinc-500">
              <th className="pb-2 font-medium">Customer</th>
              <th className="pb-2 font-medium">Total</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Created</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((inv) => {
              const total = calculateTotal(
                inv.items.map((i) => ({ quantity: i.quantity, unitPriceCents: i.unitPriceCents })),
                inv.discountBps,
                inv.taxBps,
              );
              return (
                <tr key={inv.id} className="border-b last:border-0 hover:bg-zinc-50">
                  <td className="py-3 font-medium">{inv.customerName}</td>
                  <td className="py-3">{formatCents(total)}</td>
                  <td className="py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        inv.status === 'PAID'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 text-zinc-500">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-right">
                    <Link href={`/invoices/${inv.id}`} className="text-blue-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
