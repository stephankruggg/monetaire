import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add is_deleted column to expenses table (default false for soft delete)
  await db.schema
    .alterTable('expenses')
    .addColumn('is_deleted', 'integer', (col) => col.notNull().defaultTo(0))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Remove is_deleted column
  await db.schema
    .alterTable('expenses')
    .dropColumn('is_deleted')
    .execute();
}
