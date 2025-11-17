import { db as defaultDb } from '../db/database.js';
import type { ImportSession } from '../../../shared/types/index.js';
import type { Kysely } from 'kysely';

export interface CreateImportSessionData {
  filename: string;
  month: number;
  year: number;
  billingCycleCloseDay?: number;
}

export class ImportSessionRepository {
  constructor(private db: Kysely<any> = defaultDb) {}
  async create(data: CreateImportSessionData): Promise<number> {
    const result = await this.db
      .insertInto('import_sessions')
      .values({
        filename: data.filename,
        import_date: new Date().toISOString(),
        expenses_imported: 0,
        expenses_failed: 0,
        month: data.month,
        year: data.year,
        billing_cycle_close_day: data.billingCycleCloseDay ?? 11,
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    return result.id;
  }

  async updateCounts(sessionId: number, imported: number, failed: number): Promise<void> {
    await this.db
      .updateTable('import_sessions')
      .set({
        expenses_imported: imported,
        expenses_failed: failed,
      })
      .where('id', '=', sessionId)
      .execute();
  }

  async findById(id: number): Promise<ImportSession | null> {
    const row = await this.db
      .selectFrom('import_sessions')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!row) return null;

    return {
      id: row.id,
      filename: row.filename,
      importDate: row.import_date,
      expensesImported: row.expenses_imported,
      expensesFailed: row.expenses_failed,
      month: row.month,
      year: row.year,
      billingCycleCloseDay: row.billing_cycle_close_day,
    };
  }

  async findAll(limit: number = 20): Promise<ImportSession[]> {
    const rows = await this.db
      .selectFrom('import_sessions')
      .selectAll()
      .where('is_deleted', '=', 0) // Only return active (non-deleted) sessions
      .orderBy('import_date', 'desc')
      .limit(limit)
      .execute();

    return rows.map((row) => ({
      id: row.id,
      filename: row.filename,
      importDate: row.import_date,
      expensesImported: row.expenses_imported,
      expensesFailed: row.expenses_failed,
      month: row.month,
      year: row.year,
      billingCycleCloseDay: row.billing_cycle_close_day,
    }));
  }

  async checkDuplicateImport(filename: string): Promise<ImportSession | null> {
    const row = await this.db
      .selectFrom('import_sessions')
      .selectAll()
      .where('filename', '=', filename)
      .where('is_deleted', '=', 0) // Only check active (non-deleted) sessions
      .orderBy('import_date', 'desc')
      .executeTakeFirst();

    if (!row) return null;

    return {
      id: row.id,
      filename: row.filename,
      importDate: row.import_date,
      expensesImported: row.expenses_imported,
      expensesFailed: row.expenses_failed,
      month: row.month,
      year: row.year,
      billingCycleCloseDay: row.billing_cycle_close_day,
    };
  }

  async softDelete(sessionId: number): Promise<void> {
    await this.db
      .updateTable('import_sessions')
      .set({ is_deleted: 1 })
      .where('id', '=', sessionId)
      .execute();
  }
}

export const importSessionRepository = new ImportSessionRepository();
