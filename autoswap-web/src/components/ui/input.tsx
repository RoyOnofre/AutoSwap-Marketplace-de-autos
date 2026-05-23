import React from 'react';
import { VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils'; // utility for class names

const inputVariants = cva('block w-full rounded-md border border-neutral-300 bg-neutral-100 text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:opacity-50 disabled:cursor-not-allowed', {
  variants: {
    size: {
      sm: 'h-8 px-2 text-sm',
      md: 'h-10 px-3 text-base',
      lg: 'h-12 px-4 text-lg',
    },
    variant: {
      default: '',
      outline: 'border-2 border-primary-600',
      ghost: 'bg-transparent border-none',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
});

type InputProps = React.InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof inputVariants> & {
    asChild?: boolean;
  };

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, variant, asChild = false, ...props }, ref) => {
    const Component = asChild ? 'span' : 'input';
    return (
      <Component
        className={cn(inputVariants({ size, variant, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
