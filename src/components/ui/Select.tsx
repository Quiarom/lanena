import { cn } from '@/lib/cn';
import type { SelectHTMLAttributes } from 'react';
export function Select({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-700',
        'focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue',
        className,
      )}
      {...p}
    />
  );
}
