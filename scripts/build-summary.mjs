import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const IN = join(ROOT, 'src', 'data', 'generated', 'workbook-data.json');

const data = JSON.parse(readFileSync(IN, 'utf8'));
const sheets = data.sheets || [];

function matchSheets(re) {
  return sheets.filter((s) => re.test(s.name.toLowerCase())).map((s) => s.name);
}

const summary = {
  generatedAt: data.generatedAt,
  totalSheets: sheets.length,
  totalRows: sheets.reduce((a, s) => a + s.rowCount, 0),
  totalColumns: sheets.reduce((a, s) => a + (s.columns?.length || 0), 0),
  sheetNames: sheets.map((s) => s.name),
  columnTypeCounts: {},
  candidates: {
    ventas: matchSheets(/venta|cierre|cuota|mes/i),
    cobranza: matchSheets(/cxc|cuenta.*cobr|cobranza|antig|cartera|pagar|cxp/i),
    visitas: matchSheets(/visita/i),
    proveedores: matchSheets(/proveedor|laboratorio/i),
    regiones: matchSheets(/region|estado|sucursal|zona/i),
    clientes: matchSheets(/cliente/i),
    categorias: matchSheets(/categor|tipo|familia|linea/i),
  },
};

for (const s of sheets) for (const c of s.columns || []) {
  summary.columnTypeCounts[c.type] = (summary.columnTypeCounts[c.type] || 0) + 1;
}

data.summary = summary;
writeFileSync(IN, JSON.stringify(data));
writeFileSync(join(ROOT, 'src', 'data', 'generated', 'summary.json'), JSON.stringify(summary, null, 2));
console.log('[summary]', summary.totalSheets, 'sheets,', summary.totalRows, 'rows');
