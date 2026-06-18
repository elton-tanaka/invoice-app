import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/lib/db/index';
import { invoices, invoiceItems } from '@/src/lib/db/schema';
import { calculateTotal } from '@/src/lib/domain/invoices';

const CreateInvoiceSchema = z.object({
  customer_name: z.string().min(1).max(255),
  items: z
    .array(
      z.object({
        description: z.string().min(1).max(255),
        quantity: z.number().int().min(1),
        unit_price_cents: z.number().int().min(0),
      }),
    )
    .min(1),
  discount_bps: z.number().int().min(0).max(10000).default(0),
  tax_bps: z.number().int().min(0).default(0),
});

export async function GET(): Promise<Response> {
  try {
    const rows = await db.query.invoices.findMany({
      with: { items: true },
      orderBy: (inv, { desc }) => [desc(inv.createdAt)],
    });

    return Response.json(
      rows.map((inv) => ({
        id: inv.id,
        customer_name: inv.customerName,
        status: inv.status,
        total_cents: calculateTotal(
          inv.items.map((i) => ({ quantity: i.quantity, unitPriceCents: i.unitPriceCents })),
          inv.discountBps,
          inv.taxBps,
        ),
        created_at: inv.createdAt,
      })),
    );
  } catch (e) {
    console.error('[GET /api/invoices]', e);
    return Response.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'VALIDATION_ERROR', issues: ['Invalid JSON'] }, { status: 422 });
  }

  const parsed = CreateInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues }, { status: 422 });
  }

  const { customer_name, items, discount_bps, tax_bps } = parsed.data;

  const subtotalCents = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price_cents,
    0,
  );
  const totalCents = calculateTotal(
    items.map((i) => ({ quantity: i.quantity, unitPriceCents: i.unit_price_cents })),
    discount_bps,
    tax_bps,
  );

  try {
    const [invoice] = await db
      .insert(invoices)
      .values({ customerName: customer_name, discountBps: discount_bps, taxBps: tax_bps })
      .returning();

    const insertedItems = await db
      .insert(invoiceItems)
      .values(
        items.map((item) => ({
          invoiceId: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unitPriceCents: item.unit_price_cents,
        })),
      )
      .returning();

    return Response.json(
      {
        id: invoice.id,
        customer_name: invoice.customerName,
        status: invoice.status,
        discount_bps: invoice.discountBps,
        tax_bps: invoice.taxBps,
        subtotal_cents: subtotalCents,
        total_cents: totalCents,
        items: insertedItems.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unit_price_cents: item.unitPriceCents,
        })),
        created_at: invoice.createdAt,
      },
      { status: 201 },
    );
  } catch (e) {
    console.error('[POST /api/invoices]', e);
    return Response.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
