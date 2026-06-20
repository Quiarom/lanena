import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

type Tone = 'neutral' | 'ok' | 'alert' | 'warn' | 'brand';
const tones: Record<Tone, string> = {
  neutral: 'bg-slate-50 text-slate-700 ring-1 ring-slate-200',
  ok: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  alert: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  warn: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  brand: 'bg-brand-ink/[0.06] text-brand-ink ring-1 ring-brand-ink/15',
};
export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium', tones[tone], className)}>{children}</span>;
}
