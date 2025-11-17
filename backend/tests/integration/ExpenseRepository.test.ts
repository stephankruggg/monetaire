import { describe, it, expect, beforeEach } from 'vitest';
import { db, seedCategories } from '../setup.js';
import { ExpenseRepository } from '../../src/models/ExpenseRepository.js';

describe('ExpenseRepository Month/Year Filtering', () => {
  let repository: ExpenseRepository;

  beforeEach(async () => {
    await seedCategories();
    repository = new ExpenseRepository(db);
  });

  it('should filter expenses by month and year', async () => {
    // Create expenses in different months
    await repository.create({
      date: '2025-10-15',
      originalTitle: 'October Expense',
      vendorName: 'Test Vendor',
      amount: 100,
      paymentType: 'credit',
      source: 'manual',
    });

    await repository.create({
      date: '2025-11-15',
      originalTitle: 'November Expense',
      vendorName: 'Test Vendor',
      amount: 200,
      paymentType: 'credit',
      source: 'manual',
    });

    await repository.create({
      date: '2025-11-20',
      originalTitle: 'Another November Expense',
      vendorName: 'Test Vendor',
      amount: 150,
      paymentType: 'debit',
      source: 'manual',
    });

    // Filter for November 2025 (sorted by date desc by default)
    const novemberExpenses = await repository.findAll({
      month: 11,
      year: 2025,
    });

    expect(novemberExpenses).toHaveLength(2);
    // Sorted by date descending, so Nov 20 comes before Nov 15
    expect(novemberExpenses[0].originalTitle).toBe('Another November Expense');
    expect(novemberExpenses[1].originalTitle).toBe('November Expense');
  });

  it('should filter expenses by year only', async () => {
    // Create expenses in different years
    await repository.create({
      date: '2024-11-15',
      originalTitle: '2024 Expense',
      vendorName: 'Test Vendor',
      amount: 100,
      paymentType: 'credit',
      source: 'manual',
    });

    await repository.create({
      date: '2025-01-15',
      originalTitle: '2025 Jan Expense',
      vendorName: 'Test Vendor',
      amount: 200,
      paymentType: 'credit',
      source: 'manual',
    });

    await repository.create({
      date: '2025-11-20',
      originalTitle: '2025 Nov Expense',
      vendorName: 'Test Vendor',
      amount: 150,
      paymentType: 'debit',
      source: 'manual',
    });

    // Filter for 2025 only (all months)
    const expenses2025 = await repository.findAll({
      year: 2025,
    });

    expect(expenses2025).toHaveLength(2);
    expect(expenses2025.every(e => e.date.startsWith('2025'))).toBe(true);
  });

  it('should return all expenses when no month/year filter provided', async () => {
    // Create expenses in different months and years
    await repository.create({
      date: '2024-11-15',
      originalTitle: '2024 Expense',
      vendorName: 'Test Vendor',
      amount: 100,
      paymentType: 'credit',
      source: 'manual',
    });

    await repository.create({
      date: '2025-11-15',
      originalTitle: '2025 Expense',
      vendorName: 'Test Vendor',
      amount: 200,
      paymentType: 'credit',
      source: 'manual',
    });

    // No filter - should return all
    const allExpenses = await repository.findAll();

    expect(allExpenses).toHaveLength(2);
  });

  it('should handle edge cases with first and last day of month', async () => {
    // Create expenses on first and last day of November
    await repository.create({
      date: '2025-11-01',
      originalTitle: 'First Day',
      vendorName: 'Test Vendor',
      amount: 100,
      paymentType: 'credit',
      source: 'manual',
    });

    await repository.create({
      date: '2025-11-30',
      originalTitle: 'Last Day',
      vendorName: 'Test Vendor',
      amount: 200,
      paymentType: 'credit',
      source: 'manual',
    });

    await repository.create({
      date: '2025-10-31',
      originalTitle: 'Previous Month',
      vendorName: 'Test Vendor',
      amount: 150,
      paymentType: 'debit',
      source: 'manual',
    });

    await repository.create({
      date: '2025-12-01',
      originalTitle: 'Next Month',
      vendorName: 'Test Vendor',
      amount: 150,
      paymentType: 'debit',
      source: 'manual',
    });

    // Filter for November 2025 (sorted by date desc by default)
    const novemberExpenses = await repository.findAll({
      month: 11,
      year: 2025,
    });

    expect(novemberExpenses).toHaveLength(2);
    // Sorted by date descending, so Nov 30 comes before Nov 1
    expect(novemberExpenses[0].originalTitle).toBe('Last Day');
    expect(novemberExpenses[1].originalTitle).toBe('First Day');
  });

  it('should combine month/year filter with other filters', async () => {
    // Create expenses with different attributes
    await repository.create({
      date: '2025-11-15',
      originalTitle: 'Credit Expense',
      vendorName: 'Vendor A',
      amount: 100,
      paymentType: 'credit',
      source: 'manual',
    });

    await repository.create({
      date: '2025-11-16',
      originalTitle: 'Debit Expense',
      vendorName: 'Vendor B',
      amount: 200,
      paymentType: 'debit',
      source: 'manual',
    });

    await repository.create({
      date: '2025-11-17',
      originalTitle: 'Another Credit',
      vendorName: 'Vendor A',
      amount: 150,
      paymentType: 'credit',
      source: 'manual',
    });

    // Filter for November 2025 + credit payment type
    const filteredExpenses = await repository.findAll({
      month: 11,
      year: 2025,
      paymentType: 'credit',
    });

    expect(filteredExpenses).toHaveLength(2);
    expect(filteredExpenses.every(e => e.paymentType === 'credit')).toBe(true);
  });

  it('should return empty array when no expenses match month filter', async () => {
    // Create expense in October
    await repository.create({
      date: '2025-10-15',
      originalTitle: 'October Expense',
      vendorName: 'Test Vendor',
      amount: 100,
      paymentType: 'credit',
      source: 'manual',
    });

    // Filter for November (no results)
    const novemberExpenses = await repository.findAll({
      month: 11,
      year: 2025,
    });

    expect(novemberExpenses).toHaveLength(0);
  });
});

