/**
 * Excel/CSV parsing logic using xlsx library.
 * Parses file data and extracts headers + rows.
 * Handles duplicate/empty headers, and auto-detects the real header row
 * (skips disclaimer/contact rows at the top of exported files).
 */

import * as XLSX from 'xlsx';

export interface ParseResult {
  headers: string[];
  rows: Record<string, string | number>[];
  totalRows: number;
}

/**
 * 常见的企业数据列名关键词，用于自动识别表头行
 */
const HEADER_KEYWORDS = [
  '企业名称', '公司名称', '名称',
  '经营范围', '业务范围',
  '注册资本', '注册资金',
  '法定代表人', '法人', '联系人',
  '联系电话', '电话', '手机',
  '邮箱', '地址',
  '统一社会信用代码', '组织机构代码',
  '所属行业', '行业分类', '行业',
  '参保人数', '社保人数', '员工人数',
  '所属省份', '所属城市', '所属区县', '所在地区',
  '成立时间', '登记状态', '企业类型',
  '官网', '网址',
  '年营业额', '主营产品',
];

/**
 * 自动检测真正的表头行（跳过声明/联系方式等非数据行）
 * 在前 6 行中寻找包含最多列名关键词的行
 */
function detectHeaderRow(data: any[][]): number {
  const maxCheck = Math.min(6, data.length);
  let bestRow = 0;
  let bestScore = 0;

  for (let r = 0; r < maxCheck; r++) {
    const cells = data[r] as any[];
    if (!cells || cells.length < 2) continue;
    let score = 0;
    for (const cell of cells) {
      const s = String(cell || '').trim();
      if (!s) continue;
      for (const kw of HEADER_KEYWORDS) {
        if (s === kw) { score += 2; break; }
        else if (s.includes(kw) || kw.includes(s)) { score += 1; break; }
      }
    }
    // 超过 3 个匹配即认为是表头
    if (score > bestScore) {
      bestScore = score;
      bestRow = r;
    }
  }

  // 至少需要 3 分才认为是有效表头，否则用第一行
  return bestScore >= 3 ? bestRow : 0;
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

function parseData(data: any[][]): ParseResult {
  if (data.length < 2) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  // 自动识别真正的表头行
  const headerRowIdx = detectHeaderRow(data);

  const rawHeaders = data[headerRowIdx].map((h: any) => String(h || '').trim());
  const headers = deduplicateHeaders(rawHeaders);

  // 数据行 = 表头行之后的行
  const rows: Record<string, string | number>[] = [];
  for (let i = headerRowIdx + 1; i < data.length; i++) {
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

export function parseExcel(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  return parseData(data);
}

export function parseCSV(text: string): ParseResult {
  const workbook = XLSX.read(text, { type: 'string' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  return parseData(data);
}
