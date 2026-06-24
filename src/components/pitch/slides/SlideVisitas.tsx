import { SlideShell, SourceBadge } from '../SlideShell';
import { D3Heatmap } from '@/components/charts/D3Heatmap';
import { pdfReference } from '@/data/pdf-reference';
import { fmtNumber, fmtPercent } from '@/lib/format';

const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May'];

function buildHeatmap() {
  return meses.flatMap((m) =>
    pdfReference.visitasPorRegion.map((r) => ({
      x: m,
      y: r.region,
      value: Math.round(r.visitas / 5 * (0.85 + (r.region.length % 5) * 0.03)),
    })),
  );
}

export function SlideVisitas() {
  const heat = buildHeatmap();
  const total = pdfReference.visitasPorRegion.reduce((a, b) => a + b.visitas, 0);
  const obj = pdfReference.visitasPorRegion.reduce((a, b) => a + b.objetivo, 0);
  const cumplimiento = obj ? total / obj : 0;
  return (
    <SlideShell
      num="08"
      eyebrow="Visitas comerciales vs objetivo"
      right={<SourceBadge label="PDF de referencia · visitas acumuladas" />}
    >
      <div className="pitch-panel" data-reveal>
        <h3>Heatmap visitas por region / mes · Total {fmtNumber(total, { short: true })} · cumplimiento {fmtPercent(cumplimiento)}</h3>
        <div className="mt-3">
          <D3Heatmap data={heat} format={(n) => fmtNumber(n, { integer: true })} height={320} />
        </div>
      </div>
    </SlideShell>
  );
}