describe('ExpenseRepository Soft Delete', () => {
  let repository: ExpenseRepository;

  beforeEach(async () => {
    await seedCategories();
    repository = new ExpenseRepository(db);
  });

  it('should soft delete an expense', async () => {
    // Create an expense
    const expenseId = await repository.create({
      date: '2025-11-15',
      originalTitle: 'Test Expense',
      vendorName: 'Test Vendor',
      amount: 100,
      paymentType: 'credit',
      source: 'manual',
    });

    // Verify expense exists
    const expense = await repository.findById(expenseId);
    expect(expense).not.toBeNull();
    expect(expense?.originalTitle).toBe('Test Expense');

    // Soft delete the expense
    await repository.softDelete(expenseId);

    // Verify expense is no longer returned by findById
    const deletedExpense = await repository.findById(expenseId);
    expect(deletedExpense).toBeNull();
  });

  it('should exclude soft deleted expenses from findAll results', async () => {
    // Create multiple expenses
    const expense1Id = await repository.create({
      date: '2025-11-15',
      originalTitle: 'Expense 1',
      vendorName: 'Test Vendor',
      amount: 100,
      paymentType: 'credit',
      source: 'manual',
    });

    await repository.create({
      date: '2025-11-16',
      originalTitle: 'Expense 2',
      vendorName: 'Test Vendor',
      amount: 200,
      paymentType: 'credit',
      source: 'manual',
    });

    await repository.create({
      date: '2025-11-17',
      originalTitle: 'Expense 3',
      vendorName: 'Test Vendor',
      amount: 150,
      paymentType: 'credit',
      source: 'manual',
    });

    // Verify all 3 expenses are returned
    let allExpenses = await repository.findAll();
    expect(allExpenses).toHaveLength(3);

    // Soft delete first expense
    await repository.softDelete(expense1Id);

    // Verify only 2 expenses are returned
    allExpenses = await repository.findAll();
    expect(allExpenses).toHaveLength(2);
    expect(allExpenses.find(e => e.originalTitle === 'Expense 1')).toBeUndefined();
  });

  it('should exclude soft deleted expenses from filtered queries', async () => {
    // Create expenses in the same month
    const expense1Id = await repository.create({
      date: '2025-11-15',
      originalTitle: 'November Expense 1',
      vendorName: 'Vendor A',
      amount: 100,
      paymentType: 'credit',
      source: 'manual',
    });

    await repository.create({
      date: '2025-11-16',
      originalTitle: 'November Expense 2',
      vendorName: 'Vendor B',
      amount: 200,
      paymentType: 'credit',
      source: 'manual',
    });

    await repository.create({
      date: '2025-11-17',
      originalTitle: 'November Expense 3',
      vendorName: 'Vendor A',
      amount: 150,
      paymentType: 'credit',
      source: 'manual',
    });

    // Verify all 3 November expenses are returned
    let novemberExpenses = await repository.findAll({
      month: 11,
      year: 2025,
    });
    expect(novemberExpenses).toHaveLength(3);

    // Soft delete first expense
    await repository.softDelete(expense1Id);

    // Verify only 2 November expenses are returned
    novemberExpenses = await repository.findAll({
      month: 11,
      year: 2025,
    });
    expect(novemberExpenses).toHaveLength(2);

    // Verify filtering by vendor also excludes deleted
    const vendorAExpenses = await repository.findAll({
      month: 11,
      year: 2025,
      vendor: 'Vendor A',
    });
    expect(vendorAExpenses).toHaveLength(1);
    expect(vendorAExpenses[0].originalTitle).toBe('November Expense 3');
  });

  it('should handle soft deleting non-existent expense gracefully', async () => {
    // Attempt to soft delete an expense that doesn't exist
    const nonExistentId = 99999;

    // Should not throw error
    await expect(repository.softDelete(nonExistentId)).resolves.not.toThrow();

    // Verify no side effects
    const allExpenses = await repository.findAll();
    expect(allExpenses).toHaveLength(0);
  });

  it('should update updated_at timestamp when soft deleting', async () => {
    // Create an expense
    const expenseId = await repository.create({
      date: '2025-11-15',
      originalTitle: 'Test Expense',
      vendorName: 'Test Vendor',
      amount: 100,
      paymentType: 'credit',
      source: 'manual',
    });

    // Get original expense
    const originalExpense = await repository.findById(expenseId);
    const originalUpdatedAt = originalExpense?.updatedAt;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Soft delete the expense
    await repository.softDelete(expenseId);

    // Verify expense is marked as deleted in database (query directly)
    const result = await db
      .selectFrom('expenses')
      .select(['is_deleted', 'updated_at'])
      .where('id', '=', expenseId)
      .executeTakeFirst();

    expect(result?.is_deleted).toBe(1);
    expect(result?.updated_at).not.toBe(originalUpdatedAt);
  });
});

