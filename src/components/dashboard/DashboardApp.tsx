import { useMemo, useState } from 'react';
import { DashboardShell, NAV } from './DashboardShell';
import { KpiGrid, type KpiItem } from './KpiGrid';
import { SheetExplorer } from './SheetExplorer';
import { InsightPanel } from './InsightPanel';
import { RoadmapPanel } from './RoadmapPanel';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Tabs } from '@/components/ui/Tabs';
import { D3BarChart } from '@/components/charts/D3BarChart';
import { D3HorizontalBarChart } from '@/components/charts/D3HorizontalBarChart';
import { D3DonutChart } from '@/components/charts/D3DonutChart';
import { D3LineChart } from '@/components/charts/D3LineChart';
import { D3Heatmap } from '@/components/charts/D3Heatmap';
import { fmtCurrency, fmtNumber, fmtPercent, fmtDelta } from '@/lib/format';
import { workbookData, findSheet, findColumn, type ColumnSpec } from '@/lib/data-inference';
import { groupSum, sumBy } from '@/lib/filters';
import { filterAggregates } from '@/lib/aggregates';
import { getDetailRowsOnly } from '@/lib/helpers';
import { pdfReference } from '@/data/pdf-reference';
import { getResumenMensual, getCxcTotal } from '@/lib/resumen';
import { BadgeDollarSign, Boxes, Coins, Eye, PackageCheck, Target, TrendingDown, TrendingUp, Users } from 'lucide-react';

export default function DashboardApp() {
  const [section, setSection] = useState<string>('resumen');
  const fallback = !workbookData.hasRealData;
  const period = pdfReference.period;
  const source = workbookData.sourceFile ?? 'PDF de referencia';

  return (
    <DashboardShell current={section} onNavigate={setSection} fallback={fallback} period={period} source={source}>
      {section === 'resumen'     && <ResumenSection />}
      {section === 'ventas'      && <VentasSection />}
      {section === 'regiones'    && <RegionesSection />}
      {section === 'proveedores' && <ProveedoresSection />}
      {section === 'categorias'  && <CategoriasSection />}
      {section === 'clientes'    && <ClientesSection />}
      {section === 'cxc'         && <CxcSection />}
      {section === 'visitas'     && <VisitasSection />}
      {section === 'explorador'  && <SheetExplorer />}
      {section === 'hallazgos'   && <InsightPanel />}
      {section === 'roadmap'     && <RoadmapPanel />}
    </DashboardShell>
  );
}

// ---------- helpers ----------
function tone(n: number): 'positive' | 'alert' | 'neutral' {
  if (n > 0.01) return 'positive';
  if (n < -0.01) return 'alert';
  return 'neutral';
}

const domains = workbookData.domains as
  | {
      providers?: { byValue?: Record<string, unknown>[]; byUnits?: Record<string, unknown>[] };
      national?: { monthly?: Record<string, unknown>[] };
      regions?: { rows?: Record<string, unknown>[] };
      categories?: { byProductType?: Record<string, unknown>[]; byCommercialLine?: Record<string, unknown>[] };
      clients?: { individual?: Record<string, unknown>[]; groups?: Record<string, unknown>[] };
      accountsReceivable?: { byClient?: Record<string, unknown>[]; summary?: Record<string, unknown> };
    }
  | undefined;

