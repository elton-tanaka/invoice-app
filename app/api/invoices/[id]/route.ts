import { db } from '@/src/lib/db/index';
import { calculateTotal } from '@/src/lib/domain/invoices';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  try {
    const invoice = await db.query.invoices.findFirst({
      where: (inv, { eq }) => eq(inv.id, id),
      with: { items: true },
    });

    if (!invoice) {
      return Response.json({ error: 'INVOICE_NOT_FOUND' }, { status: 404 });
    }

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
      id: invoice.id,
      customer_name: invoice.customerName,
      status: invoice.status,
      discount_bps: invoice.discountBps,
      tax_bps: invoice.taxBps,
      subtotal_cents: subtotalCents,
      total_cents: totalCents,
      items: invoice.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit_price_cents: item.unitPriceCents,
      })),
      created_at: invoice.createdAt,
      paid_at: invoice.paidAt,
    });
  } catch (e) {
    console.error('[GET /api/invoices/:id]', e);
    return Response.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
