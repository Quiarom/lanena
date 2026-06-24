import { useMemo } from 'react';
import { SlideShell, SourceBadge } from '../SlideShell';
import { D3DonutChart } from '@/components/charts/D3DonutChart';
import { workbookData, findSheet, findColumn } from '@/lib/data-inference';
import { groupSum } from '@/lib/filters';
import { filterAggregates } from '@/lib/aggregates';
import { fmtCurrency, fmtPercent } from '@/lib/format';

function resolveCategorias() {
  const sheet = findSheet(/categor/i);
  if (!sheet) return null;
  const dim = findColumn(sheet, /(categor|tipo|familia|linea|grupo|linea_)/i)
    ?? sheet.columns.find((c) => c.role === 'dimension');
  const meas = findColumn(sheet, /(venta|valor|monto|total|actual)/i)
    ?? sheet.columns.find((c) => c.role === 'measure');
  if (!dim || !meas) return null;
  const grouped = filterAggregates(groupSum(sheet.rows, dim.key, meas.key))
    .filter((d) => d.value > 0)
    .slice(0, 8)
    .map((d) => ({ key: d.key, value: d.value }));
  return grouped.length >= 2 ? grouped : null;
}

export function SlideCategorias() {
  const data = useMemo(resolveCategorias, []);
  const total = useMemo(() => (data ?? []).reduce((a, b) => a + b.value, 0), [data]);
  const real = !!data;

  return (
    <SlideShell
      num="05"
      eyebrow="Mix de productos por categoria"
      right={<SourceBadge label={real ? 'Hoja 5 · CATEGORIA' : 'PDF de referencia'} />}
    >
      <div className="pitch-panel" data-reveal>
        <h3>Mix por categoría · {real ? `Total ${fmtCurrency(total, { short: true })}` : 'Total referencial'}</h3>
        <div className="mt-4">
          {data ? (
            <D3DonutChart data={data} format={(n) => fmtCurrency(n, { short: true })} size={360} />
          ) : (
            <D3DonutChart
              data={[
                { key: 'Genéricos', value: 9800000 },
                { key: 'Éticos', value: 7200000 },
                { key: 'OTC', value: 5100000 },
                { key: 'Higiene', value: 3400000 },
                { key: 'Otros', value: 2400000 },
              ]}
              format={(n) => fmtCurrency(n, { short: true })}
              size={360}
            />
          )}
        </div>
      </div>
    </SlideShell>
  );
}