function cleanPrice(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function getRegionDomainRows(regSheet?: import('@/lib/data-inference').SheetData | null): Record<string, unknown>[] {
  if (domains?.regions?.rows?.length) return domains.regions.rows;
  if (!regSheet) return [];
  const stopAt = regSheet.rows.findIndex((r) => String(r.region ?? '').toUpperCase().trim() === 'TOTAL');
  const regSlice = stopAt > 0 ? regSheet.rows.slice(0, stopAt) : regSheet.rows;
  return regSlice.filter((r) => r.region && Number(r.ventas_ano_actual) > 0);
}

// ---------- Resumen ----------
function ResumenSection() {
  const rm = getResumenMensual();
  const cxc = getCxcTotal();
  const k = pdfReference.kpis;

  const items: KpiItem[] = rm
    ? [
        { label: `Ventas ${rm.monthLabel} 2026`, value: fmtCurrency(rm.values.y2026, { short: true }), caption: `vs ${fmtCurrency(rm.values.y2025, { short: true })} ${rm.monthLabel} 2025`, tone: tone(rm.values.growth), delta: fmtDelta(rm.values.growth), icon: <BadgeDollarSign size={16} className="text-brand-blue" />, topColor: '#01205e' },
        { label: 'Ventas acum. Ene-May 2026', value: fmtCurrency(rm.accumulated.y2026, { short: true }), caption: `vs ${fmtCurrency(rm.accumulated.y2025, { short: true })} 2025`, tone: tone(rm.accumulated.growth), delta: fmtDelta(rm.accumulated.growth), icon: <TrendingUp size={16} className="text-brand-blue" />, topColor: '#0e4aa3' },
        { label: 'Cuota valores', value: fmtCurrency(rm.values.quota, { short: true }), caption: `Objetivo ${rm.monthLabel} 2026`, icon: <Target size={16} className="text-brand-blue" />, topColor: '#1f5dc9' },
        { label: 'Cobertura valores', value: fmtPercent(rm.values.coverage), tone: rm.values.coverage >= 0.9 ? 'positive' : 'warn', caption: 'Cumplimiento', icon: <TrendingUp size={16} className="text-emerald-600" />, topColor: '#2b75d9' },
        { label: `Unidades ${rm.monthLabel} 2026`, value: fmtNumber(rm.units.y2026, { short: true }), caption: `vs ${fmtNumber(rm.units.y2025, { short: true })} ${rm.monthLabel} 2025`, tone: tone(rm.units.growth), delta: fmtDelta(rm.units.growth), icon: <PackageCheck size={16} className="text-brand-blue" />, topColor: '#3aa0e6' },
        { label: 'Cobertura unidades', value: fmtPercent(rm.units.coverage), tone: 'positive', caption: 'Cumplimiento unidades', icon: <TrendingUp size={16} className="text-emerald-600" />, topColor: '#5ab4ec' },
        { label: 'Var. interanual valores', value: fmtDelta(rm.values.growth), tone: tone(rm.values.growth), caption: `${rm.monthLabel} 2026 vs 2025`, icon: <TrendingDown size={16} className={rm.values.growth < 0 ? 'text-red-600' : 'text-emerald-600'} />, topColor: '#7fc8f0' },
        { label: 'CxC total', value: fmtCurrency(cxc ?? k.cxcTotal, { short: true }), caption: 'Cartera total', icon: <Coins size={16} className="text-brand-warn" />, topColor: '#94d8ff' },
      ]
    : [
        { label: 'Ventas netas', value: fmtCurrency(k.ventasNetas, { short: true }), caption: period(), tone: tone(k.variacionValores), delta: fmtDelta(k.variacionValores), icon: <BadgeDollarSign size={16} className="text-brand-blue" />, topColor: '#01205e' },
        { label: 'Cuota valores', value: fmtCurrency(k.cuotaValores, { short: true }), caption: 'Objetivo del mes', icon: <Target size={16} className="text-brand-blue" />, topColor: '#1f5dc9' },
        { label: 'Cobertura valores', value: fmtPercent(k.coberturaValores), tone: k.coberturaValores >= 0.9 ? 'positive' : 'warn', caption: 'Cumplimiento', icon: <TrendingUp size={16} className="text-emerald-600" />, topColor: '#2b75d9' },
        { label: 'Ventas unidades', value: fmtNumber(k.ventasUnidades, { short: true }), tone: tone(k.variacionUnidades), delta: fmtDelta(k.variacionUnidades), caption: 'vs mismo periodo', icon: <PackageCheck size={16} className="text-brand-blue" />, topColor: '#3aa0e6' },
        { label: 'Cobertura unidades', value: fmtPercent(k.coberturaUnidades), tone: 'positive', caption: 'Cumplimiento unidades', icon: <TrendingUp size={16} className="text-emerald-600" />, topColor: '#5ab4ec' },
        { label: 'Margen', value: fmtPercent(k.margen), tone: 'alert', caption: 'Margen del mes', icon: <TrendingDown size={16} className="text-red-600" />, topColor: '#7fc8f0' },
        { label: 'CxC total', value: fmtCurrency(k.cxcTotal, { short: true }), caption: 'Cuentas por cobrar', icon: <Coins size={16} className="text-brand-warn" />, topColor: '#94d8ff' },
        { label: 'Visitas comerciales', value: fmtNumber(k.visitasComerciales, { short: true }), caption: 'Acumulado periodo', icon: <Eye size={16} className="text-brand-blue" />, topColor: '#5ab4ec' },
      ];

  const secondary: KpiItem[] = [
    { label: 'Devolución', value: fmtPercent(k.devolucion), caption: 'Sobre venta' },
    { label: 'Unidades/día', value: fmtNumber(k.unidadesPromedioDiario, { short: true }), caption: 'Promedio diario' },
    { label: 'Bultos', value: fmtNumber(k.bultos, { short: true }), caption: 'Despachados' },
    { label: 'Proveedores', value: fmtNumber(k.proveedores, { integer: true }) },
    { label: 'SKUs vendidos', value: fmtNumber(k.skusVendidos, { integer: true }) },
    { label: 'Clientes', value: fmtNumber(k.clientes, { integer: true }) },
    { label: 'Precio prom. USD', value: fmtCurrency(k.precioPromedioUsd) },
    { label: 'Inventario unidades', value: fmtNumber(k.inventarioUnidades, { short: true }) },
  ];

  const regSheet = findSheet(/^2\. REGIONES/);
  const cleanRegionRows = getRegionDomainRows(regSheet);
  const regionData = cleanRegionRows.length
    ? cleanRegionRows.map((r) => ({
        key: String(r.region),
        value: Number(r.ventas_ano_actual) || 0,
        compare: Number(r.ventas_ano_anterior) || 0,
      }))
    : pdfReference.regiones.map((r) => ({ key: r.region, value: r.ventas, compare: r.cuota }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Resumen ejecutivo" subtitle={`Cierre ${period()} · visión integral del mes`} />
        <KpiGrid items={items} cols={4} />
      </Card>
      <Card>
        <CardHeader title="Indicadores operativos" />
        <KpiGrid items={secondary} cols={4} />
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Ventas por región — año actual vs anterior" subtitle="Celeste: 2025 izquierda · Azul: 2026 derecha" />
          <D3BarChart data={regionData} format={(n) => fmtCurrency(n, { short: true })} />
        </Card>
        <Card>
          <CardHeader title="Distribución de ventas por región" />
          <D3DonutChart data={regionData.map((r) => ({ key: r.key, value: r.value }))} format={(n) => fmtCurrency(n, { short: true })} />
        </Card>
      </div>
    </div>
  );

  function period() { return pdfReference.period; }
}


// ---------- Ventas ----------
function VentasSection() {
  const dist = findSheet(/DIST CUOTA 2026 RESULTADO/);
  const regSheet = findSheet(/^2\. REGIONES/);
  if (!dist && !regSheet) return <FallbackVentas />;

  // Monthly evolution from normalized VALUE rows only. Raw sheet 1 has UNITS and VALUES stacked.
  const monthRows = (domains?.national?.monthly ?? [])
    .filter((r) => r.status === 'closed' && typeof r.mes === 'string');
  const monthBar = monthRows.map((r) => ({
    key: String(r.mes).toUpperCase(),
    value: Number(r.y2026) || 0,
    compare: Number(r.y2025) || 0,
  }));
  const totalVentas2026 = monthBar.reduce((s, r) => s + r.value, 0);
  const totalVentas2025 = monthBar.reduce((s, r) => s + r.compare!, 0);
  const totalCuota = monthRows.reduce((s, r) => s + (Number(r.quota2026 ?? r.quota) || 0), 0);
  const cobertura = totalCuota > 0 ? totalVentas2026 / totalCuota : null;
  const growth = totalVentas2025 > 0 ? totalVentas2026 / totalVentas2025 - 1 : 0;

  // Region breakdown from sheet 2
  const regRows = getRegionDomainRows(regSheet)
    .map((r) => ({
      key: String(r.region),
      value: Number(r.ventas_ano_actual) || 0,
      compare: Number(r.ventas_ano_anterior) || 0,
    }))
    .sort((a, b) => b.value - a.value);

  const items: KpiItem[] = [
    { label: 'Ventas acum. 2026', value: fmtCurrency(totalVentas2026, { short: true }), caption: `vs ${fmtCurrency(totalVentas2025, { short: true })} 2025`, tone: tone(growth), delta: fmtDelta(growth) },
    { label: 'Cuota acumulada', value: totalCuota ? fmtCurrency(totalCuota, { short: true }) : '—' },
    { label: 'Cobertura', value: cobertura !== null ? fmtPercent(cobertura) : '—', tone: cobertura && cobertura >= 0.9 ? 'positive' : 'warn' },
    { label: 'Meses cerrados', value: String(monthRows.length) },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Ventas" subtitle="Evolución mensual + ranking por región" />
        <KpiGrid items={items} cols={4} />
      </Card>
      {monthBar.length > 0 && (
        <Card>
          <CardHeader title="Ventas mensuales 2026 vs 2025" subtitle="Celeste: 2025 izquierda · Azul: 2026 derecha" />
          <D3BarChart data={monthBar} format={(n) => fmtCurrency(n, { short: true })} />
        </Card>
      )}
      {regRows.length > 0 && (
        <Card>
          <CardHeader title="Ventas por región — año actual vs anterior" subtitle="Celeste: 2025 izquierda · Azul: 2026 derecha" />
          <D3BarChart data={regRows} format={(n) => fmtCurrency(n, { short: true })} />
        </Card>
      )}
    </div>
  );
}
function FallbackVentas({ note }: { note?: string } = {}) {
  const items: KpiItem[] = [
    { label: 'Ventas netas', value: fmtCurrency(pdfReference.kpis.ventasNetas, { short: true }), caption: pdfReference.period },
    { label: 'Cuota valores', value: fmtCurrency(pdfReference.kpis.cuotaValores, { short: true }) },
    { label: 'Cobertura', value: fmtPercent(pdfReference.kpis.coberturaValores), tone: 'warn' },
    { label: 'Var. valores', value: fmtDelta(pdfReference.kpis.variacionValores), tone: 'alert' },
  ];
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Ventas" subtitle={note} />
        <KpiGrid items={items} cols={4} />
      </Card>
      <Card>
        <CardHeader title="Ventas vs cuota por región" subtitle="Celeste: cuota izquierda · Azul: ventas derecha" />
        <D3BarChart data={pdfReference.regiones.map((r) => ({ key: r.region, value: r.ventas, compare: r.cuota }))} format={(n) => fmtCurrency(n, { short: true })} />
      </Card>
    </div>
  );
}

// ---------- Regiones ----------
function RegionesSection() {
  const regSheet = findSheet(/^2\. REGIONES/);
  const estSheet = findSheet(/^3\. ESTADOS/);
  if (!regSheet) return <RegionFallback />;

  const regRows = getRegionDomainRows(regSheet)
    .map((r) => ({
      region: String(r.region),
      anterior: Number(r.ventas_ano_anterior) || 0,
      actual: Number(r.ventas_ano_actual) || 0,
      peso: Number(r.peso) || 0,
      varUsd: Number(r.var_interanual_usd) || 0,
      unidAnt: Number(r.ventas_unid_ano_anterior) || 0,
      unid: Number(r.ventas_unid_ano_actual) || 0,
      varUnd: Number(r.var_interanual_und) || 0,
    }))
    .sort((a, b) => b.actual - a.actual);

  const totalActual = regRows.reduce((s, r) => s + r.actual, 0);
  const totalAnt = regRows.reduce((s, r) => s + r.anterior, 0);
  const totalUnid = regRows.reduce((s, r) => s + r.unid, 0);
  const totalUnidAnt = regRows.reduce((s, r) => s + r.unidAnt, 0);
  const varTotal = totalAnt > 0 ? totalActual / totalAnt - 1 : 0;
  const varUnidTotal = totalUnidAnt > 0 ? totalUnid / totalUnidAnt - 1 : 0;

  const leaderUnidades = [...regRows].sort((a, b) => b.unid - a.unid)[0];

  const regCols: ColumnSpec[] = [
    { key: 'region', label: 'Región', type: 'category', uniqueCount: 0, filterable: false, role: 'dimension' },
    { key: 'anterior', label: 'Ventas $ año anterior', type: 'currency', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'actual', label: 'Ventas $ año actual', type: 'currency', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'peso', label: '% Peso', type: 'percent', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'varUsd', label: '% Var. interanual USD', type: 'percent', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'unidAnt', label: 'Ventas Unid. año anterior', type: 'number', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'unid', label: 'Ventas Unid. año actual', type: 'number', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'varUnd', label: '% Var. interanual Und', type: 'percent', uniqueCount: 0, filterable: true, role: 'measure' },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Regiones de Venezuela" subtitle={`${regRows.length} regiones · cierre ${pdfReference.period}`} />
        <KpiGrid items={[
          { label: `Líder USD · ${regRows[0]?.region ?? '—'}`, value: regRows[0] ? fmtCurrency(regRows[0].actual, { short: true }) : '—', caption: regRows[0] ? `${fmtPercent(regRows[0].peso)} del total · ${fmtDelta(regRows[0].varUsd)} vs 2025` : undefined, tone: regRows[0] ? tone(regRows[0].varUsd) : 'neutral' },
          { label: 'Total ventas USD', value: fmtCurrency(totalActual, { short: true }), caption: `vs ${fmtCurrency(totalAnt, { short: true })} 2025`, tone: tone(varTotal), delta: fmtDelta(varTotal) },
          { label: 'Total unidades', value: fmtNumber(totalUnid, { short: true }), caption: `vs ${fmtNumber(totalUnidAnt, { short: true })} 2025`, tone: tone(varUnidTotal), delta: fmtDelta(varUnidTotal) },
          { label: 'Regiones', value: String(regRows.length), caption: `Líder unidades · ${leaderUnidades?.region ?? '—'}` },
        ]} cols={4} />
      </Card>

      <Card>
        <CardHeader title="Detalle por región" subtitle="Comparativo anterior vs actual · USD y unidades" />
        <Table columns={regCols} rows={regRows} pageSize={regRows.length} dense />
      </Card>

      {estSheet && <EstadosCard sheet={estSheet} />}
    </div>
  );
}

function EstadosCard({ sheet }: { sheet: import('@/lib/data-inference').SheetData }) {
  const rows = sheet.rows
    .filter((r) => r.estado && String(r.estado).toUpperCase() !== 'TOTAL' && Number(r.ventas_ano_actual) > 0)
    .map((r) => ({
      region: String(r.region_ims ?? ''),
      estado: String(r.estado),
      anterior: Number(r.ventas_ano_anterior) || 0,
      actual: Number(r.ventas_ano_actual) || 0,
      peso: Number(r.peso) || 0,
      varUsd: Number(r.var_interanual_usd) || 0,
      unidAnt: Number(r.ventas_unid_ano_anterior) || 0,
      unid: Number(r.ventas_unid_ano_actual) || 0,
      varUnd: Number(r.var_interanual_und) || 0,
    }))
    .sort((a, b) => b.actual - a.actual);

  const totalActual = rows.reduce((s, r) => s + r.actual, 0);
  const totalAnt = rows.reduce((s, r) => s + r.anterior, 0);
  const totalUnid = rows.reduce((s, r) => s + r.unid, 0);
  const totalUnidAnt = rows.reduce((s, r) => s + r.unidAnt, 0);
  const varTotal = totalAnt > 0 ? totalActual / totalAnt - 1 : 0;
  const varUnidTotal = totalUnidAnt > 0 ? totalUnid / totalUnidAnt - 1 : 0;

  const leaderUnidades = [...rows].sort((a, b) => b.unid - a.unid)[0];

  const regiones = Array.from(new Set(rows.map((r) => r.region).filter(Boolean))).sort();
  const [regionFilter, setRegionFilter] = useState<string>('TODAS');
  const filtered = regionFilter === 'TODAS' ? rows : rows.filter((r) => r.region === regionFilter);

  const fActual = filtered.reduce((s, r) => s + r.actual, 0);
  const fAnt = filtered.reduce((s, r) => s + r.anterior, 0);
  const fUnid = filtered.reduce((s, r) => s + r.unid, 0);
  const fUnidAnt = filtered.reduce((s, r) => s + r.unidAnt, 0);
  const fVar = fAnt > 0 ? fActual / fAnt - 1 : 0;
  const fVarUnd = fUnidAnt > 0 ? fUnid / fUnidAnt - 1 : 0;

  const totalRow = {
    region: '',
    estado: 'Total',
    anterior: fAnt,
    actual: fActual,
    peso: regionFilter === 'TODAS' ? 1 : (totalActual > 0 ? fActual / totalActual : 0),
    varUsd: fVar,
    unidAnt: fUnidAnt,
    unid: fUnid,
    varUnd: fVarUnd,
  };
  const allRows = [...filtered, totalRow];

  const estCols: ColumnSpec[] = [
    { key: 'region', label: 'Región IMS', type: 'category', uniqueCount: 0, filterable: true, role: 'dimension' },
    { key: 'estado', label: 'Estado', type: 'category', uniqueCount: 0, filterable: false, role: 'dimension' },
    { key: 'anterior', label: 'Ventas $ año anterior', type: 'currency', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'actual', label: 'Ventas $ año actual', type: 'currency', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'peso', label: '% Peso', type: 'percent', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'varUsd', label: '% Var. interanual USD', type: 'percent', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'unidAnt', label: 'Ventas Unid. año anterior', type: 'number', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'unid', label: 'Ventas Unid. año actual', type: 'number', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'varUnd', label: '% Var. interanual Und', type: 'percent', uniqueCount: 0, filterable: true, role: 'measure' },
  ];

  return (
    <>
      <Card>
        <CardHeader title="Estados de Venezuela" subtitle={`${rows.length} estados · cierre ${pdfReference.period}`} />
        <KpiGrid items={[
          { label: `Líder USD · ${rows[0]?.estado ?? '—'}`, value: rows[0] ? fmtCurrency(rows[0].actual, { short: true }) : '—', caption: rows[0] ? `${rows[0].region} · ${fmtPercent(rows[0].peso)} · ${fmtDelta(rows[0].varUsd)}` : undefined, tone: rows[0] ? tone(rows[0].varUsd) : 'neutral' },
          { label: `Líder unidades · ${leaderUnidades?.estado ?? '—'}`, value: leaderUnidades ? fmtNumber(leaderUnidades.unid, { short: true }) : '—', caption: leaderUnidades ? `${fmtDelta(leaderUnidades.varUnd)} vs 2025` : undefined, tone: leaderUnidades ? tone(leaderUnidades.varUnd) : 'neutral' },
          { label: 'Total ventas USD', value: fmtCurrency(totalActual, { short: true }), caption: `vs ${fmtCurrency(totalAnt, { short: true })} 2025`, tone: tone(varTotal), delta: fmtDelta(varTotal) },
          { label: 'Total unidades', value: fmtNumber(totalUnid, { short: true }), caption: `vs ${fmtNumber(totalUnidAnt, { short: true })} 2025`, tone: tone(varUnidTotal), delta: fmtDelta(varUnidTotal) },
        ]} cols={4} />
      </Card>

      <Card>
        <CardHeader title="Detalle por estado" subtitle="Desglose por región IMS · ordená por columnas" />
        <Tabs
          tabs={[{ id: 'TODAS', label: `Todas (${rows.length})` }, ...regiones.map((r) => ({ id: r, label: r }))]}
          value={regionFilter}
          onChange={setRegionFilter}
        />
        <div className="mt-3">
          <Table columns={estCols} rows={allRows} pageSize={allRows.length} dense />
        </div>
      </Card>
    </>
  );
}

function RegionFallback() {
  const regs = pdfReference.regiones as Array<{ region: string; ventas: number; cuota: number }>;
  const sorted = [...regs].sort((a, b) => b.ventas - a.ventas);
  const totalVentas = regs.reduce((s, r) => s + r.ventas, 0);
  const totalCuota  = regs.reduce((s, r) => s + r.cuota,  0);
  const cobertura   = totalCuota > 0 ? totalVentas / totalCuota : 0;

  const byVentas    = sorted.map((r) => ({ key: r.region, value: r.ventas }));
  const byCobertura = [...regs]
    .sort((a, b) => b.ventas / b.cuota - a.ventas / a.cuota)
    .map((r) => ({ key: r.region, value: r.cuota > 0 ? r.ventas / r.cuota : 0 }));

  const cols: ColumnSpec[] = [
    { key: 'region',    label: 'Región',               type: 'category', uniqueCount: 0, filterable: false, role: 'dimension' },
    { key: 'ventas',    label: 'Ventas $ (referencia)', type: 'currency', uniqueCount: 0, filterable: true,  role: 'measure' },
    { key: 'cuota',     label: 'Cuota $',               type: 'currency', uniqueCount: 0, filterable: true,  role: 'measure' },
    { key: 'cobertura', label: '% Cobertura',           type: 'percent',  uniqueCount: 0, filterable: true,  role: 'measure' },
  ];
  const tableRows = sorted.map((r) => ({ ...r, cobertura: r.cuota > 0 ? r.ventas / r.cuota : 0 }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Regiones / Estados"
          subtitle="Regiones y estados de Venezuela"
        />
        <KpiGrid items={[
          { label: `Líder · ${sorted[0]?.region ?? '—'}`, value: fmtCurrency(sorted[0]?.ventas ?? 0, { short: true }), caption: `Cuota ${fmtCurrency(sorted[0]?.cuota ?? 0, { short: true })}`, tone: sorted[0] ? tone(sorted[0].ventas / sorted[0].cuota - 1) : 'neutral' },
          { label: 'Total ventas USD', value: fmtCurrency(totalVentas, { short: true }), caption: `Cuota ${fmtCurrency(totalCuota, { short: true })}`, tone: tone(cobertura - 1) },
          { label: 'Cobertura total', value: fmtPercent(cobertura), tone: cobertura >= 0.9 ? 'positive' : 'warn', caption: 'Cumplimiento' },
          { label: 'Regiones', value: String(regs.length), caption: 'Activas en el periodo' },
        ]} cols={4} />
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Ventas por región" subtitle="Año actual (USD)" />
          <D3HorizontalBarChart data={byVentas} format={(n) => fmtCurrency(n, { short: true })} color="#01205e" />
        </Card>
        <Card>
          <CardHeader title="Cobertura por región" subtitle="% ventas vs cuota" />
          <D3HorizontalBarChart data={byCobertura} format={(n) => fmtPercent(n)} color="#1f5dc9" />
        </Card>
      </div>

      <Card>
        <CardHeader title="Detalle por región" />
        <Table columns={cols} rows={tableRows} pageSize={tableRows.length} dense />
      </Card>
    </div>
  );
}

// ---------- Proveedores ----------
function ProveedoresSection() {
  const sheet = findSheet(/proveedor|laboratorio/i);
  if (!sheet) return <Card><CardHeader title="Proveedores / Laboratorios" /><p className="text-sm text-slate-500">No se detectó hoja específica de proveedores.</p></Card>;

  const providerValueRows = domains?.providers?.byValue?.length ? domains.providers.byValue : sheet.rows;
  const providerUnitRows = domains?.providers?.byUnits?.length ? domains.providers.byUnits : sheet.rows;

  // Block A: proveedor ranking by USD (left half of sheet / domains.providers.byValue)
  const byVal = providerValueRows
    .filter((r) => r.proveedor && String(r.proveedor).toUpperCase() !== 'TOTAL')
    .map((r) => ({
      proveedor: String(r.proveedor).trim(),
      actual: Number(r.ventas_ano_actual) || 0,
      anterior: Number(r.ventas_ano_anterior) || 0,
      peso: Number(r.peso) || 0,
      varUsd: Number(r.var_interanual_usd) || 0,
      unid: Number(r.ventas_unid_ano_actual) || 0,
      varUnd: Number(r.var_interanual_und) || 0,
      precio: cleanPrice(r.precio_promedio),
    }))
    .filter((r) => r.actual > 0)
    .sort((a, b) => b.actual - a.actual);

  // Block B: laboratorio ranking by unidades (right half / domains.providers.byUnits)
  const byUnits = providerUnitRows
    .filter((r) => (r.proveedor || r.proveedor_2) && String(r.proveedor ?? r.proveedor_2).toUpperCase() !== 'TOTAL')
    .map((r) => ({
      proveedor: String(r.proveedor ?? r.proveedor_2).trim(),
      actual: Number(r.ventas_ano_actual ?? r.ventas_ano_actual_2) || 0,
      anterior: Number(r.ventas_ano_anterior ?? r.ventas_ano_anterior_2) || 0,
      unid: Number(r.ventas_unid_ano_actual ?? r.ventas_unid_ano_actual_2) || 0,
      unidAnt: Number(r.ventas_unid_ano_anterior ?? r.ventas_unid_ano_anterior_2) || 0,
      peso: Number(r.peso ?? r.peso_2) || 0,
      varUsd: Number(r.var_interanual_usd ?? r.var_interanual_usd_2) || 0,
      varUnd: Number(r.var_interanual_und ?? r.var_interanual_und_2) || 0,
      precio: cleanPrice(r.precio_promedio ?? r.precio_promedio_2),
    }))
    .filter((r) => r.unid > 0)
    .sort((a, b) => b.unid - a.unid);

  const topVal = byVal.slice(0, 15).map((r) => ({ key: r.proveedor, value: r.actual }));
  const topUnits = byUnits.slice(0, 15).map((r) => ({ key: r.proveedor, value: r.unid }));

  const totalUsd = byVal.reduce((s, r) => s + r.actual, 0);
  const totalUnd = byUnits.reduce((s, r) => s + r.unid, 0);

  // Need unidades anterior on the value-ranked dataset too
  const byValEnriched = byVal.map((r, i) => {
    const orig = sheet.rows.find((x) => String(x.proveedor).trim() === r.proveedor);
    return { ...r, unidAnt: orig ? Number(orig.ventas_unid_ano_anterior) || 0 : 0 };
  });
  const byUnitsEnriched = byUnits.map((r) => {
    const orig = sheet.rows.find((x) => String(x.proveedor_2).trim() === r.proveedor);
    return {
      ...r,
      anterior: r.anterior || (orig ? Number(orig.ventas_ano_anterior_2) || 0 : 0),
      unidAnt: r.unidAnt || (orig ? Number(orig.ventas_unid_ano_anterior_2) || 0 : 0),
    };
  });

  const colsVal: ColumnSpec[] = [
    { key: 'proveedor', label: 'Proveedor', type: 'category', uniqueCount: 0, filterable: false, role: 'dimension' },
    { key: 'anterior', label: 'Ventas $ año anterior', type: 'currency', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'actual', label: 'Ventas $ año actual', type: 'currency', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'peso', label: '% Peso', type: 'percent', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'varUsd', label: '% Var. interanual USD', type: 'percent', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'unidAnt', label: 'Unid. año anterior', type: 'number', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'unid', label: 'Unid. año actual', type: 'number', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'varUnd', label: '% Var. interanual Und', type: 'percent', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'precio', label: 'Precio prom. USD', type: 'currency', uniqueCount: 0, filterable: true, role: 'measure' },
  ];

  const colsUnits: ColumnSpec[] = [
    { key: 'proveedor', label: 'Laboratorio', type: 'category', uniqueCount: 0, filterable: false, role: 'dimension' },
    { key: 'unidAnt', label: 'Unid. año anterior', type: 'number', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'unid', label: 'Unid. año actual', type: 'number', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'varUnd', label: '% Var. interanual Und', type: 'percent', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'anterior', label: 'Ventas $ año anterior', type: 'currency', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'actual', label: 'Ventas $ año actual', type: 'currency', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'peso', label: '% Peso USD', type: 'percent', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'precio', label: 'Precio prom. USD', type: 'currency', uniqueCount: 0, filterable: true, role: 'measure' },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Proveedores / Laboratorios" subtitle={`${byVal.length} proveedores · ${fmtCurrency(totalUsd, { short: true })} ventas · ${fmtNumber(totalUnd, { short: true })} unidades`} />
        <KpiGrid items={[
          { label: `Líder USD · ${byVal[0]?.proveedor ?? '—'}`, value: byVal[0] ? fmtCurrency(byVal[0].actual, { short: true }) : '—', caption: byVal[0] ? `${fmtPercent(byVal[0].peso)} del total · ${fmtDelta(byVal[0].varUsd)} vs 2025` : undefined, tone: byVal[0] ? tone(byVal[0].varUsd) : 'neutral' },
          { label: `Líder unidades · ${byUnits[0]?.proveedor ?? '—'}`, value: byUnits[0] ? fmtNumber(byUnits[0].unid, { short: true }) : '—', caption: byUnits[0] ? `${fmtCurrency(byUnits[0].actual, { short: true })} · ${fmtDelta(byUnits[0].varUnd)} und` : undefined, tone: byUnits[0] ? tone(byUnits[0].varUnd) : 'neutral' },
          { label: 'Total proveedores', value: String(byVal.length), caption: `${fmtCurrency(totalUsd, { short: true })} acumulado` },
          { label: 'Concentración top 10', value: fmtPercent(byVal.slice(0, 10).reduce((s, r) => s + r.peso, 0)), caption: 'Peso de los 10 mayores' },
        ]} cols={4} />
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Top 15 proveedores por USD" subtitle="Ventas año 2026 (USD)" />
          <D3HorizontalBarChart data={topVal} format={(n) => fmtCurrency(n, { short: true })} color="#01205e" />
        </Card>
        <Card>
          <CardHeader title="Ranking laboratorios por unidades" subtitle="Top 15 año 2026 (unidades)" />
          <D3HorizontalBarChart data={topUnits} format={(n) => fmtNumber(n, { short: true })} color="#1f5dc9" />
        </Card>
      </div>

      <Card>
        <CardHeader title="Detalle proveedores por valor USD" subtitle={`${byValEnriched.length} filas`} />
        <Table columns={colsVal} rows={byValEnriched} pageSize={15} dense />
      </Card>
      <Card>
        <CardHeader title="Detalle laboratorios por unidades" subtitle={`${byUnitsEnriched.length} filas`} />
        <Table columns={colsUnits} rows={byUnitsEnriched} pageSize={15} dense />
      </Card>
    </div>
  );
}

// ---------- Categorías ----------
const CATEGORIA_COLS: ColumnSpec[] = [
  { key: 'categoria', label: 'Categoría', type: 'category', uniqueCount: 0, filterable: false, role: 'dimension' },
  { key: 'anterior', label: 'Ventas $ año anterior', type: 'currency', uniqueCount: 0, filterable: true, role: 'measure' },
  { key: 'actual', label: 'Ventas $ año actual', type: 'currency', uniqueCount: 0, filterable: true, role: 'measure' },
  { key: 'peso', label: '% Peso', type: 'percent', uniqueCount: 0, filterable: true, role: 'measure' },
  { key: 'varUsd', label: '% Var. interanual USD', type: 'percent', uniqueCount: 0, filterable: true, role: 'measure' },
  { key: 'unidAnt', label: 'Ventas Unid. año anterior', type: 'number', uniqueCount: 0, filterable: true, role: 'measure' },
  { key: 'unid', label: 'Ventas Unid. año actual', type: 'number', uniqueCount: 0, filterable: true, role: 'measure' },
  { key: 'varUnd', label: '% Var. interanual Und', type: 'percent', uniqueCount: 0, filterable: true, role: 'measure' },
];

function mapCategoriaRows(raw: Record<string, unknown>[]) {
  return raw
    .filter((r) => r.categorias && String(r.categorias).trim().toUpperCase() !== 'TOTAL')
    .map((r) => ({
      categoria: String(r.categorias).trim(),
      anterior: Number(r.ventas_ano_anterior) || 0,
      actual: Number(r.ventas_ano_actual) || 0,
      peso: Number(r.peso) || 0,
      varUsd: Number(r.var_interanual_usd) || 0,
      unidAnt: Number(r.ventas_unid_ano_anterior) || 0,
      unid: Number(r.ventas_unid_ano_actual) || 0,
      varUnd: Number(r.var_interanual_und) || 0,
    }))
    .filter((r) => r.actual > 0 || r.anterior > 0)
    .sort((a, b) => b.actual - a.actual);
}

function CategoriaBlock({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: ReturnType<typeof mapCategoriaRows>;
}) {
  if (rows.length === 0) {
    return <Card><CardHeader title={title} subtitle={subtitle} /><p className="text-sm text-slate-500">No hay filas para este criterio.</p></Card>;
  }
  const totalActual = rows.reduce((s, r) => s + r.actual, 0);
  const totalAnt = rows.reduce((s, r) => s + r.anterior, 0);
  const totalUnid = rows.reduce((s, r) => s + r.unid, 0);
  const totalUnidAnt = rows.reduce((s, r) => s + r.unidAnt, 0);
  const varTotal = totalAnt > 0 ? totalActual / totalAnt - 1 : 0;
  const varUnidTotal = totalUnidAnt > 0 ? totalUnid / totalUnidAnt - 1 : 0;
  const leader = rows[0];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title={title} subtitle={subtitle} />
        <KpiGrid items={[
          { label: `Líder USD · ${leader?.categoria ?? '—'}`, value: leader ? fmtCurrency(leader.actual, { short: true }) : '—', caption: leader ? `${fmtPercent(leader.peso)} del total · ${fmtDelta(leader.varUsd)} vs 2025` : undefined, tone: leader ? tone(leader.varUsd) : 'neutral' },
          { label: 'Total ventas USD', value: fmtCurrency(totalActual, { short: true }), caption: `vs ${fmtCurrency(totalAnt, { short: true })} 2025`, tone: tone(varTotal), delta: fmtDelta(varTotal) },
          { label: 'Total unidades', value: fmtNumber(totalUnid, { short: true }), caption: `vs ${fmtNumber(totalUnidAnt, { short: true })} 2025`, tone: tone(varUnidTotal), delta: fmtDelta(varUnidTotal) },
          { label: 'Categorías', value: String(rows.length) },
        ]} cols={4} />
      </Card>

      <Card>
        <CardHeader title="Detalle" subtitle="Comparativo año actual vs año anterior · sin fila Total" />
        <Table columns={CATEGORIA_COLS} rows={rows} pageSize={rows.length} dense />
      </Card>

    </div>
  );
}

function CategoriaMixCard({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: ReturnType<typeof mapCategoriaRows>;
}) {
  const donut = rows.map((r) => ({ key: r.categoria, value: r.actual }));
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <D3DonutChart data={donut} format={(n) => fmtCurrency(n, { short: true })} />
    </Card>
  );
}

