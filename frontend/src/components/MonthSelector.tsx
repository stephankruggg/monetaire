import { Component, For, createMemo } from 'solid-js';

interface MonthSelectorProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number, year: number) => void;
  onDeleteBillingCycle?: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MonthSelector: Component<MonthSelectorProps> = (props) => {
  // Generate years from 2020 to current year + 1
  const currentYear = new Date().getFullYear();
  const years = createMemo(() => {
    const yearList = [];
    for (let year = 2020; year <= currentYear + 1; year++) {
      yearList.push(year);
    }
    return yearList.reverse(); // Most recent first
  });

  const handleMonthChange = (e: Event) => {
    const month = parseInt((e.target as HTMLSelectElement).value, 10);
    props.onMonthChange(month, props.selectedYear);
  };

  const handleYearChange = (e: Event) => {
    const year = parseInt((e.target as HTMLSelectElement).value, 10);
    props.onMonthChange(props.selectedMonth, year);
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.75rem',
        'align-items': 'center',
        'margin-bottom': '1.5rem',
      }}
    >
      <label
        style={{
          'font-size': '0.875rem',
          'font-weight': '500',
          color: '#374151',
        }}
      >
        Filter by:
      </label>
      <select
        value={props.selectedMonth}
        onChange={handleMonthChange}
        style={{
          padding: '0.5rem 1rem',
          'border-radius': '0.375rem',
          border: '1px solid #d1d5db',
          'font-size': '0.875rem',
          'background-color': 'white',
          color: '#111827',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <For each={MONTHS}>
          {(month, index) => (
            <option value={index() + 1}>{month}</option>
          )}
        </For>
      </select>
      <select
        value={props.selectedYear}
        onChange={handleYearChange}
        style={{
          padding: '0.5rem 1rem',
          'border-radius': '0.375rem',
          border: '1px solid #d1d5db',
          'font-size': '0.875rem',
          'background-color': 'white',
          color: '#111827',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <For each={years()}>
          {(year) => (
            <option value={year}>{year}</option>
          )}
        </For>
      </select>
      {props.onDeleteBillingCycle && (
        <button
          onClick={props.onDeleteBillingCycle}
          style={{
            padding: '0.5rem 1rem',
            'border-radius': '0.375rem',
            'font-size': '0.875rem',
            'font-weight': '500',
            border: '1px solid #dc2626',
            'background-color': 'white',
            color: '#dc2626',
            cursor: 'pointer',
            'margin-left': 'auto',
          }}
        >
          Delete This Month
        </button>
      )}
    </div>
  );
};

export default MonthSelector;
