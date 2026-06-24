import { SlideShell, KpiRow, SourceBadge, type KpiItem } from '../SlideShell';
import { pdfReference } from '@/data/pdf-reference';
import { getResumenMensual, getCxcTotal } from '@/lib/resumen';
import { fmtCurrency, fmtPercent, fmtNumber, fmtDelta } from '@/lib/format';

const BLUE_ACCENT = ['#01205e', '#0e4aa3', '#1f5dc9', '#2b75d9', '#3aa0e6', '#5ab4ec', '#7fc8f0', '#94d8ff'];

export function SlideResumen() {
  const rm = getResumenMensual();
  const cxc = getCxcTotal();
  const k = pdfReference.kpis;

  const items: KpiItem[] = rm
    ? [
        { label: `Ventas ${rm.monthLabel} 2026`, value: fmtCurrency(rm.values.y2026, { short: true }), caption: `vs ${fmtCurrency(rm.values.y2025, { short: true })} ${rm.monthLabel} 2025`, tone: rm.values.growth < -0.01 ? 'alert' : rm.values.growth > 0.01 ? 'ok' : 'neutral', bar: rm.values.coverage * 100, topColor: BLUE_ACCENT[0] },
        { label: 'Cobertura valores', value: fmtPercent(rm.values.coverage), caption: `Brecha ${fmtCurrency(rm.values.quota - rm.values.y2026, { short: true })}`, tone: rm.values.coverage >= 0.9 ? 'ok' : 'warn', topColor: BLUE_ACCENT[2] },
        { label: 'Cobertura unidades', value: fmtPercent(rm.units.coverage), caption: 'Cumplimiento unidades', tone: 'ok', topColor: BLUE_ACCENT[4] },
        { label: 'Variación vs 2025', value: fmtDelta(rm.values.growth), caption: 'Valores', tone: rm.values.growth < 0 ? 'alert' : 'ok', topColor: BLUE_ACCENT[5] },
        { label: 'Ventas acum. Ene-May 2026', value: fmtCurrency(rm.accumulated.y2026, { short: true }), caption: `vs ${fmtCurrency(rm.accumulated.y2025, { short: true })} 2025`, tone: rm.accumulated.growth < -0.01 ? 'alert' : rm.accumulated.growth > 0.01 ? 'ok' : 'neutral', topColor: BLUE_ACCENT[3] },
        { label: `Unidades ${rm.monthLabel} 2026`, value: fmtNumber(rm.units.y2026, { short: true }), caption: `vs ${fmtNumber(rm.units.y2025, { short: true })} 2025`, tone: rm.units.growth < -0.01 ? 'alert' : rm.units.growth > 0.01 ? 'ok' : 'neutral', topColor: BLUE_ACCENT[6] },
        { label: 'CxC total', value: fmtCurrency(cxc ?? k.cxcTotal, { short: true }), caption: 'Cartera total', topColor: BLUE_ACCENT[7] },
        { label: 'Clientes activos', value: fmtNumber(k.clientes, { integer: true }), caption: `${fmtNumber(k.proveedores, { integer: true })} proveedores`, topColor: BLUE_ACCENT[1] },
      ]
    : [
        { label: 'Ventas netas', value: fmtCurrency(k.ventasNetas, { short: true }), caption: `vs ${fmtCurrency(k.cuotaValores, { short: true })} de cuota`, tone: 'alert', bar: k.coberturaValores * 100, topColor: BLUE_ACCENT[0] },
        { label: 'Cobertura valores', value: fmtPercent(k.coberturaValores), caption: `Brecha ${fmtCurrency(k.cuotaValores - k.ventasNetas, { short: true })}`, tone: 'warn', topColor: BLUE_ACCENT[2] },
        { label: 'Cobertura unidades', value: fmtPercent(k.coberturaUnidades), caption: 'Cumplimiento unidades', tone: 'ok', topColor: BLUE_ACCENT[4] },
        { label: 'Variacion vs mes anterior', value: fmtDelta(k.variacionValores), caption: 'Valores', tone: 'alert', topColor: BLUE_ACCENT[5] },
        { label: 'Ventas acum. Ene-May 2026', value: fmtCurrency(k.ventasNetas, { short: true }), caption: pdfReference.period, tone: 'alert', topColor: BLUE_ACCENT[3] },
        { label: 'Margen', value: fmtPercent(k.margen), caption: 'Negativo', tone: 'alert', topColor: BLUE_ACCENT[6] },
        { label: 'CxC total', value: fmtCurrency(k.cxcTotal, { short: true }), caption: 'Cartera total', topColor: BLUE_ACCENT[7] },
        { label: 'Clientes activos', value: fmtNumber(k.clientes, { integer: true }), caption: `${fmtNumber(k.proveedores, { integer: true })} proveedores`, topColor: BLUE_ACCENT[1] },
      ];

  return (
    <SlideShell
      num="01"
      eyebrow="Cierre comercial · Mayo 2026"
      right={<SourceBadge label="Datos del cierre" />}
    >
      <KpiRow items={items} />
    </SlideShell>
  );
}
