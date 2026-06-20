import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { ReactNode } from 'react';

export interface KpiItem {
  label: string;
  value: string;
  caption?: string;
  tone?: 'positive' | 'neutral' | 'alert' | 'warn';
  delta?: string;
  icon?: ReactNode;
  topColor?: string;
}

export function KpiGrid({ items, cols = 4 }: { items: KpiItem[]; cols?: 3 | 4 | 5 }) {
  const colCls = cols === 5 ? 'lg:grid-cols-5' : cols === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4';
  return (
    <div className={cn('stagger grid grid-cols-2 md:grid-cols-3 gap-3', colCls)}>
      {items.map((it) => (
        <Card key={it.label} className="group relative p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow" style={it.topColor ? { borderTop: `3px solid ${it.topColor}` } : undefined}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="flex items-start justify-between gap-2">
            <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500 leading-tight">{it.label}</div>
            <span className="text-brand-blue/80">{it.icon}</span>
          </div>
          <div className="mt-3 font-mono text-2xl font-semibold text-brand-ink tab-num tracking-tight">{it.value}</div>
          <div className="mt-1.5 flex items-center gap-2 text-[11px]">
            {it.delta && (
              <span className={cn(
                'inline-flex items-center gap-0.5 font-mono font-medium tab-num rounded-md px-1.5 py-0.5',
                it.tone === 'positive' && 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
                it.tone === 'alert' && 'bg-red-50 text-red-700 ring-1 ring-red-200',
                it.tone === 'warn' && 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
                (it.tone === 'neutral' || !it.tone) && 'bg-slate-50 text-slate-600 ring-1 ring-slate-200',
              )}>
                {it.tone === 'positive' ? <ArrowUpRight size={11} /> : it.tone === 'alert' ? <ArrowDownRight size={11} /> : <Minus size={11} />}
                {it.delta}
              </span>
            )}
            {it.caption && <span className="text-slate-500 truncate">{it.caption}</span>}
          </div>
        </Card>
      ))}
    </div>
  );
}

export { Badge };
