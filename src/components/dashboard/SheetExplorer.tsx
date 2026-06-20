import { useMemo, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { FilterPanel } from './FilterPanel';
import { workbookData, type FilterState } from '@/lib/data-inference';
import { applyFilters } from '@/lib/filters';
import { AlertTriangle, Database } from 'lucide-react';

export function SheetExplorer() {
  const sheets = workbookData.sheets;
  const [sheetName, setSheetName] = useState(sheets[0]?.name ?? '');
  const sheet = sheets.find((s) => s.name === sheetName) ?? sheets[0];
  const [filters, setFilters] = useState<FilterState>({});
  const [search, setSearch] = useState('');

  const filteredRows = useMemo(() => (sheet ? applyFilters(sheet, filters, search) : []), [sheet, filters, search]);
  if (!sheet) {
    return (
      <Card>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Database size={16} /> Sin hojas — colocá el Excel en <code className="px-1 bg-slate-100 rounded">data/raw/</code> y corré <code className="px-1 bg-slate-100 rounded">npm run extract</code>.
        </div>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader
          title="Explorador del Excel"
          subtitle={`${workbookData.sourceFile ?? 'Fuente: fallback'} · ${sheets.length} hojas`}
          right={
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Hoja:</span>
              <Select value={sheet.name} onChange={(e) => { setSheetName(e.target.value); setFilters({}); setSearch(''); }}>
                {sheets.map((s) => <option key={s.name} value={s.name}>{s.name} ({s.rowCount})</option>)}
              </Select>
            </div>
          }
        />
        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-slate-600">
          <Badge tone="brand">{sheet.columns.length} columnas</Badge>
          <Badge tone="neutral">{filteredRows.length.toLocaleString('es')} / {sheet.rowCount.toLocaleString('es')} filas</Badge>
          {sheet.warnings.map((w, i) => (
            <Badge key={i} tone="warn"><AlertTriangle size={11} /> {w}</Badge>
          ))}
        </div>
        <FilterPanel sheet={sheet} filters={filters} setFilters={setFilters} search={search} setSearch={setSearch} />
      </Card>
      <Table columns={sheet.columns} rows={filteredRows} pageSize={20} />
    </div>
  );
}
