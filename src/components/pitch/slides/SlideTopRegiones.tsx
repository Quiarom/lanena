import { SlideShell, SourceBadge } from '../SlideShell';
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
      right={<SourceBadge label="Hoja 1 · DIST CUOTA 2026 RESULTADO" />}
    >
      <div className="pitch-panel" data-reveal>
        <h3>Top regiones por ventas netas</h3>
        <div className="mt-4">
          <D3HorizontalBarChart data={data} format={(n) => fmtCurrency(n, { short: true })} color="#0078D4" />
        </div>
      </div>
    </SlideShell>
  );
}
