import { Component, For, createSignal, Show } from 'solid-js';
import type { Expense } from '../../../shared/types';
import ExpenseRow from './ExpenseRow';

interface ExpenseTableProps {
  expenses: Expense[];
  loading?: boolean;
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onDeleteExpense?: (expenseId: number) => void;
  onUpdateName?: (expenseId: number, customName: string) => Promise<void>;
}

type SortField = 'date' | 'amount' | 'vendor_name' | 'billing_cycle_month';

const ExpenseTable: Component<ExpenseTableProps> = (props) => {
  const [sortBy, setSortBy] = createSignal<SortField>('date');
  const [sortOrder, setSortOrder] = createSignal<'asc' | 'desc'>('desc');

  const handleSort = (field: SortField) => {
    if (sortBy() === field) {
      // Toggle order
      const newOrder = sortOrder() === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder);
      props.onSortChange?.(field, newOrder);
    } else {
      // New field, default to descending
      setSortBy(field);
      setSortOrder('desc');
      props.onSortChange?.(field, 'desc');
    }
  };

  const SortIcon: Component<{ field: SortField }> = (iconProps) => {
    return (
      <span
        classList={{
          'sort-icon': true,
          'sort-active': sortBy() === iconProps.field,
          'sort-inactive': sortBy() !== iconProps.field,
        }}
      >
        {sortBy() === iconProps.field && sortOrder() === 'asc' ? '↑' : '↓'}
        <style>{`
          .sort-icon {
            margin-left: 0.5rem;
            display: inline-block;
          }
          .sort-active { opacity: 1; }
          .sort-inactive { opacity: 0.3; }
        `}</style>
      </span>
    );
  };

  const TableHeader: Component<{ field: SortField; children: any }> = (headerProps) => {
    return (
      <th
        style={{
          padding: '0.75rem',
          'text-align': 'left',
          'font-weight': '600',
          color: '#374151',
          'background-color': '#f9fafb',
          cursor: 'pointer',
          'user-select': 'none',
        }}
        onClick={() => handleSort(headerProps.field)}
      >
        {headerProps.children}
        <SortIcon field={headerProps.field} />
      </th>
    );
  };

  return (
    <div
      style={{
        'background-color': 'white',
        'border-radius': '0.5rem',
        'box-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
      }}
    >
      <Show when={props.loading}>
        <div
          style={{
            padding: '2rem',
            'text-align': 'center',
            color: '#6b7280',
          }}
        >
          Loading expenses...
        </div>
      </Show>

      <Show when={!props.loading && props.expenses.length === 0}>
        <div
          style={{
            padding: '3rem 2rem',
            'text-align': 'center',
            color: '#6b7280',
          }}
        >
          <p style={{ 'font-size': '1.125rem', 'margin-bottom': '0.5rem' }}>
            No expenses found
          </p>
          <p style={{ 'font-size': '0.875rem' }}>
            Import a CSV file to get started
          </p>
        </div>
      </Show>

      <Show when={!props.loading && props.expenses.length > 0}>
        <div style={{ 'overflow-x': 'auto' }}>
          <table style={{ width: '100%', 'border-collapse': 'collapse' }}>
            <thead>
              <tr>
                <TableHeader field="date">Date</TableHeader>
                <th
                  style={{
                    padding: '0.75rem',
                    'text-align': 'left',
                    'font-weight': '600',
                    color: '#374151',
                    'background-color': '#f9fafb',
                  }}
                >
                  Description
                </th>
                <TableHeader field="vendor_name">Vendor</TableHeader>
                <TableHeader field="amount">Amount</TableHeader>
                <TableHeader field="billing_cycle_month">Billing Cycle</TableHeader>
                <th
                  style={{
                    padding: '0.75rem',
                    'text-align': 'left',
                    'font-weight': '600',
                    color: '#374151',
                    'background-color': '#f9fafb',
                  }}
                >
                  Payment
                </th>
                <th
                  style={{
                    padding: '0.75rem',
                    'text-align': 'left',
                    'font-weight': '600',
                    color: '#374151',
                    'background-color': '#f9fafb',
                  }}
                >
                  Category
                </th>
                <th
                  style={{
                    padding: '0.75rem',
                    'text-align': 'center',
                    'font-weight': '600',
                    color: '#374151',
                    'background-color': '#f9fafb',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <For each={props.expenses}>
                {(expense) => <ExpenseRow expense={expense} onDelete={props.onDeleteExpense} onUpdateName={props.onUpdateName} />}
              </For>
            </tbody>
          </table>
        </div>

        <div
          style={{
            padding: '0.75rem 1rem',
            'background-color': '#f9fafb',
            'border-top': '1px solid #e5e7eb',
            'font-size': '0.875rem',
            color: '#6b7280',
          }}
        >
          Total: {props.expenses.length} expense{props.expenses.length !== 1 ? 's' : ''}
        </div>
      </Show>
    </div>
  );
};

export default ExpenseTable;
