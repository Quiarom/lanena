import { SlideShell, Insight, Action, SourceBadge } from '../SlideShell';
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
      title="Todas las regiones cierran debajo de la cuota. La brecha es pareja, no concentrada."
      right={<SourceBadge label="Hoja 1 · DIST CUOTA 2026 RESULTADO" />}
    >
      <div className="pitch-grid-2">
        <div className="pitch-panel" data-reveal>
          <h3>Ventas (azul) vs cuota (celeste) · {fmtCurrency(totalV, { short: true })} de {fmtCurrency(totalC, { short: true })}</h3>
          <p>Cobertura agregada: {fmtPercent(cobertura)}.</p>
          <div className="mt-3">
            <D3BarChart data={data} format={(n) => fmtCurrency(n, { short: true })} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Insight>
            La region con peor desempeno es <strong>{peor.key}</strong> ({fmtPercent(peor.value / (peor.compare ?? 1))}); la mejor
            cobertura la tiene <strong>{mejor.key}</strong> ({fmtPercent(mejor.value / (mejor.compare ?? 1))}).
            Aun asi, ninguna region llega al 100%, lo que apunta a un problema de mercado o ejecucion,
            no a una sola region.
          </Insight>
          <Action>
            Convocar una mesa comercial semanal con las cinco regiones para revisar plan de
            recupero de cuota en {fmtCurrency(totalC - totalV, { short: true })}; identificar
            SKUs y clientes clave por region.
          </Action>
        </div>
      </div>
    </SlideShell>
  );
}
