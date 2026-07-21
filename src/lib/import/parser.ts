/**
 * Excel/CSV parsing logic using xlsx library.
 * Parses file data and extracts headers + rows.
 * Handles duplicate/empty headers by making them unique.
 */

import * as XLSX from 'xlsx';

export interface ParseResult {
  headers: string[];
  rows: Record<string, string | number>[];
  totalRows: number;
}

/**
 * 确保列名唯一：空列名自动填充为"列N"，重复列名追加序号
 */
function deduplicateHeaders(rawHeaders: string[]): string[] {
  const seen = new Map<string, number>();
  return rawHeaders.map((h, i) => {
    let name = (h || '').trim();
    if (!name) name = `列${i + 1}`;
    const count = seen.get(name) || 0;
    seen.set(name, count + 1);
    return count > 0 ? `${name} (${count + 1})` : name;
  });
}

export function parseExcel(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert to array of arrays
  const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (data.length < 2) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  // First row as headers (去重处理)
  const rawHeaders = (data[0] as any[]).map((h) => String(h || '').trim());
  const headers = deduplicateHeaders(rawHeaders);

  // Remaining rows as data
  const rows: Record<string, string | number>[] = [];
  for (let i = 1; i < data.length; i++) {
    const row: Record<string, string | number> = {};
    headers.forEach((header, idx) => {
      const val = data[i][idx];
      row[header] = val !== undefined && val !== null ? val : '';
    });

    // Skip completely empty rows
    if (Object.values(row).some((v) => v !== '' && v !== 0)) {
      rows.push(row);
    }
  }

  return { headers, rows, totalRows: rows.length };
}

export function parseCSV(text: string): ParseResult {
  const workbook = XLSX.read(text, { type: 'string' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (data.length < 2) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  const rawHeaders = (data[0] as any[]).map((h) => String(h || '').trim());
  const headers = deduplicateHeaders(rawHeaders);
  const rows: Record<string, string | number>[] = [];

  for (let i = 1; i < data.length; i++) {
    const row: Record<string, string | number> = {};
    headers.forEach((header, idx) => {
      const val = data[i][idx];
      row[header] = val !== undefined && val !== null ? val : '';
    });
    if (Object.values(row).some((v) => v !== '' && v !== 0)) {
      rows.push(row);
    }
  }

  return { headers, rows, totalRows: rows.length };
}
