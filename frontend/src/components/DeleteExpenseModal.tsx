import { Component, Show } from 'solid-js';
import type { Expense } from '../../../shared/types';

interface DeleteExpenseModalProps {
  isOpen: boolean;
  expense: Expense;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteExpenseModal: Component<DeleteExpenseModalProps> = (props) => {
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

  return (
    <Show when={props.isOpen}>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          'background-color': 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'z-index': 50,
        }}
        onClick={props.onCancel}
      >
        {/* Modal */}
        <div
          style={{
            'background-color': 'white',
            'border-radius': '0.5rem',
            padding: '1.5rem',
            'max-width': '500px',
            width: '90%',
            'box-shadow': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ 'margin-bottom': '1rem' }}>
            <div style={{ display: 'flex', 'align-items': 'center', gap: '0.5rem', 'margin-bottom': '0.5rem' }}>
              <svg
                style={{ width: '1.5rem', height: '1.5rem', color: '#dc2626' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h2 style={{ 'font-size': '1.25rem', 'font-weight': '600', color: '#111827' }}>
                Delete Expense
              </h2>
            </div>
          </div>

          {/* Content */}
          <div style={{ 'margin-bottom': '1.5rem', color: '#374151' }}>
            <p style={{ 'margin-bottom': '1rem' }}>
              Are you sure you want to delete this expense?
            </p>
            <div
              style={{
                'background-color': '#fef2f2',
                'border-left': '4px solid #dc2626',
                padding: '0.75rem',
                'margin-bottom': '1rem',
              }}
            >
              <div style={{ 'font-weight': '500', 'margin-bottom': '0.25rem', color: '#991b1b' }}>
                {displayName()}
              </div>
              <div style={{ 'font-size': '0.875rem', color: '#7f1d1d' }}>
                <div>Date: {formatDate(props.expense.date)}</div>
                <div>Amount: {formatCurrency(props.expense.amount)}</div>
                <div>Vendor: {props.expense.vendorName}</div>
              </div>
            </div>
            <p style={{ 'font-size': '0.875rem', color: '#dc2626', 'font-weight': '500' }}>
              This action cannot be undone.
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', 'justify-content': 'flex-end' }}>
            <button
              style={{
                padding: '0.5rem 1rem',
                'border-radius': '0.375rem',
                'font-weight': '500',
                border: '1px solid #d1d5db',
                'background-color': 'white',
                color: '#374151',
                cursor: 'pointer',
              }}
              onClick={props.onCancel}
            >
              Cancel
            </button>
            <button
              style={{
                padding: '0.5rem 1rem',
                'border-radius': '0.375rem',
                'font-weight': '500',
                border: 'none',
                'background-color': '#dc2626',
                color: 'white',
                cursor: 'pointer',
              }}
              onClick={props.onConfirm}
            >
              Delete Expense
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default DeleteExpenseModal;
