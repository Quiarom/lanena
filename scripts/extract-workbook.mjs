// Extract first .xlsx in data/raw into src/data/generated/workbook-data.json
import * as XLSX from 'xlsx';
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const RAW = join(ROOT, 'data', 'raw');
const OUT_DIR = join(ROOT, 'src', 'data', 'generated');
const OUT = join(OUT_DIR, 'workbook-data.json');

mkdirSync(OUT_DIR, { recursive: true });

function findXlsx() {
  if (!existsSync(RAW)) return null;
  const f = readdirSync(RAW).filter((n) => n.toLowerCase().endsWith('.xlsx') && !n.startsWith('~'));
  return f.length ? join(RAW, f[0]) : null;
}

function normKey(s) {
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'col';
}

function isPercentString(v) {
  return typeof v === 'string' && /^-?\d+([.,]\d+)?\s*%$/.test(v.trim());
}
function isCurrencyString(v) {
  return typeof v === 'string' && /^[\s$usd]*-?[\d.,]+\s*(usd)?$/i.test(v.trim()) && /[$]|usd/i.test(v);
}
function isNumericString(v) {
  if (typeof v !== 'string') return false;
  const s = v.replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.');
  return s !== '' && !isNaN(Number(s)) && /\d/.test(v);
}
function parseNumericString(v) {
  // Handle es-formatted: 1.234.567,89 -> 1234567.89 ; also 1,234.56
  const s = String(v).replace(/[\s$]/g, '').replace(/USD/gi, '');
  if (/^-?\d+([.,]\d+)?\s*%$/.test(s.trim())) {
    return Number(s.replace('%', '').replace(',', '.')) / 100;
  }
  const hasComma = s.includes(','), hasDot = s.includes('.');
  let cleaned = s;
  if (hasComma && hasDot) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) cleaned = s.replace(/\./g, '').replace(',', '.');
    else cleaned = s.replace(/,/g, '');
  } else if (hasComma) {
    const parts = s.split(',');
    if (parts[parts.length - 1].length === 2) cleaned = s.replace(/\./g, '').replace(',', '.');
    else cleaned = s.replace(/,/g, '');
  }
  const n = Number(cleaned);
  return isNaN(n) ? null : n;
}