describe('ExpenseRepository Delete by Billing Cycle', () => {
  let repository: ExpenseRepository;

  beforeEach(async () => {
    await seedCategories();
    repository = new ExpenseRepository(db);
  });

  it('should delete all expenses from a specific billing cycle', async () => {
    // Create expenses in different billing cycles
    await repository.create({
      date: '2025-10-15',
      originalTitle: 'October Expense 1',
      vendorName: 'Test Vendor',
      amount: 100,
      paymentType: 'credit',
      source: 'manual',
      billingCycleMonth: 10,
      billingCycleYear: 2025,
    });

    await repository.create({
      date: '2025-10-20',
      originalTitle: 'October Expense 2',
      vendorName: 'Test Vendor',
      amount: 200,
      paymentType: 'credit',
      source: 'manual',
      billingCycleMonth: 10,
      billingCycleYear: 2025,
    });

    await repository.create({
      date: '2025-11-15',
      originalTitle: 'November Expense 1',
      vendorName: 'Test Vendor',
      amount: 150,
      paymentType: 'credit',
      source: 'manual',
      billingCycleMonth: 11,
      billingCycleYear: 2025,
    });

    // Verify all 3 expenses exist
    let allExpenses = await repository.findAll();
    expect(allExpenses).toHaveLength(3);

    // Delete October billing cycle
    await repository.deleteByBillingCycle(10, 2025);

    // Verify only November expense remains
    allExpenses = await repository.findAll();
    expect(allExpenses).toHaveLength(1);
    expect(allExpenses[0].originalTitle).toBe('November Expense 1');
    expect(allExpenses[0].billingCycleMonth).toBe(11);
  });

  it('should only delete expenses from the specified billing cycle month and year', async () => {
    // Create expenses in October 2024, October 2025, and November 2025
    await repository.create({
      date: '2024-10-15',
      originalTitle: 'October 2024 Expense',
      vendorName: 'Test Vendor',
      amount: 100,
      paymentType: 'credit',
      source: 'manual',
      billingCycleMonth: 10,
      billingCycleYear: 2024,
    });

    await repository.create({
      date: '2025-10-15',
      originalTitle: 'October 2025 Expense',
      vendorName: 'Test Vendor',
      amount: 200,
      paymentType: 'credit',
      source: 'manual',
      billingCycleMonth: 10,
      billingCycleYear: 2025,
    });

    await repository.create({
      date: '2025-11-15',
      originalTitle: 'November 2025 Expense',
      vendorName: 'Test Vendor',
      amount: 150,
      paymentType: 'credit',
      source: 'manual',
      billingCycleMonth: 11,
      billingCycleYear: 2025,
    });

    // Delete only October 2025
    await repository.deleteByBillingCycle(10, 2025);

    // Verify October 2024 and November 2025 remain
    const remainingExpenses = await repository.findAll();
    expect(remainingExpenses).toHaveLength(2);
    expect(remainingExpenses.find(e => e.billingCycleYear === 2024)).toBeDefined();
    expect(remainingExpenses.find(e => e.billingCycleMonth === 11)).toBeDefined();
    expect(remainingExpenses.find(e => e.billingCycleMonth === 10 && e.billingCycleYear === 2025)).toBeUndefined();
  });

  it('should handle deleting a billing cycle with no expenses gracefully', async () => {
    // Create expense in October
    await repository.create({
      date: '2025-10-15',
      originalTitle: 'October Expense',
      vendorName: 'Test Vendor',
      amount: 100,
      paymentType: 'credit',
      source: 'manual',
      billingCycleMonth: 10,
      billingCycleYear: 2025,
    });

    // Delete November (which has no expenses)
    const deletedCount = await repository.deleteByBillingCycle(11, 2025);

    // Should return 0 deleted
    expect(deletedCount).toBe(0);

    // October expense should still exist
    const allExpenses = await repository.findAll();
    expect(allExpenses).toHaveLength(1);
    expect(allExpenses[0].billingCycleMonth).toBe(10);
  });

  it('should soft delete (mark is_deleted) instead of hard delete', async () => {
    // Create expense
    const expenseId = await repository.create({
      date: '2025-10-15',
      originalTitle: 'October Expense',
      vendorName: 'Test Vendor',
      amount: 100,
      paymentType: 'credit',
      source: 'manual',
      billingCycleMonth: 10,
      billingCycleYear: 2025,
    });

    // Delete billing cycle
    await repository.deleteByBillingCycle(10, 2025);

    // Verify expense is marked as deleted (not hard deleted)
    const result = await db
      .selectFrom('expenses')
      .select(['id', 'is_deleted'])
      .where('id', '=', expenseId)
      .executeTakeFirst();

    expect(result).toBeDefined();
    expect(result?.is_deleted).toBe(1);

    // Verify it's not returned by findAll (which filters is_deleted)
    const allExpenses = await repository.findAll();
    expect(allExpenses).toHaveLength(0);
  });
});

