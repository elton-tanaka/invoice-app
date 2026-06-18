import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db/index';
import { invoices } from '@/src/lib/db/schema';
import { calculateTotal, canPay } from '@/src/lib/domain/invoices';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  try {
    const invoice = await db.query.invoices.findFirst({
      where: (inv, { eq: eqFn }) => eqFn(inv.id, id),
      with: { items: true },
    });

    if (!invoice) {
      return Response.json({ error: 'INVOICE_NOT_FOUND' }, { status: 404 });
    }

    const payResult = canPay(invoice.status as 'OPEN' | 'PAID');
    if (!payResult.ok) {
      return Response.json({ error: payResult.error }, { status: 409 });
    }

    const paidAt = new Date();
    const [updated] = await db
      .update(invoices)
      .set({ status: 'PAID', paidAt })
      .where(eq(invoices.id, id))
      .returning();

    const subtotalCents = invoice.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPriceCents,
      0,
    );
    const totalCents = calculateTotal(
      invoice.items.map((i) => ({ quantity: i.quantity, unitPriceCents: i.unitPriceCents })),
      invoice.discountBps,
      invoice.taxBps,
    );

    return Response.json({
      id: updated.id,
      customer_name: updated.customerName,
      status: updated.status,
      discount_bps: updated.discountBps,
      tax_bps: updated.taxBps,
      subtotal_cents: subtotalCents,
      total_cents: totalCents,
      items: invoice.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit_price_cents: item.unitPriceCents,
      })),
      created_at: updated.createdAt,
      paid_at: updated.paidAt,
    });
  } catch (e) {
    console.error('[POST /api/invoices/:id/payments]', e);
    return Response.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
