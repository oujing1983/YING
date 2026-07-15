/**
 * Excel/CSV parsing logic using xlsx library.
 * Parses file data and extracts headers + rows.
 */

import * as XLSX from 'xlsx';

export interface ParseResult {
  headers: string[];
  rows: Record<string, string | number>[];
  totalRows: number;
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

  // First row as headers
  const headers = (data[0] as any[]).map((h) => String(h || '').trim());

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

  const headers = (data[0] as any[]).map((h) => String(h || '').trim());
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
