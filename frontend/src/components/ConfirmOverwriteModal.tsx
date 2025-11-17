import { Component, Show } from 'solid-js';
import type { ImportSession } from '../../../shared/types';

interface ConfirmOverwriteModalProps {
  isOpen: boolean;
  existingSession: ImportSession;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmOverwriteModal: Component<ConfirmOverwriteModalProps> = (props) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMonthYear = (month: number, year: number) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[month - 1]} ${year}`;
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
                style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }}
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
                Duplicate Import Detected
              </h2>
            </div>
          </div>

          {/* Content */}
          <div style={{ 'margin-bottom': '1.5rem', color: '#374151' }}>
            <p style={{ 'margin-bottom': '1rem' }}>
              This file has already been imported:
            </p>
            <div
              style={{
                'background-color': '#f3f4f6',
                'border-radius': '0.375rem',
                padding: '0.75rem',
                'margin-bottom': '1rem',
              }}
            >
              <div style={{ 'font-weight': '500', 'margin-bottom': '0.25rem' }}>
                {props.existingSession.filename}
              </div>
              <div style={{ 'font-size': '0.875rem', color: '#6b7280' }}>
                <div>Imported to: {formatMonthYear(props.existingSession.month, props.existingSession.year)}</div>
                <div>Import Date: {formatDate(props.existingSession.importDate)}</div>
                <div>{props.existingSession.expensesImported} expense(s) imported</div>
              </div>
            </div>
            <p style={{ 'font-size': '0.875rem', color: '#6b7280' }}>
              Do you want to overwrite the existing import? This will delete all expenses from the previous import and replace them with the new data.
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
              Overwrite
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default ConfirmOverwriteModal;
