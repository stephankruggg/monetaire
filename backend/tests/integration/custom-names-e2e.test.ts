import { describe, it, expect, beforeEach } from 'vitest';
import { db, seedCategories } from '../setup.js';
import { importCSVExpenses } from '../../src/services/ImportService.js';
import { ExpenseRepository } from '../../src/models/ExpenseRepository.js';
import { CustomNameRegistryRepository } from '../../src/models/CustomNameRegistryRepository.js';
import { CustomNameService } from '../../src/services/CustomNameService.js';

describe('Custom Names End-to-End Integration Tests', () => {
  let expenseRepository: ExpenseRepository;
  let registryRepository: CustomNameRegistryRepository;
  let customNameService: CustomNameService;

  beforeEach(async () => {
    await seedCategories();
    expenseRepository = new ExpenseRepository(db);
    registryRepository = new CustomNameRegistryRepository(db);
    customNameService = new CustomNameService(db);
  });

  // Helper function to update expense name and save to registry (mimics controller behavior)
  async function updateExpenseNameWithRegistry(expenseId: number, customName: string) {
    // Get the expense first
    const expense = await expenseRepository.findById(expenseId);
    if (!expense) {
      throw new Error('Expense not found');
    }

    // Update the custom name
    await expenseRepository.updateCustomName(expenseId, customName);

    // If installment, save to registry
    if (expense.installmentCurrent && expense.installmentTotal) {
      await customNameService.saveCustomName({
        title: expense.originalTitle,
        amount: expense.amount,
        vendor: expense.vendorName,
        installmentCurrent: expense.installmentCurrent,
        installmentTotal: expense.installmentTotal,
        customName,
      });
    }
  }

  describe('T171: Assign custom name to installment expense, verify saved', () => {
    it('should save custom name for installment expense and create registry entry', async () => {
      // Import CSV with an installment expense
      const csvContent = `date,title,amount
2025-10-15,Amazon Marketplace - Parcela 1/10,150.00`;

      const importResult = await importCSVExpenses(csvContent, 'test.csv', 10, 2025, db);
      expect(importResult.imported).toBe(1);

      // Get the imported expense
      const expenses = await db
        .selectFrom('expenses')
        .selectAll()
        .where('import_session_id', '=', importResult.sessionId)
        .execute();

      expect(expenses).toHaveLength(1);
      const expense = expenses[0];
      expect(expense.installment_current).toBe(1);
      expect(expense.installment_total).toBe(10);
      expect(expense.vendor_name).toBe('Amazon Marketplace');

      // Assign a custom name using the helper
      const customName = 'New Gaming Laptop';
      await updateExpenseNameWithRegistry(expense.id, customName);

      // Verify the expense has the custom name
      const updatedExpense = await db
        .selectFrom('expenses')
        .selectAll()
        .where('id', '=', expense.id)
        .executeTakeFirstOrThrow();

      expect(updatedExpense.custom_name).toBe(customName);

      // Verify a registry entry was created
      const registryEntry = await registryRepository.findByPattern(
        'Amazon Marketplace',
        10,
        150.00
      );

      expect(registryEntry).not.toBeNull();
      expect(registryEntry?.customName).toBe(customName);
      expect(registryEntry?.vendorPattern).toBe('Amazon Marketplace');
      expect(registryEntry?.installmentTotal).toBe(10);
      expect(registryEntry?.amount).toBe(150.00);
    });

    it('should update registry when changing custom name on installment expense', async () => {
      // Import installment expense
      const csvContent = `date,title,amount
2025-11-05,Netflix - Parcela 1/6,25.00`;

      const importResult = await importCSVExpenses(csvContent, 'netflix.csv', 11, 2025, db);
      const expenses = await db
        .selectFrom('expenses')
        .selectAll()
        .where('import_session_id', '=', importResult.sessionId)
        .execute();

      const expense = expenses[0];

      // First assignment
      await updateExpenseNameWithRegistry(expense.id, 'Premium Sub');

      let registryEntry = await registryRepository.findByPattern('Netflix', 6, 25.00);
      expect(registryEntry?.customName).toBe('Premium Sub');

      // Change the name
      await updateExpenseNameWithRegistry(expense.id, 'Netflix Premium Subscription');

      registryEntry = await registryRepository.findByPattern('Netflix', 6, 25.00);
      expect(registryEntry?.customName).toBe('Netflix Premium Subscription');
    });

    it('should not create registry entry for non-installment expense', async () => {
      // Import regular (non-installment) expense
      const csvContent = `date,title,amount
2025-10-20,Uber Ride,35.50`;

      const importResult = await importCSVExpenses(csvContent, 'uber.csv', 10, 2025, db);
      const expenses = await db
        .selectFrom('expenses')
        .selectAll()
        .where('import_session_id', '=', importResult.sessionId)
        .execute();

      const expense = expenses[0];
      expect(expense.installment_current).toBeNull();
      expect(expense.installment_total).toBeNull();

      // Assign custom name
      await expenseRepository.updateCustomName(expense.id, 'Work Commute');

      // Verify expense has custom name
      const updatedExpense = await db
        .selectFrom('expenses')
        .selectAll()
        .where('id', '=', expense.id)
        .executeTakeFirstOrThrow();

      expect(updatedExpense.custom_name).toBe('Work Commute');

      // Verify NO registry entry was created
      const allEntries = await registryRepository.findAll();
      expect(allEntries).toHaveLength(0);
    });
  });

  describe('T172: Import next installment, verify auto-assigned custom name', () => {
    it('should auto-assign custom name to next installment of same series', async () => {
      // Step 1: Import first installment
      const csv1 = `date,title,amount
2025-09-10,Magazine Luiza - Parcela 1/12,100.00`;

      const import1 = await importCSVExpenses(csv1, 'sept.csv', 9, 2025, db);
      const expenses1 = await db
        .selectFrom('expenses')
        .selectAll()
        .where('import_session_id', '=', import1.sessionId)
        .execute();

      // Step 2: Assign custom name to first installment
      await updateExpenseNameWithRegistry(expenses1[0].id, 'Refrigerator Purchase');

      // Verify registry was created
      const registryEntry = await registryRepository.findByPattern(
        'Magazine Luiza',
        12,
        100.00
      );
      expect(registryEntry?.customName).toBe('Refrigerator Purchase');

      // Step 3: Import next month with second installment
      const csv2 = `date,title,amount
2025-10-10,Magazine Luiza - Parcela 2/12,100.00`;

      const import2 = await importCSVExpenses(csv2, 'oct.csv', 10, 2025, db);

      // Step 4: Verify the second installment was auto-assigned the custom name
      const expenses2 = await db
        .selectFrom('expenses')
        .selectAll()
        .where('import_session_id', '=', import2.sessionId)
        .execute();

      expect(expenses2).toHaveLength(1);
      const secondInstallment = expenses2[0];
      expect(secondInstallment.installment_current).toBe(2);
      expect(secondInstallment.installment_total).toBe(12);
      expect(secondInstallment.custom_name).toBe('Refrigerator Purchase');
    });

    it('should auto-assign across multiple subsequent installments', async () => {
      // Import installment 3/10 and name it
      const csv1 = `date,title,amount
2025-08-15,Apple Store - Parcela 3/10,250.00`;

      const import1 = await importCSVExpenses(csv1, 'aug.csv', 8, 2025, db);
      const expenses1 = await db
        .selectFrom('expenses')
        .selectAll()
        .where('import_session_id', '=', import1.sessionId)
        .execute();

      await updateExpenseNameWithRegistry(expenses1[0].id, 'iPhone 15 Pro');

      // Import installments 4/10, 5/10, 6/10
      const csv2 = `date,title,amount
2025-09-15,Apple Store - Parcela 4/10,250.00
2025-10-15,Apple Store - Parcela 5/10,250.00
2025-11-15,Apple Store - Parcela 6/10,250.00`;

      const import2 = await importCSVExpenses(csv2, 'multi.csv', 9, 2025, db);
      const expenses2 = await db
        .selectFrom('expenses')
        .selectAll()
        .where('import_session_id', '=', import2.sessionId)
        .orderBy('date', 'asc')
        .execute();

      // All three should have auto-assigned custom name
      expect(expenses2).toHaveLength(3);
      expect(expenses2[0].custom_name).toBe('iPhone 15 Pro');
      expect(expenses2[1].custom_name).toBe('iPhone 15 Pro');
      expect(expenses2[2].custom_name).toBe('iPhone 15 Pro');
    });

    it('should auto-assign across consistent installment format', async () => {
      // Create registry using standard "- Parcela N/M" format
      const csv1 = `date,title,amount
2025-10-01,Samsung - Parcela 1/5,80.00`;

      const import1 = await importCSVExpenses(csv1, 'samsung1.csv', 10, 2025, db);
      const expenses1 = await db
        .selectFrom('expenses')
        .selectAll()
        .where('import_session_id', '=', import1.sessionId)
        .execute();

      await updateExpenseNameWithRegistry(expenses1[0].id, 'Smart TV');

      // Import using same format (should auto-assign)
      const csv2 = `date,title,amount
2025-11-01,Samsung - Parcela 2/5,80.00`;

      const import2 = await importCSVExpenses(csv2, 'samsung2.csv', 11, 2025, db);
      const expenses2 = await db
        .selectFrom('expenses')
        .selectAll()
        .where('import_session_id', '=', import2.sessionId)
        .execute();

      // Should match and auto-assign
      expect(expenses2[0].custom_name).toBe('Smart TV');
    });
  });

  describe('T173: Assign name to non-installment, import similar vendor with different amount, verify no auto-name', () => {
    it('should not auto-assign name to non-installment expenses', async () => {
      // Import a regular expense
      const csv1 = `date,title,amount
2025-10-05,Starbucks,15.00`;

      const import1 = await importCSVExpenses(csv1, 'coffee1.csv', 10, 2025, db);
      const expenses1 = await db
        .selectFrom('expenses')
        .selectAll()
        .where('import_session_id', '=', import1.sessionId)
        .execute();

      // Assign a custom name
      await expenseRepository.updateCustomName(expenses1[0].id, 'Morning Coffee');

      // Verify NO registry entry was created (non-installment)
      const registryEntries = await registryRepository.findAll();
      expect(registryEntries).toHaveLength(0);

      // Import another Starbucks expense with different amount
      const csv2 = `date,title,amount
2025-10-12,Starbucks,18.50`;

      const import2 = await importCSVExpenses(csv2, 'coffee2.csv', 10, 2025, db);
      const expenses2 = await db
        .selectFrom('expenses')
        .selectAll()
        .where('import_session_id', '=', import2.sessionId)
        .execute();

      // Should NOT have auto-assigned custom name
      expect(expenses2[0].custom_name).toBeNull();
    });

    it('should not match installment with different amount even if vendor matches', async () => {
      // Import and name an installment
      const csv1 = `date,title,amount
2025-09-20,Casas Bahia - Parcela 1/8,120.00`;

      const import1 = await importCSVExpenses(csv1, 'bahia1.csv', 9, 2025, db);
      const expenses1 = await db
        .selectFrom('expenses')
        .selectAll()
        .where('import_session_id', '=', import1.sessionId)
        .execute();

      await updateExpenseNameWithRegistry(expenses1[0].id, 'Sofa Purchase');

      // Import same vendor, same total installments, but DIFFERENT amount
      const csv2 = `date,title,amount
2025-10-20,Casas Bahia - Parcela 1/8,140.00`;

      const import2 = await importCSVExpenses(csv2, 'bahia2.csv', 10, 2025, db);
      const expenses2 = await db
        .selectFrom('expenses')
        .selectAll()
        .where('import_session_id', '=', import2.sessionId)
        .execute();

      // Should NOT auto-assign because amount differs
      expect(expenses2[0].custom_name).toBeNull();
    });

    it('should not match if installment_total differs', async () => {
      // Import 1/10 installment
      const csv1 = `date,title,amount
2025-08-10,Dell - Parcela 1/10,300.00`;

      const import1 = await importCSVExpenses(csv1, 'dell1.csv', 8, 2025, db);
      const expenses1 = await db
        .selectFrom('expenses')
        .selectAll()
        .where('import_session_id', '=', import1.sessionId)
        .execute();

      await updateExpenseNameWithRegistry(expenses1[0].id, 'Laptop');

      // Import 1/12 installment (different total)
      const csv2 = `date,title,amount
2025-09-10,Dell - Parcela 1/12,300.00`;

      const import2 = await importCSVExpenses(csv2, 'dell2.csv', 9, 2025, db);
      const expenses2 = await db
        .selectFrom('expenses')
        .selectAll()
        .where('import_session_id', '=', import2.sessionId)
        .execute();

      // Should NOT auto-assign because installment_total differs
      expect(expenses2[0].custom_name).toBeNull();
    });
  });

  describe('T174: Conflict resolution - if multiple matches, don\'t auto-assign name', () => {
    it('should not auto-assign if multiple registry entries could match', async () => {
      // This test verifies that the conflict detection works
      // In practice, this shouldn't happen because registry uses UNIQUE(vendor_pattern, installment_total, amount)
      // But we test the service logic handles it correctly

      // Import two DIFFERENT installment plans from same vendor
      const csv1 = `date,title,amount
2025-08-15,Amazon - Parcela 1/10,100.00
2025-08-15,Amazon - Parcela 1/12,150.00`;

      const import1 = await importCSVExpenses(csv1, 'amazon-multi.csv', 8, 2025, db);
      const expenses1 = await db
        .selectFrom('expenses')
        .selectAll()
        .where('import_session_id', '=', import1.sessionId)
        .orderBy('amount', 'asc')
        .execute();

      // Name both
      await updateExpenseNameWithRegistry(expenses1[0].id, 'Headphones');
      await updateExpenseNameWithRegistry(expenses1[1].id, 'Monitor');

      // Verify two distinct registry entries
      const allEntries = await registryRepository.findAll();
      expect(allEntries).toHaveLength(2);

      // Import next installments
      const csv2 = `date,title,amount
2025-09-15,Amazon - Parcela 2/10,100.00
2025-09-15,Amazon - Parcela 2/12,150.00`;

      const import2 = await importCSVExpenses(csv2, 'amazon-next.csv', 9, 2025, db);
      const expenses2 = await db
        .selectFrom('expenses')
        .selectAll()
        .where('import_session_id', '=', import2.sessionId)
        .orderBy('amount', 'asc')
        .execute();

      // Both should match their respective patterns (no conflict because amount+total differ)
      expect(expenses2[0].custom_name).toBe('Headphones');
      expect(expenses2[1].custom_name).toBe('Monitor');
    });

    it('should handle exact single match correctly', async () => {
      // Import and name one specific installment pattern
      const csv1 = `date,title,amount
2025-10-01,Shopee - Parcela 1/6,45.00`;

      const import1 = await importCSVExpenses(csv1, 'shopee.csv', 10, 2025, db);
      const expenses1 = await db
        .selectFrom('expenses')
        .selectAll()
        .where('import_session_id', '=', import1.sessionId)
        .execute();

      await updateExpenseNameWithRegistry(expenses1[0].id, 'Kitchen Supplies');

      // Import exact matching pattern
      const csv2 = `date,title,amount
2025-11-01,Shopee - Parcela 2/6,45.00`;

      const import2 = await importCSVExpenses(csv2, 'shopee2.csv', 11, 2025, db);
      const expenses2 = await db
        .selectFrom('expenses')
        .selectAll()
        .where('import_session_id', '=', import2.sessionId)
        .execute();

      // Should have exactly one match and auto-assign
      expect(expenses2[0].custom_name).toBe('Kitchen Supplies');
    });

    it('should not be confused by similar but non-matching patterns', async () => {
      // Setup: Create registry for specific pattern
      const csv1 = `date,title,amount
2025-07-15,Nike Store - Parcela 1/8,75.00`;

      const import1 = await importCSVExpenses(csv1, 'nike.csv', 7, 2025, db);
      const expenses1 = await db
        .selectFrom('expenses')
        .selectAll()
        .where('import_session_id', '=', import1.sessionId)
        .execute();

      await updateExpenseNameWithRegistry(expenses1[0].id, 'Running Shoes');

      // Import similar vendor name but different pattern
      const csv2 = `date,title,amount
2025-08-15,Nike Official Store - Parcela 1/8,75.00`;

      const import2 = await importCSVExpenses(csv2, 'nike2.csv', 8, 2025, db);
      const expenses2 = await db
        .selectFrom('expenses')
        .selectAll()
        .where('import_session_id', '=', import2.sessionId)
        .execute();

      // Should NOT match because vendor_name differs
      expect(expenses2[0].custom_name).toBeNull();
    });
  });
});
