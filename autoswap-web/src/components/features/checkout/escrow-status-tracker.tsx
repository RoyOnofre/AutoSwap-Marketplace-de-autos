import React from 'react';
import { cn } from '@/lib/utils';

const steps = [
  { id: 'pending', label: 'Pendiente' },
  { id: 'in_escrow', label: 'En Custodia' },
  { id: 'released', label: 'Liberado' },
  { id: 'cancelled', label: 'Cancelado' },
];

interface EscrowStatusTrackerProps {
  status: 'pending' | 'in_escrow' | 'released' | 'cancelled';
}

export default function EscrowStatusTracker({ status }: EscrowStatusTrackerProps) {
  const currentIndex = steps.findIndex((s) => s.id === status);
  return (
    <div className="flex items-center space-x-2">
      {steps.map((step, idx) => (
        <React.Fragment key={step.id}>
          <div
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium',
              idx <= currentIndex ? 'bg-primary-600 text-white' : 'bg-neutral-200 text-neutral-600'
            )}
          >
            {idx + 1}
          </div>
          <span className={cn('text-sm', idx <= currentIndex ? 'text-primary-600' : 'text-neutral-500')}> 
            {step.label}
          </span>
          {idx < steps.length - 1 && (
            <div className="flex-1 h-1 bg-neutral-300" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
