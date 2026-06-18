import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  status: varchar('status', { length: 10 }).notNull().default('OPEN'),
  discountBps: integer('discount_bps').notNull().default(0),
  taxBps: integer('tax_bps').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
});

export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  description: varchar('description', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
});
