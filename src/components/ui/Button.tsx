import { cn } from '@/lib/cn';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';
const variants: Record<Variant, string> = {
  primary: 'bg-brand-deep text-white hover:bg-brand-dark',
  secondary: 'bg-brand-blue text-white hover:bg-brand-sky',
  ghost: 'bg-transparent text-brand-deep hover:bg-brand-surface',
  outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
};

export function Button({ className, variant = 'primary', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-brand-blue/40 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        className,
      )}
      {...p}
    />
  );
}
