import { useMemo } from 'react';
import { SlideShell, Insight, Action, SourceBadge } from '../SlideShell';
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
      title={real ? 'El portafolio depende de pocas categorias; conviene diversificar.' : 'La categoria mas fuerte explica un tercio del portafolio.'}
      right={<SourceBadge label={real ? 'Hoja 5 · CATEGORIA' : 'PDF de referencia'} />}
    >
      <div className="pitch-grid-2 pitch-grid-2--reverse">
        <div className="flex flex-col gap-3">
          <Insight>
            {real
              ? `El top 3 de categorias concentra ${fmtPercent((data!.slice(0, 3).reduce((a, b) => a + b.value, 0)) / total)} del total. Cualquiera de ellas en riesgo impacta la venta total.`
              : 'El portafolio se concentra en Genéricos y Éticos. Categorías de menor rotación (Higiene, Otros) sugieren revisar disponibilidad y margen.'}
          </Insight>
          <Action>
            {real
              ? 'Cruzar top 3 categorías con regiones que más las venden; identificar riesgo de dependencia y SKUs críticos a proteger.'
              : 'Revisar el catálogo de categorías de baja rotación y descartar SKUs sin margen o sin cobertura comercial.'}
          </Action>
        </div>

        <div className="pitch-panel" data-reveal>
          <h3>Mix por categoría · {real ? `Total ${fmtCurrency(total, { short: true })}` : 'Total referencial'}</h3>
          <p>Distribución porcentual de la venta por categoría.</p>
          <div className="mt-4">
            {data ? (
              <D3DonutChart data={data} format={(n) => fmtCurrency(n, { short: true })} size={260} />
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
                size={260}
              />
            )}
          </div>
        </div>
      </div>
    </SlideShell>
  );
}
