import { SlideShell, SourceBadge } from '../SlideShell';
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
      right={<SourceBadge label="Hoja 1 · DIST CUOTA 2026 RESULTADO" />}
    >
      <div className="pitch-panel" data-reveal>
        <h3>Mix de ventas por region · Total {fmtCurrency(total, { short: true })}</h3>
        <div className="mt-4">
          <D3DonutChart data={data} format={(n) => fmtCurrency(n, { short: true })} size={360} />
        </div>
      </div>
    </SlideShell>
  );
}
