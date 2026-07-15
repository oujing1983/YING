import { NextRequest, NextResponse } from 'next/server';
import { parseExcel, parseCSV } from '@/lib/import/parser';
import { detectColumns } from '@/lib/import/column-detector';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '请上传文件' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const fileName = file.name.toLowerCase();

    let parseResult;
    if (fileName.endsWith('.csv')) {
      const text = new TextDecoder().decode(buffer);
      parseResult = parseCSV(text);
    } else {
      parseResult = parseExcel(buffer);
    }

    if (parseResult.headers.length === 0) {
      return NextResponse.json({ error: '文件为空或无法解析' }, { status: 400 });
    }

    // Detect columns
    const columnDetection = detectColumns(parseResult.headers);

    // Generate preview (first 10 rows)
    const previewRows = parseResult.rows.slice(0, 10);

    return NextResponse.json({
      fileName: file.name,
      headers: parseResult.headers,
      totalRows: parseResult.totalRows,
      columnDetection,
      previewRows,
    });
  } catch (error: any) {
    return NextResponse.json({ error: `文件解析失败: ${error.message}` }, { status: 500 });
  }
}
