import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'outline' | 'ghost' | 'destructive';

const VARIANTS: Record<Variant, string> = {
  default: 'bg-neutral-900 text-white hover:bg-neutral-800',
  outline: 'border border-neutral-300 bg-transparent hover:bg-neutral-100',
  ghost: 'bg-transparent hover:bg-neutral-100',
  destructive: 'bg-red-600 text-white hover:bg-red-500',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