function detectHeaderRow(rows) {
  // Prefer first all-string row (headers never contain numbers). Fallback to scoring.
  const limit = Math.min(10, rows.length);
  for (let i = 0; i < limit; i++) {
    const r = rows[i] || [];
    const nonEmpty = r.filter((c) => c !== null && c !== '' && c !== undefined);
    if (nonEmpty.length < 2) continue;
    const numbers = nonEmpty.filter((c) => typeof c === 'number' || c instanceof Date).length;
    const strings = nonEmpty.filter((c) => typeof c === 'string' && c.trim().length > 0).length;
    if (numbers === 0 && strings >= Math.max(2, Math.floor(nonEmpty.length * 0.6))) return i;
  }
  let best = 0, bestScore = -1;
  for (let i = 0; i < limit; i++) {
    const r = rows[i] || [];
    const nonEmpty = r.filter((c) => c !== null && c !== '' && c !== undefined).length;
    const strings = r.filter((c) => typeof c === 'string' && c.trim().length > 0).length;
    const score = nonEmpty + strings * 0.5;
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return best;
}

function inferTypes(rows, keys) {
  const stats = {};
  for (const k of keys) stats[k] = { num: 0, pct: 0, cur: 0, date: 0, str: 0, tot: 0, unique: new Set() };
  for (const row of rows) {
    for (const k of keys) {
      const v = row[k];
      if (v === null || v === undefined || v === '') continue;
      stats[k].tot++;
      stats[k].unique.add(v);
      if (typeof v === 'number') stats[k].num++;
      else if (v instanceof Date) stats[k].date++;
      else if (typeof v === 'string') {
        if (isPercentString(v)) stats[k].pct++;
        else if (isCurrencyString(v)) stats[k].cur++;
        else if (isNumericString(v)) stats[k].num++;
        else stats[k].str++;
      }
    }
  }
  const types = {};
  for (const k of keys) {
    const s = stats[k];
    if (s.tot === 0) { types[k] = { type: 'text', uniqueCount: 0 }; continue; }
    const r = (n) => n / s.tot;
    let type = 'text';
    if (r(s.pct) > 0.5) type = 'percent';
    else if (r(s.cur) > 0.5) type = 'currency';
    else if (r(s.date) > 0.5) type = 'date';
    else if (r(s.num) > 0.6) type = 'number';
    // Label-based percent heuristic: cobertura/peso/crecimiento/var/creci with values in [-2, 5]
    if (type === 'number') {
      const lk = k.toLowerCase();
      if (/(^|_)(peso|cobertura|crecimiento|creci|var(_|$)|variacion)/.test(lk) || /^pct_|_pct(_|$)|^porc/.test(lk) || /^var\b/i.test(lk)) {
        let inRange = 0, total = 0;
        for (const v of s.unique) {
          if (typeof v !== 'number') continue;
          total++;
          if (v >= -2 && v <= 5) inRange++;
        }
        if (total > 0 && inRange / total >= 0.8) type = 'percent';
      }
    }
    // Month heuristic
    const lk = k.toLowerCase();
    if (type === 'text' && /(mes|month|periodo|fecha)/.test(lk)) type = 'month';
    if (type === 'text' && /(categoria|tipo|region|estado|cliente|proveedor|laboratorio|sucursal)/.test(lk)) type = 'category';
    types[k] = { type, uniqueCount: s.unique.size };
  }
  return types;
}

function processSheet(wb, sheetName) {
  const ws = wb.Sheets[sheetName];
  if (!ws) return null;
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null, blankrows: false });
  if (!raw.length) return { name: sheetName, rowCount: 0, columns: [], rows: [], warnings: ['Hoja vacía'] };
  const headerIdx = detectHeaderRow(raw);
  const headerRow = (raw[headerIdx] || []).map((v, i) => (v === null || v === '' ? `col_${i}` : String(v).trim()));
  const dataRows = raw.slice(headerIdx + 1);

  // de-dup keys
  const keys = [];
  const seen = new Map();
  const labels = [];
  for (let i = 0; i < headerRow.length; i++) {
    const label = headerRow[i] || `Col ${i + 1}`;
    let k = normKey(label);
    if (seen.has(k)) { const n = seen.get(k) + 1; seen.set(k, n); k = `${k}_${n}`; } else seen.set(k, 1);
    keys.push(k);
    labels.push(label);
  }

  // remove fully empty columns + columns whose header was auto-generated col_N (placeholder, no real label)
  const colHasData = keys.map(() => false);
  for (const r of dataRows) {
    for (let i = 0; i < keys.length; i++) {
      const v = r[i];
      if (v !== null && v !== undefined && v !== '') colHasData[i] = true;
    }
  }
  const labelIsPlaceholder = labels.map((l, i) => l === `Col ${i + 1}` || /^col_?\d+$/i.test(String(l ?? '').trim()));
  const keepIdx = keys.map((_, i) => i).filter((i) => colHasData[i] && !labelIsPlaceholder[i]);
  const fKeys = keepIdx.map((i) => keys[i]);
  const fLabels = keepIdx.map((i) => labels[i]);

  // build row objects, parse strings into numbers when possible
  const rows = [];
  for (const r of dataRows) {
    const nonEmpty = keepIdx.some((i) => r[i] !== null && r[i] !== undefined && r[i] !== '');
    if (!nonEmpty) continue;
    const obj = {};
    for (let j = 0; j < keepIdx.length; j++) {
      const i = keepIdx[j];
      let v = r[i];
      if (v === undefined) v = null;
      if (typeof v === 'string') {
        const tr = v.trim();
        if (isPercentString(tr)) v = parseNumericString(tr);
        else if (isCurrencyString(tr) || isNumericString(tr)) {
          const n = parseNumericString(tr);
          v = n !== null ? n : tr;
        } else v = tr;
      }
      if (v instanceof Date) v = v.toISOString();
      obj[fKeys[j]] = v;
    }
    rows.push(obj);
  }

  const types = inferTypes(rows, fKeys);
  const columns = fKeys.map((k, idx) => {
    const t = types[k];
    const isMeasure = (t.type === 'number' || t.type === 'currency' || t.type === 'percent');
    const isDim = (t.type === 'category' || t.type === 'text' || t.type === 'month' || t.type === 'date');
    const filterable = isDim ? (t.uniqueCount > 1 && t.uniqueCount <= 60) : (isMeasure ? true : false);
    return {
      key: k,
      label: fLabels[idx],
      type: t.type,
      uniqueCount: t.uniqueCount,
      filterable,
      role: isMeasure ? 'measure' : 'dimension',
    };
  });

  const warnings = [];
  if (headerIdx > 0) warnings.push(`Encabezado detectado en fila ${headerIdx + 1}`);
  if (!rows.length) warnings.push('Sin filas de datos tras limpieza');

  return { name: sheetName, rowCount: rows.length, columns, rows, warnings };
}

