import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add billing cycle month column to expenses table
  await db.schema
    .alterTable('expenses')
    .addColumn('billing_cycle_month', 'integer') // 1-12
    .execute();

  // Add billing cycle year column to expenses table
  await db.schema
    .alterTable('expenses')
    .addColumn('billing_cycle_year', 'integer')  // YYYY
    .execute();

  // Add billing cycle close day to import_sessions table
  // Default is 11th of month (Nubank typical credit card cycle)
  await db.schema
    .alterTable('import_sessions')
    .addColumn('billing_cycle_close_day', 'integer', (col) =>
      col.notNull().defaultTo(11).check(sql`billing_cycle_close_day >= 1 AND billing_cycle_close_day <= 31`)
    )
    .execute();

  // Add index on billing cycle for faster queries
  await db.schema
    .createIndex('idx_expenses_billing_cycle')
    .on('expenses')
    .columns(['billing_cycle_month', 'billing_cycle_year'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop index first (use IF EXISTS for safety)
  await db.schema
    .dropIndex('idx_expenses_billing_cycle')
    .ifExists()
    .execute();

  // Drop columns from import_sessions
  await db.schema
    .alterTable('import_sessions')
    .dropColumn('billing_cycle_close_day')
    .execute();

  // Drop columns from expenses (must be separate statements for SQLite)
  await db.schema
    .alterTable('expenses')
    .dropColumn('billing_cycle_year')
    .execute();

  await db.schema
    .alterTable('expenses')
    .dropColumn('billing_cycle_month')
    .execute();
}
