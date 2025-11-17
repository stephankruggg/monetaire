import { Component, createSignal, onMount, Show } from 'solid-js';
import FileUpload from '../components/FileUpload';
import ExpenseTable from '../components/ExpenseTable';
import MonthSelector from '../components/MonthSelector';
import ImportSessionInfo from '../components/ImportSessionInfo';
import DeleteStatementModal from '../components/DeleteStatementModal';
import DeleteExpenseModal from '../components/DeleteExpenseModal';
import DeleteBillingCycleModal from '../components/DeleteBillingCycleModal';
import { getExpenses, getImportSessions, deleteImportSession, deleteExpense, deleteBillingCycle, updateExpenseName, type GetExpensesParams } from '../services/expenseApi';
import type { Expense, ImportResult, ImportSession } from '../../../shared/types';

const ExpensesPage: Component = () => {
  // Initialize with current month/year
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = createSignal(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = createSignal(now.getFullYear());

  const [expenses, setExpenses] = createSignal<Expense[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [importSuccess, setImportSuccess] = createSignal<ImportResult | null>(null);
  const [importSession, setImportSession] = createSignal<ImportSession | null>(null);
  const [sessionLoading, setSessionLoading] = createSignal(false);
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);
  const [sessionToDelete, setSessionToDelete] = createSignal<ImportSession | null>(null);
  const [showDeleteExpenseModal, setShowDeleteExpenseModal] = createSignal(false);
  const [expenseToDelete, setExpenseToDelete] = createSignal<Expense | null>(null);
  const [showDeleteBillingCycleModal, setShowDeleteBillingCycleModal] = createSignal(false);

  const loadExpenses = async (params?: GetExpensesParams) => {
    setLoading(true);
    setError(null);

    try {
      // Always include month/year filter
      const response = await getExpenses({
        month: selectedMonth(),
        year: selectedYear(),
        ...params,
      });
      setExpenses(response.expenses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  // Remove loadImportSession - session info now only shows after import

  onMount(() => {
    loadExpenses();
    // Don't load import session on mount - only show after import
  });

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    loadExpenses();
    // Don't load import session on month change - only show after import
  };

  const handleImportComplete = async (result: ImportResult) => {
    setImportSuccess(result);

    // Show success message for 5 seconds
    setTimeout(() => {
      setImportSuccess(null);
    }, 5000);

    // Reload expenses
    loadExpenses();

    // Load the specific import session that was just created
    try {
      const response = await getImportSessions(20);
      const newSession = response.sessions.find(s => s.id === result.sessionId);
      setImportSession(newSession || null);
    } catch (err) {
      console.error('Failed to load import session:', err);
    }
  };

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    loadExpenses({ sortBy: sortBy as any, sortOrder });
  };

  const handleDeleteStatement = () => {
    const session = importSession();
    if (session) {
      setSessionToDelete(session);
      setShowDeleteModal(true);
    }
  };

  const confirmDeleteStatement = async () => {
    const session = sessionToDelete();
    if (!session) return;

    try {
      await deleteImportSession(session.id);

      // Clear the import session display
      setImportSession(null);
      setShowDeleteModal(false);
      setSessionToDelete(null);

      // Reload expenses to reflect deletion
      loadExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete statement');
      setShowDeleteModal(false);
      setSessionToDelete(null);
    }
  };

  const cancelDeleteStatement = () => {
    setShowDeleteModal(false);
    setSessionToDelete(null);
  };

  const handleDeleteExpense = (expenseId: number) => {
    const expense = expenses().find(e => e.id === expenseId);
    if (expense) {
      setExpenseToDelete(expense);
      setShowDeleteExpenseModal(true);
    }
  };

  const confirmDeleteExpense = async () => {
    const expense = expenseToDelete();
    if (!expense) return;

    try {
      await deleteExpense(expense.id);

      // Clear the modal state
      setExpenseToDelete(null);
      setShowDeleteExpenseModal(false);

      // Reload expenses to reflect deletion
      loadExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete expense');
      setShowDeleteExpenseModal(false);
      setExpenseToDelete(null);
    }
  };

  const cancelDeleteExpense = () => {
    setShowDeleteExpenseModal(false);
    setExpenseToDelete(null);
  };

  const handleDeleteBillingCycle = () => {
    setShowDeleteBillingCycleModal(true);
  };

  const confirmDeleteBillingCycle = async () => {
    try {
      await deleteBillingCycle(selectedMonth(), selectedYear());

      // Clear the modal state
      setShowDeleteBillingCycleModal(false);

      // Reload expenses to reflect deletion
      loadExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete billing cycle');
      setShowDeleteBillingCycleModal(false);
    }
  };

  const cancelDeleteBillingCycle = () => {
    setShowDeleteBillingCycleModal(false);
  };

  const handleUpdateExpenseName = async (expenseId: number, customName: string) => {
    try {
      await updateExpenseName(expenseId, customName);

      // Update the expense in the local state
      setExpenses((prevExpenses) =>
        prevExpenses.map((expense) =>
          expense.id === expenseId
            ? { ...expense, customName }
            : expense
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update expense name');
      throw err; // Re-throw to let InlineEdit handle the error state
    }
  };

  return (
    <div style={{ 'max-width': '1200px', margin: '0 auto' }}>
      <Show when={importSuccess()}>
        <div
          style={{
            'margin-bottom': '1rem',
            padding: '1rem',
            'background-color': '#d1fae5',
            border: '1px solid #10b981',
            'border-radius': '0.375rem',
            color: '#065f46',
          }}
        >
          <div style={{ 'font-weight': '600', 'margin-bottom': '0.25rem' }}>
            Import Complete!
          </div>
          <div style={{ 'font-size': '0.875rem' }}>
            Imported {importSuccess()!.imported} expense(s)
            {importSuccess()!.failed > 0 && (
              <span style={{ color: '#dc2626' }}>
                {' '}
                · {importSuccess()!.failed} failed
              </span>
            )}
          </div>
          {importSuccess()!.errors.length > 0 && (
            <details style={{ 'margin-top': '0.5rem' }}>
              <summary style={{ cursor: 'pointer', 'font-size': '0.875rem' }}>
                View errors ({importSuccess()!.errors.length})
              </summary>
              <ul style={{ 'margin-top': '0.5rem', 'padding-left': '1.5rem' }}>
                {importSuccess()!.errors.map((err) => (
                  <li style={{ 'font-size': '0.75rem' }}>
                    Row {err.row}: {err.error}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </Show>

      <Show when={error()}>
        <div
          style={{
            'margin-bottom': '1rem',
            padding: '1rem',
            'background-color': '#fee2e2',
            border: '1px solid #fecaca',
            'border-radius': '0.375rem',
            color: '#991b1b',
          }}
        >
          {error()}
        </div>
      </Show>

      <FileUpload onImportComplete={handleImportComplete} />

      <MonthSelector
        selectedMonth={selectedMonth()}
        selectedYear={selectedYear()}
        onMonthChange={handleMonthChange}
        onDeleteBillingCycle={handleDeleteBillingCycle}
      />

      <ImportSessionInfo
        session={importSession()}
        loading={sessionLoading()}
        onClose={() => setImportSession(null)}
        onDelete={handleDeleteStatement}
      />

      <Show when={sessionToDelete()}>
        <DeleteStatementModal
          isOpen={showDeleteModal()}
          session={sessionToDelete()!}
          onConfirm={confirmDeleteStatement}
          onCancel={cancelDeleteStatement}
        />
      </Show>

      <ExpenseTable
        expenses={expenses()}
        loading={loading()}
        onSortChange={handleSortChange}
        onDeleteExpense={handleDeleteExpense}
        onUpdateName={handleUpdateExpenseName}
      />

      <Show when={expenseToDelete()}>
        <DeleteExpenseModal
          isOpen={showDeleteExpenseModal()}
          expense={expenseToDelete()!}
          onConfirm={confirmDeleteExpense}
          onCancel={cancelDeleteExpense}
        />
      </Show>

      <DeleteBillingCycleModal
        isOpen={showDeleteBillingCycleModal()}
        month={selectedMonth()}
        year={selectedYear()}
        expenseCount={expenses().length}
        onConfirm={confirmDeleteBillingCycle}
        onCancel={cancelDeleteBillingCycle}
      />
    </div>
  );
};

export default ExpensesPage;
