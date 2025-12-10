import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { db, sqlite } from './database.js';
import { Kysely } from 'kysely';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsPath = path.join(__dirname, 'migrations');

interface Migration {
  name: string;
  up: (db: Kysely<any>) => Promise<void>;
  down: (db: Kysely<any>) => Promise<void>;
}

async function loadMigrations(): Promise<Migration[]> {
  const files = await fs.readdir(migrationsPath);
  const migrationFiles = files.filter((f) => f.endsWith('.ts') || f.endsWith('.js')).sort();

  const migrations: Migration[] = [];
  for (const file of migrationFiles) {
    const migrationPath = path.join(migrationsPath, file);
    const migration = await import(migrationPath);
    migrations.push({
      name: file.replace(/\.(ts|js)$/, ''),
      up: migration.up,
      down: migration.down,
    });
  }

  return migrations;
}

async function ensureMigrationsTable(): Promise<void> {
  const tableExists = await db.schema
    .createTable('migrations' as any)
    .ifNotExists()
    .addColumn('name', 'text', (col) => col.primaryKey())
    .addColumn('executed_at', 'text', (col) => col.notNull())
    .execute();
}

async function getExecutedMigrations(): Promise<string[]> {
  await ensureMigrationsTable();
  const result = await db.selectFrom('migrations' as any).select('name').execute();
  return result.map((r) => r.name);
}

async function up(): Promise<void> {
  const migrations = await loadMigrations();
  const executed = await getExecutedMigrations();

  for (const migration of migrations) {
    if (!executed.includes(migration.name)) {
      console.log(`Running migration: ${migration.name}`);
      await migration.up(db);
      await db
        .insertInto('migrations' as any)
        .values({ name: migration.name, executed_at: new Date().toISOString() })
        .execute();
      console.log(`✓ ${migration.name} completed`);
    }
  }

  console.log('All migrations completed');
}

async function down(): Promise<void> {
  const migrations = await loadMigrations();
  const executed = await getExecutedMigrations();

  const lastMigration = migrations.reverse().find((m) => executed.includes(m.name));

  if (!lastMigration) {
    console.log('No migrations to rollback');
    return;
  }

  console.log(`Rolling back migration: ${lastMigration.name}`);
  await lastMigration.down(db);
  await db.deleteFrom('migrations' as any).where('name', '=', lastMigration.name).execute();
  console.log(`✓ ${lastMigration.name} rolled back`);
}

async function status(): Promise<void> {
  const migrations = await loadMigrations();
  const executed = await getExecutedMigrations();

  console.log('\nMigration Status:');
  console.log('─'.repeat(50));

  for (const migration of migrations) {
    const status = executed.includes(migration.name) ? '✓ Applied' : '✗ Pending';
    console.log(`${status} ${migration.name}`);
  }

  console.log('─'.repeat(50));
  console.log(`Total: ${migrations.length} migrations (${executed.length} applied, ${migrations.length - executed.length} pending)\n`);
}

const command = process.argv[2];

switch (command) {
  case 'up':
    await up();
    break;
  case 'down':
    await down();
    break;
  case 'status':
    await status();
    break;
  default:
    console.log('Usage: tsx src/db/migrate.ts [up|down|status]');
    process.exit(1);
}

sqlite.close();
process.exit(0);
