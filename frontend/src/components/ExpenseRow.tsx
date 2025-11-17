import { Component } from 'solid-js';
import type { Expense } from '../../../shared/types';
import CategoryTag from './CategoryTag';
import PaymentTypeTag from './PaymentTypeTag';
import InlineEdit from './InlineEdit';

interface ExpenseRowProps {
  expense: Expense;
  onDelete?: (expenseId: number) => void;
  onUpdateName?: (expenseId: number, customName: string) => Promise<void>;
}

const ExpenseRow: Component<ExpenseRowProps> = (props) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    const abs = Math.abs(amount);
    const formatted = abs.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return amount < 0 ? `-R$ ${formatted}` : `R$ ${formatted}`;
  };

  const displayName = () => {
    return props.expense.customName || props.expense.originalTitle;
  };

  const handleSaveName = async (newName: string) => {
    if (props.onUpdateName) {
      await props.onUpdateName(props.expense.id, newName);
    }
  };

  const formatBillingCycle = () => {
    if (!props.expense.billingCycleMonth || !props.expense.billingCycleYear) {
      return '-';
    }

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const monthName = monthNames[props.expense.billingCycleMonth - 1];
    return `${monthName} ${props.expense.billingCycleYear} Statement`;
  };

  return (
    <tr
      class="expense-row"
      style={{
        'border-bottom': '1px solid #e5e7eb',
      }}
    >
      <style>{`
        .expense-row {
          background-color: white;
          transition: background-color 0.15s;
        }
        .expense-row:hover {
          background-color: #f9fafb;
        }
      `}</style>
      <td style={{ padding: '0.75rem', 'white-space': 'nowrap' }}>
        {formatDate(props.expense.date)}
      </td>
      <td style={{ padding: '0.75rem' }}>
        <InlineEdit
          value={displayName()}
          onSave={handleSaveName}
          placeholder="Add custom name..."
        />
        {props.expense.customName && (
          <div style={{ 'font-size': '0.875rem', color: '#6b7280', 'margin-top': '0.25rem' }}>
            Original: {props.expense.originalTitle}
          </div>
        )}
        {props.expense.installmentCurrent && props.expense.installmentTotal && (
          <div style={{ 'font-size': '0.75rem', color: '#9ca3af', 'margin-top': '0.25rem' }}>
            Installment {props.expense.installmentCurrent}/{props.expense.installmentTotal}
          </div>
        )}
      </td>
      <td style={{ padding: '0.75rem' }}>{props.expense.vendorName}</td>
      <td style={{ padding: '0.75rem', 'text-align': 'right', 'font-weight': '600' }}>
        <span
          classList={{
            'amount-positive': props.expense.amount >= 0,
            'amount-negative': props.expense.amount < 0,
          }}
        >
          {formatCurrency(props.expense.amount)}
          <style>{`
            .amount-positive { color: #111827; }
            .amount-negative { color: #059669; }
          `}</style>
        </span>
      </td>
      <td style={{ padding: '0.75rem', 'white-space': 'nowrap', 'font-size': '0.875rem', color: '#6b7280' }}>
        {formatBillingCycle()}
      </td>
      <td style={{ padding: '0.75rem' }}>
        <PaymentTypeTag paymentType={props.expense.paymentType} />
      </td>
      <td style={{ padding: '0.75rem' }}>
        <CategoryTag category={props.expense.category} />
      </td>
      <td style={{ padding: '0.75rem', 'text-align': 'center' }}>
        <button
          onClick={() => props.onDelete?.(props.expense.id)}
          style={{
            padding: '0.375rem',
            border: 'none',
            'background-color': 'transparent',
            color: '#dc2626',
            cursor: 'pointer',
            'border-radius': '0.25rem',
            display: 'inline-flex',
            'align-items': 'center',
            'justify-content': 'center',
          }}
          title="Delete expense"
        >
          <svg
            style={{ width: '1.25rem', height: '1.25rem' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </td>
    </tr>
  );
};

export default ExpenseRow;
