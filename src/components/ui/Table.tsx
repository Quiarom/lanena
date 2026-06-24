import { cn } from '@/lib/cn';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { fmtByType, fmtLabel } from '@/lib/format';
import type { ColumnSpec } from '@/lib/data-inference';

export interface TableProps {
  columns: ColumnSpec[];
  rows: Record<string, unknown>[];
  pageSize?: number;
  dense?: boolean;
  maxHeight?: string;
}

export function Table({ columns, rows, pageSize = 25, dense = false, maxHeight }: TableProps) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const { key, dir } = sort;
    const m = dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[key], bv = b[key];
      const an = Number(av), bn = Number(bv);
      if (!isNaN(an) && !isNaN(bn)) return (an - bn) * m;
      return String(av ?? '').localeCompare(String(bv ?? ''), 'es') * m;
    });
  }, [rows, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const slice = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  function toggleSort(key: string) {
    setSort((s) => (s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' }));
  }

  const scrollStyle = maxHeight ? { maxHeight, overflowY: 'auto' as const } : undefined;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto" style={scrollStyle}>
        <table className={cn('w-full text-sm', dense && 'text-xs')}>
          <thead className={cn('corp-table-head', maxHeight && 'sticky top-0 z-10')}>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c.key)}
                  className={cn(
                    'px-3 py-2 text-left whitespace-nowrap cursor-pointer select-none',
                    c.role === 'measure' && 'text-right',
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {fmtLabel(c.label)}
                    {sort?.key === c.key && (sort.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 && (
              <tr><td colSpan={columns.length} className="px-3 py-6 text-center text-slate-400">Sin filas</td></tr>
            )}
            {slice.map((row, ri) => (
              <tr key={ri} className={cn('border-t border-slate-100', ri % 2 === 0 ? '' : 'bg-slate-50/40')}>
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      'px-3 py-1.5 font-mono tabular-nums',
                      c.role === 'dimension' && 'font-sans font-medium text-slate-800',
                      c.role === 'measure' && 'text-right text-slate-700',
                    )}
                  >
                    {c.role === 'dimension'
                      ? String(row[c.key] ?? '—')
                      : fmtByType(row[c.key], c.type)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 text-xs text-slate-500">
          <span>Pág. {safePage + 1} / {totalPages} · {sorted.length} filas</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="px-2 py-0.5 rounded border border-slate-300 px-2 disabled:opacity-40"
            >‹</button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage === totalPages - 1}
              className="px-2 py-0.5 rounded border border-slate-300 px-2 disabled:opacity-40"
            >›</button>
          </div>
        </div>
      )}
    </div>
  );
}
