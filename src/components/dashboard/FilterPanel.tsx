import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FilterPill } from '@/components/ui/FilterPill';
import type { ColumnSpec, FilterState, SheetData } from '@/lib/data-inference';
import { uniqueValues } from '@/lib/filters';
import { Search, X } from 'lucide-react';
import { useMemo } from 'react';

interface Props {
  sheet: SheetData;
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  search: string;
  setSearch: (s: string) => void;
}

export function FilterPanel({ sheet, filters, setFilters, search, setSearch }: Props) {
  const filterables = useMemo(
    () => sheet.columns.filter((c) => c.filterable && c.role === 'dimension').slice(0, 6),
    [sheet],
  );

  function setSet(c: ColumnSpec, value: string) {
    const next: FilterState = { ...filters };
    if (!value) { next[c.key] = null; }
    else { next[c.key] = { kind: 'set', values: new Set([value]) }; }
    setFilters(next);
  }
  function clearAll() { setFilters({}); setSearch(''); }
  const active = Object.entries(filters).filter(([, v]) => v) as [string, NonNullable<FilterState[string]>][];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[11px] uppercase tracking-wide text-slate-500 mb-1">Buscar</label>
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar en la hoja…" className="pl-7 w-full" />
          </div>
        </div>
        {filterables.map((c) => {
          const opts = uniqueValues(sheet.rows, c.key).slice(0, 200);
          const current = filters[c.key];
          const value = current && current.kind === 'set' ? Array.from(current.values)[0] ?? '' : '';
          return (
            <div key={c.key} className="min-w-[160px]">
              <label className="block text-[11px] uppercase tracking-wide text-slate-500 mb-1">{c.label}</label>
              <Select value={value} onChange={(e) => setSet(c, e.target.value)} className="w-full">
                <option value="">Todos</option>
                {opts.map((o) => <option key={o} value={o}>{o}</option>)}
              </Select>
            </div>
          );
        })}
        <Button variant="outline" onClick={clearAll} className="ml-auto"><X size={14} /> Limpiar</Button>
      </div>
      {active.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {active.map(([k, f]) => {
            const col = sheet.columns.find((c) => c.key === k);
            const label = col?.label ?? k;
            const value = f.kind === 'set' ? Array.from(f.values).join(', ') : `${f.min ?? '−∞'} – ${f.max ?? '+∞'}`;
            return <FilterPill key={k} label={label} value={value} onClear={() => setFilters({ ...filters, [k]: null })} />;
          })}
        </div>
      )}
    </div>
  );
}
