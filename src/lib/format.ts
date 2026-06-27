export type ColType = 'text' | 'number' | 'percent' | 'currency' | 'date' | 'month' | 'category';

const nfUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const nfUsdShort = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const nfNum = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const nfInt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const nfPct = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 2 });

export function fmtCurrency(n: number | null | undefined, opts?: { short?: boolean }) {
  if (n === null || n === undefined || isNaN(Number(n))) return '—';
  const v = Number(n);
  if (opts?.short) {
    if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return nfUsdShort.format(v);
  }
  return nfUsd.format(v);
}
export function fmtNumber(n: number | null | undefined, opts?: { short?: boolean; integer?: boolean }) {
  if (n === null || n === undefined || isNaN(Number(n))) return '—';
  const v = Number(n);
  if (opts?.short) {
    if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  }
  return opts?.integer ? nfInt.format(v) : nfNum.format(v);
}
export function fmtPercent(n: number | null | undefined) {
  if (n === null || n === undefined || isNaN(Number(n))) return '—';
  return nfPct.format(Number(n));
}
export function fmtByType(v: unknown, type: ColType): string {
  const empty = v === null || v === undefined || v === '';
  switch (type) {
    case 'currency': return fmtCurrency(empty ? 0 : Number(v));
    case 'percent':  return fmtPercent(empty ? 0 : Number(v));
    case 'number':   return fmtNumber(empty ? 0 : Number(v));
    case 'date':
    case 'month':    return empty ? '—' : String(v).slice(0, 10);
    default:         return empty ? '—' : String(v);
  }
}
export function fmtDelta(n: number | null | undefined) {
  if (n === null || n === undefined || isNaN(Number(n))) return '—';
  const v = Number(n);
  const sign = v > 0 ? '+' : '';
  return `${sign}${nfPct.format(v)}`;
}

export function fmtLabel(raw: string): string {
  if (!raw) return raw;
  return raw
    .replace(/_/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => {
      if (!w) return '';
      // ≤4-char all-caps tokens (POS, USD, VS, COD…) stay uppercase
      if (w.length <= 4 && w === w.toUpperCase() && /^[A-Z]+$/.test(w)) return w;
      return w[0].toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
}