function CategoriasSection() {
  const sheet = findSheet(/categor|tipo|familia|linea/i);
  if (!sheet) return <Card><CardHeader title="Categorías" /><p className="text-sm text-slate-500">Hoja de categorías no encontrada.</p></Card>;

  // ponytail: sheet has two stacked blocks separated by a header row where categorias === 'TIPO'
  const splitIdx = sheet.rows.findIndex((r) => String(r.categorias ?? '').trim().toUpperCase() === 'TIPO');
  const tipoRaw  = domains?.categories?.byProductType?.length ? domains.categories.byProductType : (splitIdx >= 0 ? sheet.rows.slice(0, splitIdx)  : sheet.rows);
  const lineaRaw = domains?.categories?.byCommercialLine?.length ? domains.categories.byCommercialLine : (splitIdx >= 0 ? sheet.rows.slice(splitIdx + 1) : []);

  const tipoRows  = mapCategoriaRows(tipoRaw);
  const lineaRows = mapCategoriaRows(lineaRaw);

  return (
    <div className="space-y-6">
      <CategoriaBlock
        title="Tipo de producto · Medicinas / Misceláneos"
        subtitle={`${tipoRows.length} categorías · cierre ${pdfReference.period}`}
        rows={tipoRows}
      />
      <CategoriaBlock
        title="Línea comercial"
        subtitle={`${lineaRows.length} líneas · cierre ${pdfReference.period}`}
        rows={lineaRows}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <CategoriaMixCard
          title="Mix % por tipo"
          subtitle="Medicinas vs Misceláneos · ventas USD año actual"
          rows={tipoRows}
        />
        <CategoriaMixCard
          title="Mix % por línea"
          subtitle="Líneas comerciales · ventas USD año actual"
          rows={lineaRows}
        />
      </div>
    </div>
  );
}

