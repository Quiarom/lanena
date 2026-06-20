import { useMemo } from 'react';
import { SlideShell, Insight, Action, SourceBadge } from '../SlideShell';
import { D3LineChart } from '@/components/charts/D3LineChart';
import { workbookData, findSheet } from '@/lib/data-inference';
import { fmtPercent } from '@/lib/format';

const MESES_LARGO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const FALLBACK = [
  { key: 'Ene', value: 0.91 },
  { key: 'Feb', value: 0.90 },
  { key: 'Mar', value: 0.94 },
  { key: 'Abr', value: 0.92 },
  { key: 'May', value: 0.87 },
];

function resolveCobranza() {
  const sheet = findSheet(/cierre cob 2025/i);
  if (!sheet) return null;
  const monthCol = sheet.columns.find((c) => c.type === 'month');
  const meas = sheet.columns.find((c) => c.role === 'measure');
  if (!monthCol || !meas) return null;
  const byMonth = new Map<string, number[]>();
  for (const r of sheet.rows) {
    const d = new Date(String(r[monthCol.key]));
    if (isNaN(d.getTime())) continue;
    const mes = MESES_LARGO[d.getUTCMonth()];
    const v = Number(r[meas.key]);
    if (isNaN(v) || v <= 0 || v > 1) continue;
    const arr = byMonth.get(mes) ?? [];
    arr.push(v);
    byMonth.set(mes, arr);
  }
  const series = MESES_LARGO
    .map((mes) => {
      const arr = byMonth.get(mes) ?? [];
      if (arr.length === 0) return null;
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      return { key: mes, value: avg };
    })
    .filter((p): p is { key: string; value: number } => p !== null);
  return series.length >= 3 ? series : null;
}

export function SlideCobranza() {
  const data = useMemo(resolveCobranza, []);
  const real = !!data;
  const series = data ?? FALLBACK;
  const last = series[series.length - 1];
  const first = series[0];
  const trend = last.value - first.value;
  const min = series.reduce((a, b) => (b.value < a.value ? b : a));
  const max = series.reduce((a, b) => (b.value > a.value ? b : a));
  const trendDir = trend < -0.005 ? 'cae' : trend > 0.005 ? 'sube' : 'se mantiene';

  return (
    <SlideShell
      num="09"
      eyebrow="Tendencia de cobranza 2025-2026"
      title={`La cobranza ${trendDir} a fin de año y queda bajo presion.`}
      right={<SourceBadge label={real ? 'Hoja CIERRE COB 2025 · promedio nacional' : 'PDF de referencia'} />}
    >
      <div className="pitch-grid-2">
        <div className="pitch-panel" data-reveal>
          <h3>Cumplimiento de presupuesto de cobranza · {fmtPercent(last.value)} en {last.key}</h3>
          <p>Variacion {fmtPercent(trend)} respecto a {first.key}.</p>
          <div className="mt-3">
            <D3LineChart data={series} format={(n) => fmtPercent(n)} color="#0a9a55" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Insight>
            El mejor mes fue {max.key} ({fmtPercent(max.value)}) y el peor {min.key} ({fmtPercent(min.value)}).
            La caida a fin de año es consistente con vencimientos de cartera concentrados.
            Aun así, el sistema se mantiene por encima del 85%, lo que indica una cobranza
            que funciona pero esta bajo presion.
          </Insight>
          <Action>
            Adelantar la gestion de cobranza en la ultima semana del mes con el top 20 de
            clientes por saldo; bloquear despacho a clientes con mora mayor a 60 días.
            Meta: sostener el cierre por encima del 90% cada mes.
          </Action>
        </div>
      </div>
    </SlideShell>
  );
}
