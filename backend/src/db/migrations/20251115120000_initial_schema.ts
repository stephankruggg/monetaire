import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // CATEGORIES table
  await db.schema
    .createTable('categories')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('name', 'text', (col) => col.notNull().unique())
    .addColumn('description', 'text')
    .addColumn('is_user_defined', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('is_active', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .execute();

  // Seed predefined categories
  await db
    .insertInto('categories')
    .values([
      { name: 'Food', is_user_defined: 0 },
      { name: 'Travel', is_user_defined: 0 },
      { name: 'Library', is_user_defined: 0 },
      { name: 'Hobbies', is_user_defined: 0 },
      { name: 'Housing', is_user_defined: 0 },
      { name: 'Subscriptions', is_user_defined: 0 },
      { name: 'Other', is_user_defined: 0 },
    ])
    .execute();

  // IMPORT_SESSIONS table
  await db.schema
    .createTable('import_sessions')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('filename', 'text', (col) => col.notNull())
    .addColumn('import_date', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .addColumn('expenses_imported', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('expenses_failed', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('month', 'integer', (col) => col.notNull())
    .addColumn('year', 'integer', (col) => col.notNull())
    .execute();

  // EXPENSES table
  await db.schema
    .createTable('expenses')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('date', 'text', (col) => col.notNull())
    .addColumn('custom_name', 'text')
    .addColumn('original_title', 'text', (col) => col.notNull())
    .addColumn('amount', 'real', (col) => col.notNull())
    .addColumn('payment_type', 'text', (col) => col.notNull())
    .addColumn('source', 'text', (col) => col.notNull())
    .addColumn('vendor_name', 'text', (col) => col.notNull())
    .addColumn('category_id', 'integer', (col) => col.references('categories.id'))
    .addColumn('import_session_id', 'integer', (col) => col.references('import_sessions.id'))
    .addColumn('installment_current', 'integer')
    .addColumn('installment_total', 'integer')
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .execute();

  // Create indexes
  await db.schema.createIndex('idx_expenses_vendor').on('expenses').column('vendor_name').execute();
  await db.schema.createIndex('idx_expenses_date').on('expenses').column('date').execute();
  await db.schema.createIndex('idx_expenses_category').on('expenses').column('category_id').execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('expenses').execute();
  await db.schema.dropTable('import_sessions').execute();
  await db.schema.dropTable('categories').execute();
}
