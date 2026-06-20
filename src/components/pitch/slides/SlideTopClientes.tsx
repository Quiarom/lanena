import { useMemo } from 'react';
import { SlideShell, Insight, Action, SourceBadge } from '../SlideShell';
import { D3HorizontalBarChart } from '@/components/charts/D3HorizontalBarChart';
import { workbookData, findSheet, findColumn } from '@/lib/data-inference';
import { groupSum } from '@/lib/filters';
import { filterAggregates } from '@/lib/aggregates';
import { fmtCurrency, fmtNumber, fmtPercent } from '@/lib/format';

function resolveClientes() {
  const sheet = findSheet(/cliente/i);
  if (!sheet) return null;
  const dim = findColumn(sheet, /(cliente|razon)/i)
    ?? sheet.columns.find((c) => c.role === 'dimension');
  const meas = findColumn(sheet, /(venta|valor|monto|total|actual)/i)
    ?? sheet.columns.find((c) => c.role === 'measure');
  if (!dim || !meas) return null;
  const grouped = filterAggregates(groupSum(sheet.rows, dim.key, meas.key))
    .filter((d) => d.value > 0)
    .slice(0, 12);
  return grouped.length >= 3 ? grouped : null;
}

export function SlideTopClientes() {
  const data = useMemo(resolveClientes, []);
  const real = !!data;
  const total = useMemo(() => (data ?? []).reduce((a, b) => a + b.value, 0), [data]);
  const top3 = (data ?? []).slice(0, 3).reduce((a, b) => a + b.value, 0);
  const share = total ? top3 / total : 0;

  return (
    <SlideShell
      num="06"
      eyebrow="Concentracion de clientes"
      title="Los primeros 3 clientes explican mas de la mitad de la venta del cierre."
      right={<SourceBadge label={real ? 'Hoja 6 · TOP CLIENTES' : 'PDF de referencia'} />}
    >
      <div className="pitch-grid-2">
        <div className="pitch-panel" data-reveal>
          <h3>Top {data?.length ?? 12} clientes · {real ? `Total ${fmtCurrency(total, { short: true })}` : 'Muestra'}</h3>
          <p>El ranking permite identificar concentración y riesgo de cartera.</p>
          <div className="mt-4">
            {data ? (
              <D3HorizontalBarChart data={data} format={(n) => fmtCurrency(n, { short: true })} color="#12A8E0" />
            ) : (
              <D3HorizontalBarChart
                data={[
                  { key: 'Cliente 1', value: 1850000 },
                  { key: 'Cliente 2', value: 1420000 },
                  { key: 'Cliente 3', value: 980000 },
                  { key: 'Cliente 4', value: 720000 },
                  { key: 'Cliente 5', value: 540000 },
                  { key: 'Cliente 6', value: 410000 },
                ]}
                format={(n) => fmtCurrency(n, { short: true })}
                color="#12A8E0"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Insight>
            Los primeros 3 clientes concentran {fmtPercent(share)} de la venta {real ? 'medida' : 'proyectada'}. Es
            una señal de concentracion elevada: si alguno cae o reduce pedido, el impacto es
            directo sobre el cumplimiento de cuota.
          </Insight>
          <Action>
            Asignar un ejecutivo de cuenta por cliente del top 5; revisar su salud de cartera,
            cobranza y frecuencia de visita. Definir plan trimestral con metas y plan B por
            cliente.
          </Action>
        </div>
      </div>
    </SlideShell>
  );
}