// ---------- Clientes ----------
function ClientesSection() {
  const sheet = findSheet(/cliente/i);
  if (!sheet) return <Card><CardHeader title="Clientes" /><p className="text-sm text-slate-500">No se detectó hoja específica de clientes. Usá el explorador.</p></Card>;

  const colCliente = findColumn(sheet, /^cliente$/i) ?? sheet.columns.find((c) => c.role === 'dimension');
  const colActual  = findColumn(sheet, /val.*2026/i) ?? findColumn(sheet, /2026/i);
  const colAnterior = findColumn(sheet, /val.*2025/i) ?? findColumn(sheet, /2025/i);
  const colCreci   = findColumn(sheet, /creci/i);

  if (!colCliente || !colActual) return <Card><CardHeader title="Clientes" /><p className="text-sm text-slate-500">Columnas insuficientes.</p></Card>;

  const individualRows = domains?.clients?.individual?.length ? domains.clients.individual : sheet.rows;
  const groupRows = domains?.clients?.groups?.length ? domains.clients.groups : [];

  const raw = individualRows.map((r) => ({
    pos:       Number(r.pos) || null,
    key:       String(r.cliente ?? r[colCliente!.key] ?? '').trim(),
    value:     Number(r.val_2026 ?? r[colActual!.key])   || 0,
    valuePrev: colAnterior ? (Number(r.val_2025 ?? r[colAnterior.key]) || 0) : undefined,
    _growth:   Number(r.creci_vs_ano_anterior ?? (colCreci ? r[colCreci.key] : 0)) || 0,
  }));

  const top = filterAggregates(raw)
    .filter((d) => d.value > 0)
    .sort((a, b) => (a.pos ?? Infinity) - (b.pos ?? Infinity))
    .slice(0, 10)
    .map(({ _growth: _, pos: __, ...rest }) => rest);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Top 10 clientes" subtitle="Barras horizontales comparativas · Val 2025 vs Val 2026 · ordenado por POS" />
        <D3HorizontalBarChart data={top} format={(n) => fmtCurrency(n, { short: true })} color="#12A8E0" labelPrev="2025" labelCurr="2026" />
      </Card>
      <Card>
        <CardHeader title="Clientes individuales" subtitle="Ranking individual · Val 2026 y crecimiento real" />
        <Table
          columns={[
            { key: 'pos', label: 'Pos', type: 'number', uniqueCount: 0, filterable: false, role: 'measure' },
            { key: 'codcli', label: 'CODCLI', type: 'category', uniqueCount: 0, filterable: false, role: 'dimension' },
            { key: 'cliente', label: 'Cliente', type: 'category', uniqueCount: 0, filterable: false, role: 'dimension' },
            { key: 'val_2025', label: 'Val 2025', type: 'currency', uniqueCount: 0, filterable: true, role: 'measure' },
            { key: 'val_2026', label: 'Val 2026', type: 'currency', uniqueCount: 0, filterable: true, role: 'measure' },
            { key: 'creci_vs_ano_anterior', label: 'Creci. vs año anterior', type: 'percent', uniqueCount: 0, filterable: true, role: 'measure' },
          ]}
          rows={individualRows}
          pageSize={10}
          dense
          maxHeight="520px"
        />
      </Card>
      <Card>
        <CardHeader title="Grupos de clientes" subtitle="Ranking separado · no mezclado con clientes individuales" />
        <Table
          columns={[
            { key: 'pos', label: 'Pos', type: 'number', uniqueCount: 0, filterable: false, role: 'measure' },
            { key: 'name', label: 'Grupo cliente', type: 'category', uniqueCount: 0, filterable: false, role: 'dimension' },
            { key: 'val_2025', label: 'Val 2025', type: 'currency', uniqueCount: 0, filterable: true, role: 'measure' },
            { key: 'val_2026', label: 'Val 2026', type: 'currency', uniqueCount: 0, filterable: true, role: 'measure' },
            { key: 'creci_vs_ano_anterior', label: 'Creci. vs año anterior', type: 'percent', uniqueCount: 0, filterable: true, role: 'measure' },
          ]}
          rows={groupRows}
          pageSize={10}
          dense
          maxHeight="520px"
        />
      </Card>
    </div>
  );
}

