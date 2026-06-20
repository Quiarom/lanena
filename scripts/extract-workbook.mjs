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
  writeFileSync(OUT, JSON.stringify(out));
  console.log(`[extract] ${out.sheets.length} hojas → ${OUT}`);
}

main();
