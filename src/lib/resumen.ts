import { findSheet } from './data-inference';

const MONTH_KEYS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;
const MONTH_LABELS: Record<string, string> = {
  ene: 'Ene', feb: 'Feb', mar: 'Mar', abr: 'Abr', may: 'May', jun: 'Jun',
  jul: 'Jul', ago: 'Ago', sep: 'Sep', oct: 'Oct', nov: 'Nov', dic: 'Dic',
};

export interface MonthlyMetric {
  y2025: number;
  y2026: number;
  growth: number;
  quota: number;
  coverage: number;
}

export interface ResumenMensual {
  monthKey: string;
  monthLabel: string;
  values: MonthlyMetric;
  units: MonthlyMetric;
  accumulated: { y2025: number; y2026: number; growth: number };
}

function isMonth(m: unknown): m is string {
  return typeof m === 'string' && MONTH_KEYS.includes(m as (typeof MONTH_KEYS)[number]);
}

function num(row: Record<string, unknown> | undefined, key: string): number {
  if (!row) return NaN;
  const v = row[key];
  return typeof v === 'number' && !Number.isNaN(v) ? v : NaN;
}

export function getResumenMensual(): ResumenMensual | null {
  const sheet = findSheet(/DIST CUOTA 2026 RESULTADO/);
  if (!sheet) return null;

  const headerIdx = sheet.rows.findIndex((r) => r.unidades === 'VALORES' && r.mes === 'MES');
  const unitRows = headerIdx >= 0 ? sheet.rows.slice(0, headerIdx) : sheet.rows;
  const valueRows = headerIdx >= 0 ? sheet.rows.slice(headerIdx + 1) : [];

  const current = (rows: Record<string, unknown>[]) => {
    const months = rows.filter((r) => isMonth(r.mes) && typeof r.ano_2026 === 'number');
    return months.length ? months[months.length - 1] : null;
  };

  const vRow = current(valueRows);
  const uRow = current(unitRows);
  const vAccum = valueRows.find((r) => typeof r.mes === 'string' && String(r.mes).startsWith('Acum'));

  if (!vRow || !uRow) return null;

  const monthKey = String(vRow.mes);
  return {
    monthKey,
    monthLabel: MONTH_LABELS[monthKey] ?? monthKey,
    values: {
      y2025: num(vRow, 'ano_2025'),
      y2026: num(vRow, 'ano_2026'),
      growth: num(vRow, 'crecimiento'),
      quota: num(vRow, 'cobertura'),
      coverage: num(vRow, 'col_7'),
    },
    units: {
      y2025: num(uRow, 'ano_2025'),
      y2026: num(uRow, 'ano_2026'),
      growth: num(uRow, 'crecimiento'),
      quota: num(uRow, 'cuota_2026'),
      coverage: num(uRow, 'cobertura'),
    },
    accumulated: {
      y2025: num(vAccum, 'ano_2025'),
      y2026: num(vAccum, 'ano_2026'),
      growth: num(vAccum, 'crecimiento'),
    },
  };
}

export function getCxcTotal(): number | null {
  const sheet = findSheet(/^7\. CXC/);
  if (!sheet) return null;
  const totalRow = sheet.rows.find((r) => String(r.dias_antiguedad).toUpperCase() === 'TOTAL');
  const v = totalRow?.total;
  return typeof v === 'number' && !Number.isNaN(v) ? v : null;
}
