import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database types
export interface ExpenseTable {
  id: number;
  date: string;
  custom_name: string | null;
  original_title: string;
  amount: number;
  payment_type: 'credit' | 'debit' | 'pix' | 'cash' | 'other';
  source: 'imported' | 'manual';
  vendor_name: string;
  category_id: number | null;
  import_session_id: number | null;
  installment_current: number | null;
  installment_total: number | null;
  created_at: string;
  updated_at: string;
  is_deleted: number;
}

export interface CategoryTable {
  id: number;
  name: string;
  description: string | null;
  is_user_defined: number;
  is_active: number;
  created_at: string;
}

export interface ImportSessionTable {
  id: number;
  filename: string;
  import_date: string;
  expenses_imported: number;
  expenses_failed: number;
  month: number;
  year: number;
  is_deleted?: number;
}

export interface Database {
  expenses: ExpenseTable;
  categories: CategoryTable;
  import_sessions: ImportSessionTable;
}

// Use in-memory database for tests, file-based for production
const dbPath = process.env.NODE_ENV === 'test'
  ? ':memory:'
  : (process.env.DATABASE_PATH || path.join(__dirname, '../../data/monetaire.db'));

const sqlite = new Database(dbPath);

// Enable SQLite optimizations
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('busy_timeout = 5000');

export const db = new Kysely<Database>({
  dialect: new SqliteDialect({
    database: sqlite,
  }),
});

export { sqlite };
