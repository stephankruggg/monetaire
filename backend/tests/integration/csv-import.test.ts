import { describe, it, expect, beforeEach } from 'vitest';
import { db, seedCategories } from '../setup.js';
import { importCSVExpenses } from '../../src/services/ImportService.js';

describe('CSV Import Integration', () => {
  beforeEach(async () => {
    await seedCategories();
  });

  it('should import valid CSV and create import session and expenses', async () => {
    const csvContent = `date,title,amount
2025-10-10,Test Expense,10.50
2025-10-11,Another Expense,25.00`;

    const result = await importCSVExpenses(csvContent, 'test.csv', 10, 2025, db);

    // Check import result
    expect(result.imported).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(result.sessionId).toBeGreaterThan(0);

    // Verify import session was created
    const session = await db
      .selectFrom('import_sessions')
      .selectAll()
      .where('id', '=', result.sessionId)
      .executeTakeFirst();

    expect(session).toBeDefined();
    expect(session?.filename).toBe('test.csv');
    expect(session?.expenses_imported).toBe(2);
    expect(session?.expenses_failed).toBe(0);
    expect(session?.month).toBe(10);
    expect(session?.year).toBe(2025);

    // Verify expenses were created
    const expenses = await db
      .selectFrom('expenses')
      .selectAll()
      .where('import_session_id', '=', result.sessionId)
      .execute();

    expect(expenses).toHaveLength(2);
    expect(expenses[0].original_title).toBe('Test Expense');
    expect(expenses[0].amount).toBe(10.50);
    expect(expenses[0].payment_type).toBe('credit');
    expect(expenses[0].source).toBe('imported');
    expect(expenses[1].original_title).toBe('Another Expense');
    expect(expenses[1].amount).toBe(25.00);
  });

  it('should handle installment expenses correctly', async () => {
    const csvContent = `date,title,amount
2025-09-11,Amazon Marketplace - Parcela 2/3,33.39
2025-09-11,Shopping Iguatemi - Parcela 1/5,193.99`;

    const result = await importCSVExpenses(csvContent, 'installments.csv', 9, 2025, db);

    expect(result.imported).toBe(2);

    const expenses = await db
      .selectFrom('expenses')
      .selectAll()
      .where('import_session_id', '=', result.sessionId)
      .execute();

    expect(expenses[0].installment_current).toBe(2);
    expect(expenses[0].installment_total).toBe(3);
    expect(expenses[0].vendor_name).toBe('Amazon Marketplace');

    expect(expenses[1].installment_current).toBe(1);
    expect(expenses[1].installment_total).toBe(5);
    expect(expenses[1].vendor_name).toBe('Shopping Iguatemi');
  });

  it('should handle partial import with some failed rows', async () => {
    const csvContent = `date,title,amount
2025-10-10,Valid Expense,10.50
invalid-date,Bad Expense,25.00
2025-10-12,Another Valid,30.00`;

    const result = await importCSVExpenses(csvContent, 'partial.csv', 10, 2025, db);

    expect(result.imported).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain('Invalid date');

    // Verify only valid expenses were imported
    const expenses = await db
      .selectFrom('expenses')
      .selectAll()
      .where('import_session_id', '=', result.sessionId)
      .execute();

    expect(expenses).toHaveLength(2);
    expect(expenses[0].original_title).toBe('Valid Expense');
    expect(expenses[1].original_title).toBe('Another Valid');
  });

  it('should handle empty CSV', async () => {
    const csvContent = `date,title,amount`;

    const result = await importCSVExpenses(csvContent, 'empty.csv', 10, 2025, db);

    expect(result.imported).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.errors).toHaveLength(0);

    // Session should still be created
    const session = await db
      .selectFrom('import_sessions')
      .selectAll()
      .where('id', '=', result.sessionId)
      .executeTakeFirst();

    expect(session).toBeDefined();
    expect(session?.expenses_imported).toBe(0);
  });

  it('should handle CSV with escaped quotes', async () => {
    const csvContent = `date,title,amount
2025-10-10,"IOF de ""Rch-Kagi.Com""",1.94`;

    const result = await importCSVExpenses(csvContent, 'quotes.csv', 10, 2025, db);

    expect(result.imported).toBe(1);

    const expense = await db
      .selectFrom('expenses')
      .selectAll()
      .where('import_session_id', '=', result.sessionId)
      .executeTakeFirst();

    expect(expense?.original_title).toBe('IOF de "Rch-Kagi.Com"');
    expect(expense?.vendor_name).toBe('Rch-Kagi.Com');
  });

  it('should extract vendor names correctly', async () => {
    const csvContent = `date,title,amount
2025-10-10,Mp *Wshpatinetes,10.27
2025-10-04,iFood - NuPay,25.98`;

    const result = await importCSVExpenses(csvContent, 'vendors.csv', 10, 2025, db);

    const expenses = await db
      .selectFrom('expenses')
      .selectAll()
      .where('import_session_id', '=', result.sessionId)
      .execute();

    expect(expenses[0].vendor_name).toBe('Mp *Wshpatinetes');
    expect(expenses[1].vendor_name).toBe('iFood');
  });

  it('should handle negative amounts (refunds)', async () => {
    const csvContent = `date,title,amount
2025-09-20,Pagamento recebido,-1900.00`;

    const result = await importCSVExpenses(csvContent, 'refund.csv', 9, 2025, db);

    expect(result.imported).toBe(1);

    const expense = await db
      .selectFrom('expenses')
      .selectAll()
      .where('import_session_id', '=', result.sessionId)
      .executeTakeFirst();

    expect(expense?.amount).toBe(-1900.00);
  });
});
