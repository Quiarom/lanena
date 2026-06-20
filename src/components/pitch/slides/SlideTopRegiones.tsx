import { SlideShell, Insight, Action, SourceBadge } from '../SlideShell';
import { D3HorizontalBarChart } from '@/components/charts/D3HorizontalBarChart';
import { pdfReference } from '@/data/pdf-reference';
import { fmtCurrency, fmtPercent } from '@/lib/format';

const data = pdfReference.regiones.map((r) => ({
  key: r.region,
  value: r.ventas,
  meta: `Cuota ${fmtCurrency(r.cuota, { short: true })} · ${fmtPercent(r.ventas / r.cuota)} cobertura`,
}));

export function SlideTopRegiones() {
  return (
    <SlideShell
      num="04"
      eyebrow="Ranking de regiones por venta"
      title="Centro Este y Centro Oeste explican casi dos tercios de la venta del mes."
      right={<SourceBadge label="Hoja 1 · DIST CUOTA 2026 RESULTADO" />}
    >
      <div className="pitch-grid-2">
        <div className="pitch-panel" data-reveal>
          <h3>Top regiones por ventas netas</h3>
          <p>Cobertura por region comparada contra la cuota asignada.</p>
          <div className="mt-4">
            <D3HorizontalBarChart data={data} format={(n) => fmtCurrency(n, { short: true })} color="#0078D4" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Insight>
            El ranking es estable respecto a meses anteriores: las dos primeras regiones (Centro
            Este y Centro Oeste) son responsables de {fmtPercent((data[0].value + data[1].value) / data.reduce((a, b) => a + b.value, 0))} de la venta. La cobertura
            es descendente en todos los casos, pero la brecha absoluta se concentra en
            <strong> {data[0].key}</strong>.
          </Insight>
          <Action>
            Visitar junto al equipo comercial el top 5 de clientes de las dos primeras regiones
            para validar plan de recupero de cuota y anticipar pedido de junio.
          </Action>
        </div>
      </div>
    </SlideShell>
  );
}
