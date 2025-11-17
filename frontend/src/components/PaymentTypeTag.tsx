import { Component } from 'solid-js';

interface PaymentTypeTagProps {
  paymentType: 'credit' | 'debit' | 'pix' | 'cash' | 'other';
}

const paymentTypeLabels: Record<string, string> = {
  credit: 'Credit',
  debit: 'Debit',
  pix: 'PIX',
  cash: 'Cash',
  other: 'Other',
};

const PaymentTypeTag: Component<PaymentTypeTagProps> = (props) => {
  const label = () => paymentTypeLabels[props.paymentType] || 'Other';

  return (
    <span
      classList={{
        'payment-tag': true,
        'payment-credit': props.paymentType === 'credit',
        'payment-debit': props.paymentType === 'debit',
        'payment-pix': props.paymentType === 'pix',
        'payment-cash': props.paymentType === 'cash',
        'payment-other': props.paymentType === 'other',
      }}
    >
      {label()}
      <style>{`
        .payment-tag {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .payment-credit { background-color: #fef3c7; color: #92400e; }
        .payment-debit { background-color: #d1fae5; color: #065f46; }
        .payment-pix { background-color: #e0e7ff; color: #3730a3; }
        .payment-cash { background-color: #d1d5db; color: #1f2937; }
        .payment-other { background-color: #f3e8ff; color: #6b21a8; }
      `}</style>
    </span>
  );
};

export default PaymentTypeTag;
