import type { Kysely } from 'kysely';

/**
 * Migration: Add custom_name_registry table
 *
 * This table stores user-assigned custom names for recurring installment expenses.
 * When a user assigns a custom name to an installment expense (e.g., "Amazon Parcela 2/10"),
 * the system remembers it and automatically applies the same name to future installments
 * (e.g., "Amazon Parcela 3/10", "Amazon Parcela 4/10", etc.).
 *
 * Matching criteria:
 * - vendor_pattern: Base vendor name extracted from title (e.g., "Amazon")
 * - installment_total: Total number of installments (e.g., 10 for "2/10")
 * - amount: Installment amount for exact matching
 *
 * Unique constraint ensures only one custom name per vendor+installment_total+amount combination
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('custom_name_registry')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('vendor_pattern', 'text', (col) => col.notNull())
    .addColumn('installment_total', 'integer', (col) => col.notNull())
    .addColumn('amount', 'real', (col) => col.notNull())
    .addColumn('custom_name', 'text', (col) => col.notNull())
    .addColumn('first_assigned_date', 'text', (col) => col.notNull()) // ISO 8601 datetime
    .execute();

  // Create unique constraint for vendor_pattern + installment_total + amount
  await db.schema
    .createIndex('idx_custom_name_unique')
    .on('custom_name_registry')
    .columns(['vendor_pattern', 'installment_total', 'amount'])
    .unique()
    .execute();

  // Create index for vendor lookups
  await db.schema
    .createIndex('idx_custom_name_vendor')
    .on('custom_name_registry')
    .column('vendor_pattern')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('custom_name_registry').execute();
}
