import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add is_deleted column to import_sessions table
  await db.schema
    .alterTable('import_sessions')
    .addColumn('is_deleted', 'integer', (col) => col.notNull().defaultTo(0))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop is_deleted column from import_sessions
  await db.schema
    .alterTable('import_sessions')
    .dropColumn('is_deleted')
    .execute();
}