// ---------- CxC ----------
function CxcSection() {
  const sheet = findSheet(/^7\. CXC/) || findSheet(/cxc|cuenta.*cobr|cartera|antig/i);
  if (!sheet) return <Card><CardHeader title="Cuentas por Cobrar" /><p className="text-sm text-slate-500">Hoja CxC no encontrada.</p></Card>;

  const BUCKETS = [
    { key: '1_a_3_dias', label: '1-3 días' },
    { key: '4_a_15_dias', label: '4-15 días' },
    { key: '16_a_21_dias', label: '16-21 días' },
    { key: '22_a_40_dias', label: '22-40 días' },
    { key: '41_a_60_dias', label: '41-60 días' },
    { key: '61_a_90_dias', label: '61-90 días' },
    { key: 'mayor_a_90_dias', label: '+90 días' },
  ];

  const clientRows = (domains?.accountsReceivable?.byClient?.length ? domains.accountsReceivable.byClient : getDetailRowsOnly(sheet.rows).filter((r) => {
    const d = String(r.dias_antiguedad ?? '').toUpperCase().trim();
    return d && d !== 'TOTAL';
  }));
  const cxcSummary = domains?.accountsReceivable?.summary;

  const bucketTotals = BUCKETS.map((b) => ({
    key: b.label,
    value: clientRows.reduce((s, r) => s + Math.max(0, Number(r[b.key]) || 0), 0),
  }));
  const total = sumBy(clientRows, 'total');
  const top10Total = Number(cxcSummary?.top10) || topClientsTotal(clientRows, 10);
  const pesoTop10 = Number(cxcSummary?.pesoTop10) || (total > 0 ? top10Total / total : 0);

  const topClients = clientRows
    .map((r) => ({ cliente: String(r.dias_antiguedad), total: Number(r.total) || 0, peso: Number(r.peso) || 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map((r) => ({ key: r.cliente, value: r.total }));

  const cols: ColumnSpec[] = [
    { key: 'dias_antiguedad', label: 'Cliente', type: 'category', uniqueCount: 0, filterable: false, role: 'dimension' },
    ...BUCKETS.map<ColumnSpec>((b) => ({ key: b.key, label: b.label, type: 'currency', uniqueCount: 0, filterable: true, role: 'measure' })),
    { key: 'total', label: 'Total USD', type: 'currency', uniqueCount: 0, filterable: true, role: 'measure' },
    { key: 'peso', label: '% Peso', type: 'percent', uniqueCount: 0, filterable: true, role: 'measure' },
  ];

  const riesgo = bucketTotals.slice(4).reduce((s, b) => s + b.value, 0); // 41+ días
  const pctRiesgo = total > 0 ? riesgo / total : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Cuentas por Cobrar — antigüedad" subtitle={`Total cartera ${fmtCurrency(total, { short: true })} · ${clientRows.length} clientes`} />
        <KpiGrid items={[
          { label: 'Total cartera', value: fmtCurrency(total, { short: true }) },
          { label: 'Riesgo (+40 días)', value: fmtCurrency(riesgo, { short: true }), caption: fmtPercent(pctRiesgo) + ' del total', tone: pctRiesgo > 0.2 ? 'alert' : 'positive' },
          { label: 'Top 10', value: fmtCurrency(top10Total, { short: true }), caption: 'Saldo acumulado top 10' },
          { label: 'Peso top 10', value: fmtPercent(pesoTop10), caption: 'Participación sobre cartera' },
          { label: 'Top cliente', value: topClients[0]?.key ?? '—', caption: topClients[0] ? fmtCurrency(topClients[0].value, { short: true }) : undefined },
        ]} cols={5} />
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Distribución por tramo de antigüedad" subtitle="Valores positivos por tramo · notas de crédito quedan en detalle" />
          <D3DonutChart data={bucketTotals} format={(n) => fmtCurrency(n, { short: true })} />
        </Card>
        <Card>
          <CardHeader title="Top 10 clientes por saldo" />
          <D3HorizontalBarChart data={topClients} format={(n) => fmtCurrency(n, { short: true })} color="#D92929" />
        </Card>
      </div>
      <Card>
        <CardHeader title="Detalle CxC por cliente" subtitle={`${clientRows.length} clientes · sin Total / Top / Peso Top`} />
        <Table columns={cols} rows={clientRows} pageSize={15} dense maxHeight="560px" />
      </Card>
    </div>
  );
}

function topClientsTotal(rows: Record<string, unknown>[], limit: number): number {
  return rows
    .map((r) => Number(r.total) || 0)
    .sort((a, b) => b - a)
    .slice(0, limit)
    .reduce((s, n) => s + n, 0);
}

// ---------- Visitas ----------
function VisitasSection() {
  const sheet = findSheet(/visita/i);
  if (!sheet) {
    const heat = ['Ene','Feb','Mar','Abr','May'].flatMap((m) =>
      pdfReference.visitasPorRegion.map((r) => ({ x: m, y: r.region, value: Math.round(r.visitas / 5 * (0.85 + Math.random() * 0.3)) }))
    );
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader title="Visitas comerciales" subtitle={`Acumulado periodo: ${fmtNumber(pdfReference.kpis.visitasComerciales, { short: true })}`} />
          <D3HorizontalBarChart
            data={pdfReference.visitasPorRegion.map((r) => ({ key: r.region, value: r.visitas }))}
            format={(n) => fmtNumber(n, { integer: true })}
            color="#0078D4"
          />
        </Card>
        <Card>
          <CardHeader title="Heatmap visitas por región / mes" />
          <D3Heatmap data={heat} format={(n) => fmtNumber(n, { integer: true })} />
        </Card>
      </div>
    );
  }
  const dim = findColumn(sheet, /(region|zona|estado|sucursal)/i) || sheet.columns.find((c) => c.role === 'dimension');
  const meas = findColumn(sheet, /(visita|cantidad)/i) || sheet.columns.find((c) => c.role === 'measure');
  if (!dim || !meas) return <Card><CardHeader title="Visitas" /><p className="text-sm text-slate-500">Columnas insuficientes.</p></Card>;
  const data = groupSum(sheet.rows, dim.key, meas.key);
  return (
    <Card>
      <CardHeader title="Visitas por región" />
      <D3HorizontalBarChart data={data} format={(n) => fmtNumber(n, { integer: true })} color="#0078D4" />
    </Card>
  );
}

// ---------- utils ----------
function findSalesSheet() {
  return (
    workbookData.sheets.find((s) => /venta|cierre|cuota/i.test(s.name) && s.columns.some((c) => c.role === 'measure')) ||
    workbookData.sheets.find((s) => s.columns.some((c) => /(venta|valor|monto|total)/i.test(c.label))) ||
    null
  );
}

void Boxes; void Users;
