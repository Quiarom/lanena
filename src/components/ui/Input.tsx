import { cn } from '@/lib/cn';
import type { InputHTMLAttributes } from 'react';
export function Input({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400',
        'focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue',
        className,
      )}
      {...p}
    />
  );
}