describe('ExpenseRepository Delete by Import Session (Bug Fix: Cross-Month Cycles)', () => {
  let repository: ExpenseRepository;
  let sessionRepository: any; // ImportSessionRepository

  beforeEach(async () => {
    await seedCategories();
    repository = new ExpenseRepository(db);
    // Import session repository for creating sessions
    const { ImportSessionRepository } = await import('../../src/models/ImportSessionRepository.js');
    sessionRepository = new ImportSessionRepository(db);
  });

  it('should delete all expenses from an import session spanning two months (Sep 12 - Oct 11)', async () => {
    // Create an import session for October 2025 statement
    const sessionId = await sessionRepository.create({
      filename: 'oct-2025-statement.csv',
      month: 10,
      year: 2025,
      billingCycleCloseDay: 11,
    });

    // Add expenses with dates spanning September 12 - October 11 (October statement)
    await repository.create({
      date: '2025-09-12', // September date
      originalTitle: 'Sep Expense in Oct Statement',
      vendorName: 'Test Vendor',
      amount: 100,
      paymentType: 'credit',
      source: 'imported',
      importSessionId: sessionId,
      billingCycleMonth: 10, // October billing cycle
      billingCycleYear: 2025,
    });

    await repository.create({
      date: '2025-09-25', // September date
      originalTitle: 'Another Sep Expense',
      vendorName: 'Test Vendor',
      amount: 150,
      paymentType: 'credit',
      source: 'imported',
      importSessionId: sessionId,
      billingCycleMonth: 10,
      billingCycleYear: 2025,
    });

    await repository.create({
      date: '2025-10-05', // October date
      originalTitle: 'Oct Expense',
      vendorName: 'Test Vendor',
      amount: 200,
      paymentType: 'credit',
      source: 'imported',
      importSessionId: sessionId,
      billingCycleMonth: 10,
      billingCycleYear: 2025,
    });

    await repository.create({
      date: '2025-10-11', // October date (last day of cycle)
      originalTitle: 'Last Day Expense',
      vendorName: 'Test Vendor',
      amount: 75,
      paymentType: 'credit',
      source: 'imported',
      importSessionId: sessionId,
      billingCycleMonth: 10,
      billingCycleYear: 2025,
    });

    // Verify all 4 expenses exist
    let allExpenses = await repository.findAll();
    expect(allExpenses).toHaveLength(4);

    // Verify expenses have the correct import_session_id
    const expensesWithSession = allExpenses.filter(e => e.importSessionId === sessionId);
    expect(expensesWithSession).toHaveLength(4);

    // Delete by import session (NEW METHOD - to be implemented)
    const deletedCount = await repository.deleteByImportSession(sessionId);

    // Verify ALL 4 expenses were deleted (including September dates)
    expect(deletedCount).toBe(4);

    allExpenses = await repository.findAll();
    expect(allExpenses).toHaveLength(0);
  });

  it('should only delete expenses from the specified import session when sessions overlap', async () => {
    // Create September 2025 session
    const sepSessionId = await sessionRepository.create({
      filename: 'sep-2025-statement.csv',
      month: 9,
      year: 2025,
      billingCycleCloseDay: 11,
    });

    // Create October 2025 session
    const octSessionId = await sessionRepository.create({
      filename: 'oct-2025-statement.csv',
      month: 10,
      year: 2025,
      billingCycleCloseDay: 11,
    });

    // September session: Aug 12 - Sep 11
    await repository.create({
      date: '2025-08-20',
      originalTitle: 'Sep Statement Expense',
      vendorName: 'Test Vendor',
      amount: 100,
      paymentType: 'credit',
      source: 'imported',
      importSessionId: sepSessionId,
      billingCycleMonth: 9,
      billingCycleYear: 2025,
    });

    // October session: Sep 12 - Oct 11 (overlaps with Sep in calendar month)
    await repository.create({
      date: '2025-09-15', // September date but in October statement
      originalTitle: 'Oct Statement Expense 1',
      vendorName: 'Test Vendor',
      amount: 150,
      paymentType: 'credit',
      source: 'imported',
      importSessionId: octSessionId,
      billingCycleMonth: 10,
      billingCycleYear: 2025,
    });

    await repository.create({
      date: '2025-10-05', // October date in October statement
      originalTitle: 'Oct Statement Expense 2',
      vendorName: 'Test Vendor',
      amount: 200,
      paymentType: 'credit',
      source: 'imported',
      importSessionId: octSessionId,
      billingCycleMonth: 10,
      billingCycleYear: 2025,
    });

    // Verify all 3 expenses exist
    let allExpenses = await repository.findAll();
    expect(allExpenses).toHaveLength(3);

    // Delete only October session
    const deletedCount = await repository.deleteByImportSession(octSessionId);

    // Verify only 2 October session expenses were deleted
    expect(deletedCount).toBe(2);

    // Verify September session expense still exists
    allExpenses = await repository.findAll();
    expect(allExpenses).toHaveLength(1);
    expect(allExpenses[0].originalTitle).toBe('Sep Statement Expense');
    expect(allExpenses[0].importSessionId).toBe(sepSessionId);
  });

  it('should handle deleting an import session with no expenses gracefully', async () => {
    // Create session with no expenses
    const sessionId = await sessionRepository.create({
      filename: 'empty-statement.csv',
      month: 11,
      year: 2025,
      billingCycleCloseDay: 11,
    });

    // Delete session with no expenses
    const deletedCount = await repository.deleteByImportSession(sessionId);

    // Should return 0
    expect(deletedCount).toBe(0);
  });
});
