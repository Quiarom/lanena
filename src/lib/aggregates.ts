export function isAggregateLabel(key: unknown): boolean {
  // Null / undefined / numeric keys are always junk (Excel header rows that became data rows)
  if (key === null || key === undefined) return true;
  if (typeof key === 'number') return true;
  const k = String(key).trim().toUpperCase();
  if (k === '' || k === 'NAN' || k === 'NULL' || k === '—' || k === '-') return true;
  if (/^(TOTAL|TOTALES|SUBTOTAL|GRAN TOTAL)$/i.test(k)) return true;
  if (/^TOP\s*\d+$/i.test(k)) return true;
  // "PESO TOP", "PESO TOP 10" and generic "PESO …" patterns
  if (/^PESO\s/i.test(k)) return true;
  if (/^N$/i.test(k)) return true;
  // Embedded header string values (Sheet 4 provider block)
  if (/^(PROVEEDOR|LABORATORIO|EMPRESA)$/.test(k)) return true;
  return false;
}

export function filterAggregates<T extends { key: unknown }>(items: T[]): T[] {
  return items.filter((it) => !isAggregateLabel(it.key));
}
