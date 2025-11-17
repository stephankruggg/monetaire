import { Request, Response } from 'express';
import { expenseRepository } from '../../models/ExpenseRepository.js';
import { db } from '../../db/database.js';
import { CustomNameService } from '../../services/CustomNameService.js';
import { detectInstallment } from '../../utils/installment-detector.js';

// Valid payment types
const VALID_PAYMENT_TYPES = ['credit', 'debit', 'pix', 'cash', 'other'];

// Valid sort fields
const VALID_SORT_FIELDS = ['date', 'amount', 'vendor_name', 'category'];

// Validate date format (YYYY-MM-DD)
function isValidDate(dateStr: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return false;
  }

  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

export async function listExpenses(req: Request, res: Response): Promise<void> {
  try {
    const {
      startDate,
      endDate,
      month,
      year,
      categoryId,
      vendor,
      paymentType,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    // Validate month (1-12)
    if (month !== undefined) {
      const monthNum = parseInt(month as string, 10);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        res.status(400).json({ error: 'Invalid month. Must be between 1 and 12' });
        return;
      }
    }

    // Validate year (2000-2100)
    if (year !== undefined) {
      const yearNum = parseInt(year as string, 10);
      if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        res.status(400).json({ error: 'Invalid year. Must be between 2000 and 2100' });
        return;
      }
    }

    // Validate date filters
    if (startDate && !isValidDate(startDate as string)) {
      res.status(400).json({ error: 'Invalid startDate format. Expected YYYY-MM-DD' });
      return;
    }

    if (endDate && !isValidDate(endDate as string)) {
      res.status(400).json({ error: 'Invalid endDate format. Expected YYYY-MM-DD' });
      return;
    }

    // Validate payment type
    if (paymentType && !VALID_PAYMENT_TYPES.includes(paymentType as string)) {
      res.status(400).json({
        error: `Invalid paymentType. Must be one of: ${VALID_PAYMENT_TYPES.join(', ')}`,
      });
      return;
    }

    // Validate sort field
    if (sortBy && !VALID_SORT_FIELDS.includes(sortBy as string)) {
      res.status(400).json({
        error: `Invalid sortBy field. Must be one of: ${VALID_SORT_FIELDS.join(', ')}`,
      });
      return;
    }

    // Validate sort order
    if (sortOrder && !['asc', 'desc'].includes(sortOrder as string)) {
      res.status(400).json({ error: 'Invalid sortOrder. Must be "asc" or "desc"' });
      return;
    }

    // Build filter object
    const filters: any = {};

    if (month !== undefined) filters.month = parseInt(month as string, 10);
    if (year !== undefined) filters.year = parseInt(year as string, 10);
    if (startDate) filters.startDate = startDate as string;
    if (endDate) filters.endDate = endDate as string;
    if (categoryId) filters.categoryId = parseInt(categoryId as string, 10);
    if (vendor) filters.vendor = vendor as string;
    if (paymentType) filters.paymentType = paymentType as string;
    if (sortBy) filters.sortBy = sortBy as string;
    if (sortOrder) filters.sortOrder = sortOrder as 'asc' | 'desc';

    // Query expenses
    const expenses = await expenseRepository.findAll(filters);

    res.status(200).json({
      expenses,
      total: expenses.length,
    });
  } catch (error) {
    console.error('Error listing expenses:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to list expenses',
    });
  }
}

export async function getExpenseById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const expenseId = parseInt(id, 10);

    if (isNaN(expenseId)) {
      res.status(400).json({ error: 'Invalid expense ID' });
      return;
    }

    const expense = await expenseRepository.findById(expenseId);

    if (!expense) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    res.status(200).json(expense);
  } catch (error) {
    console.error('Error getting expense:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get expense',
    });
  }
}

