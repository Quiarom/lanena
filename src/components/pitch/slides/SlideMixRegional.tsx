import { SlideShell, Insight, Action, SourceBadge } from '../SlideShell';
import { D3DonutChart } from '@/components/charts/D3DonutChart';
import { pdfReference } from '@/data/pdf-reference';
import { fmtCurrency, fmtPercent } from '@/lib/format';

const data = pdfReference.regiones.map((r) => ({ key: r.region, value: r.ventas }));
const total = data.reduce((a, b) => a + b.value, 0);
const top = [...data].sort((a, b) => b.value - a.value)[0];
const topShare = top.value / total;

export function SlideMixRegional() {
  return (
    <SlideShell
      num="03"
      eyebrow="Composicion regional de la venta"
      title="Centro Este concentra mas de un tercio de la venta nacional."
      right={<SourceBadge label="Hoja 1 · DIST CUOTA 2026 RESULTADO" />}
    >
      <div className="pitch-grid-2 pitch-grid-2--reverse">
        <div className="flex flex-col gap-3">
          <Insight>
            <strong>{top.key}</strong> representa {fmtPercent(topShare)} del total nacional. Es la region
            mas critica: cualquier movimiento en su cartera explica una fraccion significativa del
            resultado. La cola (Los Andes) representa menos del 11% y puede ser candidata a
            revisar costo comercial.
          </Insight>
          <Action>
            Definir un plan especifico para <strong>{top.key}</strong> con titular, plan semanal
            y meta de cuota realista para junio. Evaluar redistribucion de gastos comerciales en
            la region de cola.
          </Action>
        </div>

        <div className="pitch-panel" data-reveal>
          <h3>Mix de ventas por region · Total {fmtCurrency(total, { short: true })}</h3>
          <p>Distribucion porcentual de la venta del mes.</p>
          <div className="mt-4">
            <D3DonutChart data={data} format={(n) => fmtCurrency(n, { short: true })} size={260} />
          </div>
        </div>
      </div>
    </SlideShell>
  );
}
