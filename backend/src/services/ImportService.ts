import { parseNubankCSV } from '../utils/csv-parser.js';
import { ExpenseRepository, expenseRepository } from '../models/ExpenseRepository.js';
import { ImportSessionRepository, importSessionRepository } from '../models/ImportSessionRepository.js';
import { billingCycleService } from './BillingCycleService.js';
import { CustomNameService } from './CustomNameService.js';
import type { ImportResult } from '../../../shared/types/index.js';
import type { Kysely } from 'kysely';

export async function importCSVExpenses(
  csvContent: string,
  filename: string,
  month: number,
  year: number,
  db?: Kysely<any>,
  billingCycleCloseDay: number = 11
): Promise<ImportResult> {
  // Use injected database or default repositories
  const expenseRepo = db ? new ExpenseRepository(db) : expenseRepository;
  const importSessionRepo = db ? new ImportSessionRepository(db) : importSessionRepository;
  const customNameService = db ? new CustomNameService(db) : new CustomNameService(db || (await import('../db/database.js')).db);

  // Create import session
  const sessionId = await importSessionRepo.create({
    filename,
    month,
    year,
    billingCycleCloseDay,
  });

  // Parse CSV
  const parseResult = await parseNubankCSV(csvContent);

  // Import valid expenses with custom name lookup
  const expensesToImport = await Promise.all(
    parseResult.expenses.map(async (expense) => {
      // Calculate billing cycle for this expense
      const billingCycle = billingCycleService.calculateBillingCycle(
        expense.date,
        billingCycleCloseDay
      );

      // Try to find matching custom name for installment expenses
      let customName: string | null = null;
      if (expense.installmentCurrent && expense.installmentTotal) {
        customName = await customNameService.processExpense(
          expense.title,
          expense.amount,
          expense.vendorName
        );
      }

      return {
        date: expense.date,
        originalTitle: expense.title,
        customName, // Apply custom name if found
        amount: expense.amount,
        paymentType: 'credit' as const, // Nubank CSV is credit card by default
        source: 'imported' as const,
        vendorName: expense.vendorName,
        importSessionId: sessionId,
        installmentCurrent: expense.installmentCurrent,
        installmentTotal: expense.installmentTotal,
        billingCycleMonth: billingCycle.month,
        billingCycleYear: billingCycle.year,
      };
    })
  );

  if (expensesToImport.length > 0) {
    await expenseRepo.createMany(expensesToImport);
  }

  // Update import session with counts
  await importSessionRepo.updateCounts(
    sessionId,
    parseResult.expenses.length,
    parseResult.errors.length
  );

  return {
    sessionId,
    imported: parseResult.expenses.length,
    failed: parseResult.errors.length,
    errors: parseResult.errors,
  };
}
