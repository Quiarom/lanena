import { SlideShell, SourceBadge } from '../SlideShell';
import { D3BarChart } from '@/components/charts/D3BarChart';
import { pdfReference } from '@/data/pdf-reference';
import { fmtCurrency, fmtPercent } from '@/lib/format';

const data = pdfReference.regiones.map((r) => ({
  key: r.region,
  value: r.ventas,
  compare: r.cuota,
}));

const totalV = data.reduce((a, b) => a + b.value, 0);
const totalC = data.reduce((a, b) => a + (b.compare ?? 0), 0);
const cobertura = totalC ? totalV / totalC : 0;
const peor = [...data].sort((a, b) => (a.value / (a.compare ?? 1)) - (b.value / (b.compare ?? 1)))[0];
const mejor = [...data].sort((a, b) => (b.value / (b.compare ?? 1)) - (a.value / (a.compare ?? 1)))[0];

export function SlideVentasCuota() {
  return (
    <SlideShell
      num="02"
      eyebrow="Ventas vs cuota por region"
      right={<SourceBadge label="Hoja 1 · DIST CUOTA 2026 RESULTADO" />}
    >
      <div className="pitch-panel" data-reveal>
        <h3>Cuota (celeste, izquierda) vs ventas (azul, derecha) · {fmtCurrency(totalV, { short: true })} de {fmtCurrency(totalC, { short: true })}</h3>
        <div className="mt-3">
          <D3BarChart data={data} format={(n) => fmtCurrency(n, { short: true })} />
        </div>
      </div>
    </SlideShell>
  );
}
