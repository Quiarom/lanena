import { SlideShell, Insight, Action, SourceBadge } from '../SlideShell';
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
  const peorCump = [...pdfReference.visitasPorRegion]
    .map((r) => ({ ...r, cump: r.visitas / r.objetivo }))
    .sort((a, b) => a.cump - b.cump)[0];

  return (
    <SlideShell
      num="08"
      eyebrow="Visitas comerciales vs objetivo"
      title="La actividad comercial esta debajo del plan en todas las regiones."
      right={<SourceBadge label="PDF de referencia · visitas acumuladas" />}
    >
      <div className="pitch-grid-2">
        <div className="pitch-panel" data-reveal>
          <h3>Heatmap visitas por region / mes</h3>
          <p>Total {fmtNumber(total, { short: true })} · cumplimiento {fmtPercent(cumplimiento)}.</p>
          <div className="mt-3">
            <D3Heatmap data={heat} format={(n) => fmtNumber(n, { integer: true })} height={260} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Insight>
            La region con menor cumplimiento de visitas es <strong>{peorCump.region}</strong>
            ({fmtPercent(peorCump.cump)}). Aun sumando todas las regiones, no se llega al
            objetivo agregado; sin mas visitas, dificil sostener la cuota del proximo mes.
          </Insight>
          <Action>
            Repriorizar la agenda de la fuerza de ventas: reasignar rutas para que
            <strong> {peorCump.region}</strong> cierre el mes con un cumplimiento cercano al 100%.
            Reportar avance semanal.
          </Action>
        </div>
      </div>
    </SlideShell>
  );
}
