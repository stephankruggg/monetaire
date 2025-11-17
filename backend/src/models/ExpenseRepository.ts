import { db as defaultDb } from '../db/database.js';
import type { Expense } from '../../../shared/types/index.js';
import type { Kysely } from 'kysely';

export interface CreateExpenseData {
  date: string;
  originalTitle: string;
  amount: number;
  paymentType: 'credit' | 'debit' | 'pix' | 'cash' | 'other';
  source: 'imported' | 'manual';
  vendorName: string;
  customName?: string;
  categoryId?: number;
  importSessionId?: number;
  installmentCurrent?: number;
  installmentTotal?: number;
  billingCycleMonth?: number;
  billingCycleYear?: number;
}

export class ExpenseRepository {
  constructor(private db: Kysely<any> = defaultDb) {}
  async create(data: CreateExpenseData): Promise<number> {
    const result = await this.db
      .insertInto('expenses')
      .values({
        date: data.date,
        original_title: data.originalTitle,
        amount: data.amount,
        payment_type: data.paymentType,
        source: data.source,
        vendor_name: data.vendorName,
        custom_name: data.customName || null,
        category_id: data.categoryId || null,
        import_session_id: data.importSessionId || null,
        installment_current: data.installmentCurrent || null,
        installment_total: data.installmentTotal || null,
        billing_cycle_month: data.billingCycleMonth || null,
        billing_cycle_year: data.billingCycleYear || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    return result.id;
  }

  async createMany(expenses: CreateExpenseData[]): Promise<number[]> {
    const ids: number[] = [];

    for (const expense of expenses) {
      const id = await this.create(expense);
      ids.push(id);
    }

    return ids;
  }

  async findById(id: number): Promise<Expense | null> {
    const row = await this.db
      .selectFrom('expenses')
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .select([
        'expenses.id',
        'expenses.date',
        'expenses.custom_name',
        'expenses.original_title',
        'expenses.amount',
        'expenses.payment_type',
        'expenses.source',
        'expenses.vendor_name',
        'expenses.category_id',
        'expenses.import_session_id',
        'expenses.installment_current',
        'expenses.installment_total',
        'expenses.billing_cycle_month',
        'expenses.billing_cycle_year',
        'expenses.created_at',
        'expenses.updated_at',
        'categories.id as category__id',
        'categories.name as category__name',
        'categories.description as category__description',
        'categories.is_user_defined as category__is_user_defined',
        'categories.is_active as category__is_active',
        'categories.created_at as category__created_at',
      ])
      .where('expenses.id', '=', id)
      .where('expenses.is_deleted', '=', 0)
      .executeTakeFirst();

    if (!row) return null;

    return this.mapToExpense(row);
  }

  async updateCustomName(id: number, customName: string | null): Promise<void> {
    await this.db
      .updateTable('expenses')
      .set({
        custom_name: customName,
        updated_at: new Date().toISOString(),
      })
      .where('id', '=', id)
      .where('is_deleted', '=', 0)
      .execute();
  }

  async softDelete(id: number): Promise<void> {
    await this.db
      .updateTable('expenses')
      .set({
        is_deleted: 1,
        updated_at: new Date().toISOString(),
      })
      .where('id', '=', id)
      .execute();
  }

  async deleteByBillingCycle(month: number, year: number): Promise<number> {
    const result = await this.db
      .updateTable('expenses')
      .set({
        is_deleted: 1,
        updated_at: new Date().toISOString(),
      })
      .where('billing_cycle_month', '=', month)
      .where('billing_cycle_year', '=', year)
      .where('is_deleted', '=', 0) // Only delete non-deleted expenses
      .execute();

    return Number(result.numUpdatedRows || 0);
  }

  async deleteByImportSession(sessionId: number): Promise<number> {
    const result = await this.db
      .updateTable('expenses')
      .set({
        is_deleted: 1,
        updated_at: new Date().toISOString(),
      })
      .where('import_session_id', '=', sessionId)
      .where('is_deleted', '=', 0) // Only delete non-deleted expenses
      .execute();

    // Extract the update result - Kysely returns an array with one UpdateResult object
    const updateResult = Array.isArray(result) ? result[0] : result;
    return Number(updateResult?.numUpdatedRows ?? updateResult?.numAffectedRows ?? 0);
  }

  async findAll(filters?: {
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
    categoryId?: number;
    vendor?: string;
    paymentType?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<Expense[]> {
    let query = this.db
      .selectFrom('expenses')
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .select([
        'expenses.id',
        'expenses.date',
        'expenses.custom_name',
        'expenses.original_title',
        'expenses.amount',
        'expenses.payment_type',
        'expenses.source',
        'expenses.vendor_name',
        'expenses.category_id',
        'expenses.import_session_id',
        'expenses.installment_current',
        'expenses.installment_total',
        'expenses.billing_cycle_month',
        'expenses.billing_cycle_year',
        'expenses.created_at',
        'expenses.updated_at',
        'categories.id as category__id',
        'categories.name as category__name',
        'categories.description as category__description',
        'categories.is_user_defined as category__is_user_defined',
        'categories.is_active as category__is_active',
        'categories.created_at as category__created_at',
      ]);

    // Month/year filtering takes precedence over startDate/endDate
    if (filters?.month !== undefined && filters?.year !== undefined) {
      // Filter for specific month and year
      const startDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`;
      const endDate = new Date(filters.year, filters.month, 0).toISOString().split('T')[0];
      query = query
        .where('expenses.date', '>=', startDate)
        .where('expenses.date', '<=', endDate);
    } else if (filters?.year !== undefined) {
      // Filter for entire year
      const startDate = `${filters.year}-01-01`;
      const endDate = `${filters.year}-12-31`;
      query = query
        .where('expenses.date', '>=', startDate)
        .where('expenses.date', '<=', endDate);
    } else {
      // Use startDate/endDate filters if month/year not provided
      if (filters?.startDate) {
        query = query.where('expenses.date', '>=', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.where('expenses.date', '<=', filters.endDate);
      }
    }

    if (filters?.categoryId) {
      query = query.where('expenses.category_id', '=', filters.categoryId);
    }

    if (filters?.vendor) {
      query = query.where('expenses.vendor_name', 'like', `%${filters.vendor}%`);
    }

    if (filters?.paymentType) {
      query = query.where('expenses.payment_type', '=', filters.paymentType);
    }

    // Filter out soft-deleted expenses
    query = query.where('expenses.is_deleted', '=', 0);

    const sortBy = filters?.sortBy || 'date';
    const sortOrder = filters?.sortOrder || 'desc';

    query = query.orderBy(`expenses.${sortBy}` as any, sortOrder);

    const rows = await query.execute();

    return rows.map((row) => this.mapToExpense(row));
  }

  private mapToExpense(row: any): Expense {
    const expense: Expense = {
      id: row.id,
      date: row.date,
      customName: row.custom_name || undefined,
      originalTitle: row.original_title,
      amount: row.amount,
      paymentType: row.payment_type,
      source: row.source,
      vendorName: row.vendor_name,
      categoryId: row.category_id || undefined,
      importSessionId: row.import_session_id || undefined,
      installmentCurrent: row.installment_current || undefined,
      installmentTotal: row.installment_total || undefined,
      billingCycleMonth: row.billing_cycle_month || undefined,
      billingCycleYear: row.billing_cycle_year || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    if (row.category__id) {
      expense.category = {
        id: row.category__id,
        name: row.category__name,
        description: row.category__description || undefined,
        isUserDefined: Boolean(row.category__is_user_defined),
        isActive: Boolean(row.category__is_active),
        createdAt: row.category__created_at,
      };
    }

    return expense;
  }
}

export const expenseRepository = new ExpenseRepository();
