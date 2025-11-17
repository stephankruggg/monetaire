import { Component, Show } from 'solid-js';
import type { ImportSession } from '../../../shared/types';

interface ImportSessionInfoProps {
  session?: ImportSession | null;
  loading?: boolean;
  onClose?: () => void;
  onDelete?: () => void;
}

const ImportSessionInfo: Component<ImportSessionInfoProps> = (props) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatMonthYear = (month: number, year: number) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[month - 1]} ${year}`;
  };

  const calculateBillingCycleRange = () => {
    if (!props.session || !props.session.billingCycleCloseDay) {
      return null;
    }

    const closeDay = props.session.billingCycleCloseDay;
    const month = props.session.month;
    const year = props.session.year;

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // Calculate previous month for the start of the billing cycle
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    const startDay = closeDay + 1;
    const startMonthName = monthNames[prevMonth - 1];
    const endMonthName = monthNames[month - 1];

    return `${startMonthName} ${startDay} - ${endMonthName} ${closeDay}`;
  };

  return (
    <Show when={!props.loading && props.session}>
      <div
        style={{
          'background-color': '#eff6ff',
          border: '1px solid #dbeafe',
          'border-radius': '0.5rem',
          padding: '1rem',
          'margin-bottom': '1rem',
        }}
      >
        <div style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', 'margin-bottom': '0.5rem' }}>
          <div style={{ display: 'flex', 'align-items': 'center', gap: '0.5rem' }}>
            <svg
              style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div style={{ 'font-weight': '600', color: '#1e40af' }}>
              Imported to: {formatMonthYear(props.session!.month, props.session!.year)}
            </div>
          </div>
          <Show when={props.onClose}>
            <button
              onClick={props.onClose}
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                width: '1.5rem',
                height: '1.5rem',
                padding: 0,
                border: 'none',
                'background-color': 'transparent',
                color: '#1e40af',
                cursor: 'pointer',
                'border-radius': '0.25rem',
              }}
              aria-label="Close"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </Show>
        </div>
        <div style={{ 'font-size': '0.875rem', color: '#1e3a8a', 'padding-left': '1.75rem' }}>
          <div>File: {props.session!.filename}</div>
          <div>Import Date: {formatDate(props.session!.importDate)}</div>
          <div>
            {props.session!.expensesImported} expense(s) imported
            {props.session!.expensesFailed > 0 && (
              <span style={{ color: '#dc2626' }}> · {props.session!.expensesFailed} failed</span>
            )}
          </div>
          {calculateBillingCycleRange() && (
            <div style={{ 'font-weight': '500', 'margin-top': '0.25rem' }}>
              Covers expenses from {calculateBillingCycleRange()}
            </div>
          )}
        </div>
        <Show when={props.onDelete}>
          <div style={{ 'margin-top': '0.75rem', 'padding-top': '0.75rem', 'border-top': '1px solid #dbeafe' }}>
            <button
              onClick={props.onDelete}
              style={{
                padding: '0.5rem 0.75rem',
                'border-radius': '0.375rem',
                'font-size': '0.875rem',
                'font-weight': '500',
                border: '1px solid #fca5a5',
                'background-color': 'white',
                color: '#dc2626',
                cursor: 'pointer',
                display: 'flex',
                'align-items': 'center',
                gap: '0.375rem',
              }}
            >
              <svg
                style={{ width: '1rem', height: '1rem' }}
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
              Delete Statement
            </button>
          </div>
        </Show>
      </div>
    </Show>
  );
};

export default ImportSessionInfo;
