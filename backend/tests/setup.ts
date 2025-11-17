import { beforeEach, afterEach, beforeAll } from 'vitest';
import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import { up as initialUp, down as initialDown } from '../src/db/migrations/20251115120000_initial_schema.js';
import { up as billingCycleUp, down as billingCycleDown } from '../src/db/migrations/20251116030000_add_billing_cycle.js';
import { up as isDeletedUp, down as isDeletedDown } from '../src/db/migrations/20251116050000_add_is_deleted.js';
import { up as isDeletedSessionsUp, down as isDeletedSessionsDown } from '../src/db/migrations/20251116060000_add_is_deleted_to_sessions.js';
import { up as customNamesUp, down as customNamesDown } from '../src/db/migrations/20251116070000_add_custom_names.js';
import { db as appDb } from '../src/db/database.js';

// Use in-memory database for tests
export const testDb = new Database(':memory:');

// Enable SQLite optimizations
testDb.pragma('journal_mode = WAL');
testDb.pragma('foreign_keys = ON');

export const db = new Kysely<any>({
  dialect: new SqliteDialect({
    database: testDb,
  }),
});

// Helper to run all migrations
async function runAllMigrations(database: Kysely<any>) {
  await initialUp(database);
  await billingCycleUp(database);
  await isDeletedUp(database);
  await isDeletedSessionsUp(database);
  await customNamesUp(database);
}

// Helper to clean all data from tables
async function cleanAllTables(database: Kysely<any>) {
  // Delete in order to respect foreign keys
  await database.deleteFrom('expenses').execute();
  await database.deleteFrom('import_sessions').execute();
  await database.deleteFrom('custom_name_registry').execute();
}

// Run migrations once before all tests
beforeAll(async () => {
  await runAllMigrations(db);
  await runAllMigrations(appDb);
});

// Clean data between tests instead of rolling back migrations
beforeEach(async () => {
  await cleanAllTables(db);
  await cleanAllTables(appDb);
});

// Clean up after each test
afterEach(async () => {
  await cleanAllTables(db);
  await cleanAllTables(appDb);
});

export async function seedCategories() {
  // Categories are already seeded by the migration
  return await db.selectFrom('categories').selectAll().execute();
}
