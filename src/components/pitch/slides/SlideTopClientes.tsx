import { useMemo } from 'react';
import { SlideShell, SourceBadge } from '../SlideShell';
import { D3HorizontalBarChart } from '@/components/charts/D3HorizontalBarChart';
import { workbookData, findSheet, findColumn } from '@/lib/data-inference';
import { filterAggregates } from '@/lib/aggregates';
import { fmtCurrency, fmtNumber } from '@/lib/format';

function resolveClientes() {
  const sheet = findSheet(/cliente/i);
  if (!sheet) return null;
  const domains = workbookData.domains as { clients?: { individual?: Record<string, unknown>[] } } | undefined;
  const colCliente = findColumn(sheet, /^cliente$/i) ?? sheet.columns.find((c) => c.role === 'dimension');
  const colActual = findColumn(sheet, /val.*2026/i) ?? findColumn(sheet, /2026/i);
  const colAnterior = findColumn(sheet, /val.*2025/i) ?? findColumn(sheet, /2025/i);
  const colCreci = findColumn(sheet, /creci/i);
  if (!colCliente || !colActual) return null;

  const rows = domains?.clients?.individual?.length ? domains.clients.individual : sheet.rows;
  const raw = rows.map((r) => ({
    key: String(r.cliente ?? r[colCliente!.key] ?? '').trim(),
    value: Number(r.val_2026 ?? r[colActual!.key]) || 0,
    valuePrev: colAnterior ? (Number(r.val_2025 ?? r[colAnterior.key]) || 0) : undefined,
    _growth: Number(r.creci_vs_ano_anterior ?? (colCreci ? r[colCreci.key] : 0)) || 0,
  }));

  const sorted = filterAggregates(raw)
    .filter((d) => d.value > 0)
    .sort((a, b) => b._growth - a._growth)
    .slice(0, 10);

  if (sorted.length < 3) return null;
  return sorted.map(({ _growth: _, ...rest }) => rest);
}

export function SlideTopClientes() {
  const data = useMemo(resolveClientes, []);
  const real = !!data;
  const total = useMemo(() => (data ?? []).reduce((a, b) => a + b.value, 0), [data]);

  return (
    <SlideShell
      num="06"
      eyebrow="Concentracion de clientes"
      right={<SourceBadge label={real ? 'Hoja 6 · TOP CLIENTES' : 'PDF de referencia'} />}
    >
      <div className="pitch-panel" data-reveal>
        <h3>Top {data?.length ?? 10} clientes por crecimiento · {real ? `Total 2026: ${fmtCurrency(total, { short: true })}` : 'Muestra'}</h3>
        <div className="mt-4">
          {data ? (
            <D3HorizontalBarChart data={data} format={(n) => fmtCurrency(n, { short: true })} color="#12A8E0" labelPrev="2025" labelCurr="2026" />
          ) : (
            <D3HorizontalBarChart
              data={[
                { key: 'Cliente 1', value: 1850000 },
                { key: 'Cliente 2', value: 1420000 },
                { key: 'Cliente 3', value: 980000 },
                { key: 'Cliente 4', value: 720000 },
                { key: 'Cliente 5', value: 540000 },
                { key: 'Cliente 6', value: 410000 },
              ]}
              format={(n) => fmtCurrency(n, { short: true })}
              color="#12A8E0"
            />
          )}
        </div>
      </div>
    </SlideShell>
  );
}
