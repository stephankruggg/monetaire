import { Router } from 'express';
import { listExpenses, getExpenseById, deleteExpense, deleteBillingCycle, updateExpenseName } from '../controllers/ExpensesController.js';

const router = Router();

// GET /api/expenses
router.get('/', listExpenses);

// GET /api/expenses/:id
router.get('/:id', getExpenseById);

// PATCH /api/expenses/:id - Update expense custom name
router.patch('/:id', updateExpenseName);

// DELETE /api/expenses/billing-cycle/:month/:year
router.delete('/billing-cycle/:month/:year', deleteBillingCycle);

// DELETE /api/expenses/:id
router.delete('/:id', deleteExpense);

export default router;
