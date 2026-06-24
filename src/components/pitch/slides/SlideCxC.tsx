import { useMemo } from 'react';
import { SlideShell, SourceBadge } from '../SlideShell';
import { D3DonutChart } from '@/components/charts/D3DonutChart';
import { workbookData, findSheet } from '@/lib/data-inference';
import { isAggregateLabel } from '@/lib/aggregates';
import { fmtCurrency } from '@/lib/format';

const FALLBACK = [
  { key: '0-30 días',     value: 2100000 },
  { key: '31-60 días',    value: 1450000 },
  { key: '61-90 días',    value: 900000 },
  { key: '+90 días',      value: 711000 },
];

function resolveCxc() {
  const sheet = findSheet(/cxc|cuenta.*cobr|cartera|antig/i);
  if (!sheet) return { data: FALLBACK, total: FALLBACK.reduce((a, b) => a + b.value, 0), real: false };
  const tramos = [
    { key: '1 a 3 días',     col: '1_a_3_dias' },
    { key: '4 a 15 días',    col: '4_a_15_dias' },
    { key: '16 a 21 días',   col: '16_a_21_dias' },
    { key: '22 a 40 días',   col: '22_a_40_dias' },
    { key: '41 a 60 días',   col: '41_a_60_dias' },
    { key: '61 a 90 días',   col: '61_a_90_dias' },
    { key: '+90 días',       col: 'mayor_a_90_dias' },
  ];
  const clean = sheet.rows.filter((r) => !isAggregateLabel(String(r['dias_antiguedad'] ?? '')));
  const totalRow = sheet.rows.find((r) => isAggregateLabel(String(r['dias_antiguedad'] ?? '')) && /total/i.test(String(r['dias_antiguedad'])));
  const total = totalRow ? Number(totalRow['total']) : null;
  const data = tramos
    .map((t) => ({
      key: t.key,
      value: clean.reduce((acc, r) => acc + (Number(r[t.col]) || 0), 0),
    }))
    .filter((t) => t.value > 0);
  return { data, total, real: data.length >= 2 };
}

export function SlideCxC() {
  const { data, total, real } = useMemo(resolveCxc, []);
  const sumTramos = data.reduce((a, b) => a + b.value, 0);
  const displayTotal = total && total > 0 ? total : sumTramos;
  return (
    <SlideShell
      num="07"
      eyebrow="Antigüedad de cartera"
      right={<SourceBadge label={real && workbookData.hasRealData ? 'Hoja 7 · CXC' : 'PDF de referencia'} />}
    >
      <div className="pitch-panel" data-reveal>
        <h3>Antigüedad de CxC · Total {fmtCurrency(displayTotal, { short: true })}</h3>
        <div className="mt-4">
          <D3DonutChart data={data} format={(n) => fmtCurrency(n, { short: true })} size={360} />
        </div>
      </div>
    </SlideShell>
  );
}