export async function deleteExpense(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const expenseId = parseInt(id, 10);

    console.log('[ExpensesController] Soft deleting expense:', expenseId);

    if (isNaN(expenseId)) {
      res.status(400).json({ error: 'Invalid expense ID' });
      return;
    }

    // Check if expense exists before deleting
    const expense = await expenseRepository.findById(expenseId);
    if (!expense) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    // Soft delete the expense
    await expenseRepository.softDelete(expenseId);

    console.log('[ExpensesController] Successfully soft deleted expense:', expenseId);

    res.status(200).json({
      message: 'Expense deleted successfully',
      expenseId,
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to delete expense',
    });
  }
}

export async function deleteBillingCycle(req: Request, res: Response): Promise<void> {
  try {
    const { month, year } = req.params;
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    console.log('[ExpensesController] Soft deleting billing cycle:', { month: monthNum, year: yearNum });

    // Validate month (1-12)
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      res.status(400).json({ error: 'Invalid month. Must be between 1 and 12' });
      return;
    }

    // Validate year (2000-2100)
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      res.status(400).json({ error: 'Invalid year. Must be between 2000 and 2100' });
      return;
    }

    // Look up import session by month/year to get session ID
    // This handles cross-month billing cycles correctly (e.g., Sep 12 - Oct 11 for October statement)
    const session = await db
      .selectFrom('import_sessions')
      .select(['id', 'filename'])
      .where('month', '=', monthNum)
      .where('year', '=', yearNum)
      .where('is_deleted', '=', 0) // Only get active sessions
      .orderBy('import_date', 'desc') // Get most recent if multiple
      .executeTakeFirst();

    if (!session) {
      res.status(404).json({
        error: 'No import session found for this billing cycle',
        month: monthNum,
        year: yearNum,
      });
      return;
    }

    console.log('[ExpensesController] Found import session:', session.id, session.filename);

    // Soft delete all expenses from this import session
    // This correctly handles expenses that span multiple calendar months
    const deletedCount = await expenseRepository.deleteByImportSession(session.id);

    console.log('[ExpensesController] Successfully soft deleted billing cycle:', {
      month: monthNum,
      year: yearNum,
      sessionId: session.id,
      deletedCount,
    });

    res.status(200).json({
      message: 'Billing cycle deleted successfully',
      month: monthNum,
      year: yearNum,
      sessionId: session.id,
      filename: session.filename,
      deletedCount,
    });
  } catch (error) {
    console.error('Error deleting billing cycle:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to delete billing cycle',
    });
  }
}

export async function updateExpenseName(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { customName } = req.body;
    const expenseId = parseInt(id, 10);

    console.log('[ExpensesController] Updating custom name for expense:', expenseId);

    if (isNaN(expenseId)) {
      res.status(400).json({ error: 'Invalid expense ID' });
      return;
    }

    // Validate customName
    if (customName !== null && typeof customName !== 'string') {
      res.status(400).json({ error: 'customName must be a string or null' });
      return;
    }

    if (customName !== null && customName.trim().length === 0) {
      res.status(400).json({ error: 'customName cannot be empty' });
      return;
    }

    // Check if expense exists
    const expense = await expenseRepository.findById(expenseId);
    if (!expense) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    // Update the custom name
    await expenseRepository.updateCustomName(expenseId, customName);

    // If this is an installment expense and customName is not null, save to registry
    if (customName && expense.installmentCurrent && expense.installmentTotal) {
      const customNameService = new CustomNameService(db);
      const installment = detectInstallment(expense.originalTitle);

      if (installment) {
        await customNameService.saveCustomName({
          title: expense.originalTitle,
          amount: expense.amount,
          vendor: expense.vendorName,
          installmentCurrent: expense.installmentCurrent,
          installmentTotal: expense.installmentTotal,
          customName,
        });

        console.log('[ExpensesController] Saved custom name to registry:', {
          vendor: expense.vendorName,
          installmentTotal: expense.installmentTotal,
          amount: expense.amount,
          customName,
        });
      }
    }

    console.log('[ExpensesController] Successfully updated custom name');

    res.status(200).json({
      message: 'Custom name updated successfully',
      expenseId,
      customName,
    });
  } catch (error) {
    console.error('Error updating custom name:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update custom name',
    });
  }
}
