import React from 'react';
import { cn } from '@/lib/utils';

interface PriceTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Amount in numeric form */
  amount: number | string;
  /** Optional className for custom styling */
  className?: string;
}

/**
 * Formats a numeric value as Bolivian currency (Bs.) using locale "es-BO".
 * Supports strings that can be parsed to a number.
 */
function formatBoliviano(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return `${value}`;
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num).replace('BOB', 'Bs.');
}

export const PriceTag: React.FC<PriceTagProps> = ({ amount, className, ...rest }) => {
  const formatted = formatBoliviano(amount);
  return (
    <span
      className={cn('inline-block font-medium text-primary-600', className)}
      {...rest}
    >
      {formatted}
    </span>
  );
};
