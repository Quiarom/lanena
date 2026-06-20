import workbook from '@/data/generated/workbook-data.json';
import type { ColType } from './format';

export interface ColumnSpec {
  key: string;
  label: string;
  type: ColType;
  uniqueCount: number;
  filterable: boolean;
  role: 'measure' | 'dimension';
}
export interface SheetData {
  name: string;
  rowCount: number;
  columns: ColumnSpec[];
  rows: Record<string, unknown>[];
  warnings: string[];
}
export interface WorkbookData {
  generatedAt: string;
  sourceFile: string | null;
  sheets: SheetData[];
  globalWarnings: string[];
  hasRealData: boolean;
  summary?: {
    totalSheets: number;
    totalRows: number;
    totalColumns: number;
    sheetNames: string[];
    columnTypeCounts: Record<string, number>;
    candidates: Record<string, string[]>;
  };
}

export type SetFilter = { kind: 'set'; values: Set<string> };
export type RangeFilter = { kind: 'range'; min: number | null; max: number | null };
export type FilterState = Record<string, SetFilter | RangeFilter | null>;

export const workbookData = workbook as unknown as WorkbookData;

export function findSheet(re: RegExp): SheetData | null {
  return workbookData.sheets.find((s) => re.test(s.name.toLowerCase())) || null;
}
export function findColumn(sheet: SheetData, re: RegExp): ColumnSpec | null {
  return sheet.columns.find((c) => re.test(c.label.toLowerCase()) || re.test(c.key)) || null;
}
export function measures(sheet: SheetData) { return sheet.columns.filter((c) => c.role === 'measure'); }
export function dimensions(sheet: SheetData) { return sheet.columns.filter((c) => c.role === 'dimension'); }