const MONTH_KEYS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTH_LABELS = { ene: 'Ene', feb: 'Feb', mar: 'Mar', abr: 'Abr', may: 'May', jun: 'Jun', jul: 'Jul', ago: 'Ago', sep: 'Sep', oct: 'Oct', nov: 'Nov', dic: 'Dic' };

function sheetByPattern(sheets, pattern) {
  return sheets.find((s) => pattern.test(s.name.toLowerCase())) || null;
}

function isJunkProviderRow(row) {
  const p = row.proveedor;
  if (p === null || p === undefined || String(p).trim() === '') return true;
  const up = String(p).trim().toUpperCase();
  if (/^(TOTAL|PROVEEDOR|LABORATORIO|EMPRESA)$/.test(up)) return true;
  return false;
}

function isSummaryLabel(value) {
  if (value === null || value === undefined) return true;
  const label = String(value).trim().toUpperCase();
  return (
    label === '' ||
    /^(TOTAL|TOTALES|SUBTOTAL|GRAN TOTAL)$/i.test(label) ||
    /^TOP\s*\d+$/i.test(label) ||
    /^PESO\s/i.test(label)
  );
}

function numeric(row, key) {
  return typeof row[key] === 'number' ? row[key] : null;
}

function normalizeDomains(sheets, sourceFile) {
  const domains = {};

  // --- metadata ---
  const sheet1 = sheetByPattern(sheets, /dist cuota 2026 resultado/i);
  const headerIdx = sheet1
    ? sheet1.rows.findIndex((r) => r.unidades === 'VALORES' && r.mes === 'MES')
    : -1;
  const unitRows  = sheet1 ? (headerIdx >= 0 ? sheet1.rows.slice(0, headerIdx) : sheet1.rows) : [];
  const valueRows = sheet1 ? (headerIdx >= 0 ? sheet1.rows.slice(headerIdx + 1) : []) : [];

  // Detect last closed month
  const closedValueRows = valueRows.filter(
    (r) => typeof r.mes === 'string' && MONTH_KEYS.includes(r.mes) && typeof r.ano_2026 === 'number' && r.ano_2026 > 0,
  );
  const lastClosed = closedValueRows.length ? closedValueRows[closedValueRows.length - 1] : null;
  const closedMonth = lastClosed ? String(lastClosed.mes) : '';
  const closedMonthIndex = closedMonth ? MONTH_KEYS.indexOf(closedMonth) : -1;
  const periodLabel = closedMonth ? `${MONTH_LABELS[closedMonth] ?? closedMonth} 2026` : '';

  domains.metadata = {
    sourceFile: sourceFile || null,
    generatedAt: new Date().toISOString(),
    periodLabel,
    closedMonth,
    closedMonthIndex,
    currentYear: 2026,
    previousYear: 2025,
  };

  if (!sheet1) {
    console.warn('[domains] WARNING: Sheet 1 (DIST CUOTA 2026 RESULTADO) not found');
  }

  // --- national ---
  const buildMonthlyRow = (rows) =>
    MONTH_KEYS.map((mes) => {
      const r = rows.find((x) => x.mes === mes);
      const y2026 = r ? (typeof r.ano_2026 === 'number' ? r.ano_2026 : null) : null;
      const y2025 = r ? (typeof r.ano_2025 === 'number' ? r.ano_2025 : null) : null;
      const isClosed = y2026 !== null && y2026 > 0;
      const growthPct = isClosed && y2025 && y2025 !== 0
        ? (y2026 - y2025) / y2025
        : null;
      if (isClosed && growthPct === -1) {
        console.warn(`[domains] WARNING: growthPct === -1 on month ${mes} — possible bug`);
      }
      return {
        mes,
        y2025: y2025 ?? 0,
        y2026: y2026 ?? 0,
        growthPct,
        quota: r ? (typeof r.cuota_2026 === 'number' ? r.cuota_2026 : 0) : 0,
        coverage: r ? (typeof r.cobertura === 'number' ? r.cobertura : 0) : 0,
        status: isClosed ? 'closed' : 'pending',
      };
    });

  const vAccum = valueRows.find((r) => typeof r.mes === 'string' && String(r.mes).startsWith('Acum'));
  const uAccum = unitRows.find((r) => typeof r.mes === 'string' && String(r.mes).startsWith('Acum'));

  domains.national = {
    monthly: buildMonthlyRow(valueRows),
    monthlyUnits: buildMonthlyRow(unitRows),
    accumulated: {
      y2025: vAccum && typeof vAccum.ano_2025 === 'number' ? vAccum.ano_2025 : 0,
      y2026: vAccum && typeof vAccum.ano_2026 === 'number' ? vAccum.ano_2026 : 0,
      growthPct: vAccum && typeof vAccum.crecimiento === 'number' ? vAccum.crecimiento : null,
    },
    accumulatedUnits: {
      y2025: uAccum && typeof uAccum.ano_2025 === 'number' ? uAccum.ano_2025 : 0,
      y2026: uAccum && typeof uAccum.ano_2026 === 'number' ? uAccum.ano_2026 : 0,
      growthPct: uAccum && typeof uAccum.crecimiento === 'number' ? uAccum.crecimiento : null,
    },
  };

  // --- regions (Sheet 2) ---
  const sheet2 = sheetByPattern(sheets, /\b2\b.*region|region.*\b2\b/i) ||
    sheets.find((s) => /region/i.test(s.name));
  if (!sheet2) {
    console.warn('[domains] WARNING: Sheet 2 (regions) not found');
  } else {
    const CHANNEL_LABELS = /^(CADENA|INDEPENDIENTE|GRUPO|CANAL|TOTAL|TIPO_CLIENTE)$/i;
    domains.regions = {
      rows: sheet2.rows
        .filter((r) => {
          const k = String(r.region ?? r.col ?? '').trim().toUpperCase();
          return k !== '' && !CHANNEL_LABELS.test(k) && !/^TOTAL/i.test(k);
        })
        .sort((a, b) => (numeric(b, 'ventas_ano_actual') ?? 0) - (numeric(a, 'ventas_ano_actual') ?? 0)),
    };
    const totalRows = domains.regions.rows.filter((r) => /^TOTAL/i.test(String(r.region ?? '')));
    if (totalRows.length > 0) console.warn(`[domains] WARNING: ${totalRows.length} Total rows found in regions`);
  }

  // --- states (Sheet 3) ---
  const sheet3 = sheetByPattern(sheets, /\b3\b.*estado|estado.*\b3\b/i) ||
    sheets.find((s) => /estado/i.test(s.name));
  if (!sheet3) {
    console.warn('[domains] WARNING: Sheet 3 (states) not found');
  } else {
    domains.states = {
      rows: sheet3.rows
        .filter((r) => {
          const k = String(r.estado ?? r.col ?? '').trim().toUpperCase();
          return k !== '' && !/^TOTAL/i.test(k);
        })
        .sort((a, b) => (numeric(b, 'ventas_ano_actual') ?? 0) - (numeric(a, 'ventas_ano_actual') ?? 0)),
    };
  }

  // --- providers (Sheet 4) ---
  const sheet4 = sheetByPattern(sheets, /\b4\b.*proveedor|proveedor.*\b4\b/i) ||
    sheets.find((s) => /proveedor|laboratorio/i.test(s.name));
  if (!sheet4) {
    console.warn('[domains] WARNING: Sheet 4 (providers) not found');
  } else {
    const seen = new Map();
    const byValue = [];
    const byUnits = [];
    for (const row of sheet4.rows) {
      // Left block (values)
      if (!isJunkProviderRow(row)) {
        const name = String(row.proveedor).trim().toLowerCase();
        const val = row.ventas_ano_actual ?? row.val_2026 ?? null;
        const dupKey = `${name}::${val}`;
        if (!seen.has(dupKey)) {
          seen.set(dupKey, true);
          byValue.push(row);
        }
      }
      // Right block (_2 suffix columns → strip suffix)
      const hasRightBlock = Object.keys(row).some((k) => k.endsWith('_2'));
      if (hasRightBlock) {
        const rightRow = {};
        for (const [k, v] of Object.entries(row)) {
          if (k.endsWith('_2')) rightRow[k.slice(0, -2)] = v;
        }
        if (!isJunkProviderRow(rightRow)) {
          byUnits.push(rightRow);
        }
      }
    }
    const dedupCount = sheet4.rows.length - byValue.length;
    if (dedupCount > 0) console.warn(`[domains] Provider dedup: removed ${dedupCount} duplicate rows`);
    domains.providers = { byValue, byUnits };
  }

  // --- categories (Sheet 5) ---
  const sheet5 = sheetByPattern(sheets, /\b5\b.*categor|categor.*\b5\b/i) ||
    sheets.find((s) => /categor|tipo|linea/i.test(s.name));
  if (!sheet5) {
    console.warn('[domains] WARNING: Sheet 5 (categories) not found');
  } else {
    const splitIdx = sheet5.rows.findIndex((r) => String(r.categorias ?? '').trim().toUpperCase() === 'TIPO');
    const cleanCategoryRows = (rows) => rows.filter((r) => {
      const k = String(r.categorias ?? '').trim();
      return k !== '' && !isSummaryLabel(k) && k.toUpperCase() !== 'TIPO';
    });
    domains.categories = {
      byProductType: cleanCategoryRows(splitIdx >= 0 ? sheet5.rows.slice(0, splitIdx) : sheet5.rows),
      byCommercialLine: cleanCategoryRows(splitIdx >= 0 ? sheet5.rows.slice(splitIdx + 1) : []),
    };
  }

  // --- clients (Sheet 6) ---
  const sheet6 = sheetByPattern(sheets, /\b6\b.*cliente|cliente.*\b6\b/i) ||
    sheets.find((s) => /cliente/i.test(s.name));
  if (!sheet6) {
    console.warn('[domains] WARNING: Sheet 6 (clients) not found');
  } else {
    const individual = [];
    const groups = [];
    for (const row of sheet6.rows) {
      const clientName = String(row.cliente ?? '').trim();
      const groupName = String(row.grupo_cliente ?? '').trim();
      if (clientName && !isSummaryLabel(clientName) && numeric(row, 'val_2026') !== null) {
        individual.push({
          pos:      row.pos ?? row.posicion ?? null,
          codcli:   row.codcli ?? null,
          cliente:  clientName,
          val_2025: numeric(row, 'val_2025') ?? numeric(row, 'ano_2025'),
          val_2026: numeric(row, 'val_2026') ?? numeric(row, 'ano_2026'),
          creci_vs_ano_anterior: row.creci_vs_ano_anterior ?? row.crecimiento ?? null,
        });
      }
      if (groupName && !isSummaryLabel(groupName) && numeric(row, 'val_2026_2') !== null) {
        groups.push({
          pos:      row.pos_2 ?? null,
          name:     groupName,
          val_2025: numeric(row, 'val_2025_2'),
          val_2026: numeric(row, 'val_2026_2'),
          creci_vs_ano_anterior: numeric(row, 'creci_vs_ano_anterior_2'),
        });
      }
    }
    domains.clients = {
      individual: individual.sort((a, b) => (b.creci_vs_ano_anterior ?? -Infinity) - (a.creci_vs_ano_anterior ?? -Infinity)),
      groups: groups.sort((a, b) => (b.val_2026 ?? 0) - (a.val_2026 ?? 0)),
    };
  }

  // --- accounts receivable (Sheet 7) ---
  const sheet7 = sheetByPattern(sheets, /\b7\b.*cxc|cxc.*\b7\b/i) ||
    sheets.find((s) => /cxc|cuentas.*cobrar/i.test(s.name));
  if (!sheet7) {
    console.warn('[domains] WARNING: Sheet 7 (CxC) not found');
  } else {
    const totalRow = sheet7.rows.find((r) => String(r.dias_antiguedad ?? '').toUpperCase() === 'TOTAL');
    const detailRows = sheet7.rows.filter((r) => {
      const k = String(r.dias_antiguedad ?? r.cliente ?? '').trim().toUpperCase();
      if (isSummaryLabel(k)) return false;
      return true;
    });
    const top10Row = sheet7.rows.find((r) => /^TOP\s*10$/i.test(String(r.dias_antiguedad ?? '').trim()));
    const pesoTopRow = sheet7.rows.find((r) => /^PESO\s*TOP/i.test(String(r.dias_antiguedad ?? '').trim()));
    const totalInDetail = detailRows.filter((r) => /^TOTAL/i.test(String(r.dias_antiguedad ?? '')));
    if (totalInDetail.length > 0) console.warn(`[domains] WARNING: ${totalInDetail.length} Total rows in CxC detail`);
    domains.accountsReceivable = {
      byClient: detailRows,
      summary: {
        total: totalRow && typeof totalRow.total === 'number' ? totalRow.total : 0,
        peso:  totalRow && typeof totalRow.peso  === 'number' ? totalRow.peso  : 0,
        top10: top10Row && typeof top10Row.total === 'number' ? top10Row.total : null,
        pesoTop10: pesoTopRow && typeof pesoTopRow.total === 'number' ? pesoTopRow.total : null,
      },
    };
  }

  return domains;
}

function main() {
  const xlsxPath = findXlsx();
  const out = { generatedAt: new Date().toISOString(), sourceFile: null, sheets: [], globalWarnings: [], hasRealData: false };

  if (!xlsxPath) {
    out.globalWarnings.push('No se encontró archivo .xlsx en data/raw — el dashboard usará datos fallback del PDF.');
    writeFileSync(OUT, JSON.stringify(out, null, 2));
    console.log('[extract] sin xlsx → fallback sólo');
    return;
  }

  out.sourceFile = xlsxPath.split('/').pop();
  const buf = readFileSync(xlsxPath);
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: true });
  for (const name of wb.SheetNames) {
    try {
      const s = processSheet(wb, name);
      if (s) out.sheets.push(s);
    } catch (e) {
      out.globalWarnings.push(`Error en hoja "${name}": ${e.message}`);
    }
  }
  out.hasRealData = out.sheets.some((s) => s.rowCount > 0);
  out.domains = normalizeDomains(out.sheets, out.sourceFile);
  writeFileSync(OUT, JSON.stringify(out));
  console.log(`[extract] ${out.sheets.length} hojas → ${OUT}`);
}

main();
