import { fmtCurrency, fmtPercent } from './format';
import { isAggregateLabel } from './aggregates';

/** Returns true if a row is a summary/aggregate row that should not appear in detail tables */
export function isSummaryRow(row: Record<string, unknown>): boolean {
  return Object.values(row).some((v) => typeof v === 'string' && isAggregateLabel(v));
}

/** Returns true if a monthly row has no closed 2026 value (future month) */
export function isPendingMonth(row: Record<string, unknown>): boolean {
  const v = row['ano_2026'];
  if (v === null || v === undefined) return true;
  const n = Number(v);
  return isNaN(n) || n === 0;
}

/** Like fmtCurrency but returns "—" for 0, null, NaN */
export function formatNullableCurrency(
  n: number | null | undefined,
  opts?: { short?: boolean },
): string {
  if (n === null || n === undefined || isNaN(n) || n === 0) return '—';
  return fmtCurrency(n, opts);
}

/** Like fmtPercent but returns "—" for null, NaN */
export function formatNullablePercent(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return fmtPercent(n);
}

const MONTH_RE = /^(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)$/i;

/** Returns only closed months from a rows array (ano_2026 > 0 and isMonth(mes)) */
export function getClosedMonthsOnly(
  rows: Record<string, unknown>[],
): Record<string, unknown>[] {
  return rows.filter(
    (r) =>
      typeof r['mes'] === 'string' &&
      MONTH_RE.test(String(r['mes'])) &&
      !isPendingMonth(r),
  );
}

/** Returns rows without summary/aggregate rows */
export function getDetailRowsOnly<T extends Record<string, unknown>>(rows: T[]): T[] {
  return rows.filter((r) => !isSummaryRow(r));
}
