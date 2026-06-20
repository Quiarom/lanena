export function isAggregateLabel(key: string): boolean {
  if (!key) return true;
  const k = String(key).trim().toUpperCase();
  if (k === '' || k === 'NAN' || k === 'NULL' || k === '—' || k === '-') return true;
  if (/^(TOTAL|TOTALES|SUBTOTAL|GRAN TOTAL)$/i.test(k)) return true;
  if (/^TOP\s*\d+$/i.test(k)) return true;
  if (/^PESO\s/i.test(k)) return true;
  if (/^N$/i.test(k)) return true;
  return false;
}

export function filterAggregates<T extends { key: string }>(items: T[]): T[] {
  return items.filter((it) => !isAggregateLabel(it.key));
}
