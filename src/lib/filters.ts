import type { SheetData, ColumnSpec, FilterState } from './data-inference';

export function applyFilters(sheet: SheetData, filters: FilterState, search: string): Record<string, unknown>[] {
  const q = search.trim().toLowerCase();
  return sheet.rows.filter((row) => {
    if (q) {
      const hit = sheet.columns.some((c) => String(row[c.key] ?? '').toLowerCase().includes(q));
      if (!hit) return false;
    }
    for (const [key, f] of Object.entries(filters)) {
      if (!f) continue;
      const v = row[key];
      if (f.kind === 'set') {
        if (f.values.size === 0) continue;
        if (!f.values.has(String(v ?? ''))) return false;
      } else if (f.kind === 'range') {
        const n = Number(v);
        if (isNaN(n)) return false;
        if (f.min !== null && n < f.min) return false;
        if (f.max !== null && n > f.max) return false;
      }
    }
    return true;
  });
}

export function uniqueValues(rows: Record<string, unknown>[], key: string): string[] {
  const s = new Set<string>();
  for (const r of rows) {
    const v = r[key];
    if (v === null || v === undefined || v === '') continue;
    s.add(String(v));
  }
  return Array.from(s).sort((a, b) => a.localeCompare(b, 'es'));
}

export function numericRange(rows: Record<string, unknown>[], key: string): [number, number] | null {
  let min = Infinity, max = -Infinity;
  for (const r of rows) {
    const n = Number(r[key]);
    if (isNaN(n)) continue;
    if (n < min) min = n;
    if (n > max) max = n;
  }
  if (!isFinite(min)) return null;
  return [min, max];
}

export function sumBy(rows: Record<string, unknown>[], key: string): number {
  let s = 0;
  for (const r of rows) {
    const n = Number(r[key]);
    if (!isNaN(n)) s += n;
  }
  return s;
}

export function groupSum(rows: Record<string, unknown>[], dim: string, measure: string) {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = String(r[dim] ?? '—');
    const n = Number(r[measure]);
    if (isNaN(n)) continue;
    m.set(k, (m.get(k) || 0) + n);
  }
  return Array.from(m, ([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value);
}

export type { ColumnSpec, SheetData, FilterState };
