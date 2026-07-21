import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runMigrations } from '@/lib/db-migrate';
import { scoreEnterprise } from '@/lib/scoring';

let migrated = false;
function ensureMigrated() {
  if (!migrated) { runMigrations(); migrated = true; }
}

export async function POST(request: NextRequest) {
  ensureMigrated();
  const db = getDb();

  try {
    const { rows, headers, columnMapping, fileName } = await request.json();

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: '没有可导入的数据' }, { status: 400 });
    }

    if (!columnMapping || typeof columnMapping !== 'object') {
      return NextResponse.json({ error: '请提供列映射' }, { status: 400 });
    }

    // Create import log
    const logStmt = db.prepare(`
      INSERT INTO import_logs (file_name, total_rows, status, column_mapping)
      VALUES (?, ?, 'processing', ?)
    `);
    const logResult = logStmt.run(fileName || 'unknown', rows.length, JSON.stringify(columnMapping));
    const batchId = logResult.lastInsertRowid as number;

    const insertStmt = db.prepare(`
      INSERT INTO enterprises (
        name, business_scope, registered_capital, social_security_count,
        region, industry_category, industry_subcategory, contact_phone,
        contact_email, address, website, is_export, is_ecommerce,
        has_1688, has_taobao, has_jd, has_pdd, employee_count,
        annual_revenue, main_products, contact_person, contact_position,
        source, import_batch_id,
        score, score_level, score_reason, score_dimensions
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        'excel_import', ?,
        ?, ?, ?, ?
      )
    `);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of rows) {
      // Apply column mapping (index-based, uses headers array to resolve column name)
      const mapped: Record<string, any> = {};
      const regionParts: string[] = [];
      for (const [indexStr, targetField] of Object.entries(columnMapping)) {
        if (targetField && typeof targetField === 'string') {
          const index = parseInt(indexStr, 10);
          const sourceColumn = headers ? headers[index] : indexStr;
          if (sourceColumn !== undefined && sourceColumn !== null) {
            const val = row[sourceColumn];
            if (val === undefined || val === null || String(val).trim() === '') continue;
            const strVal = String(val).trim();
            if (targetField === 'region') {
              regionParts.push(strVal);
            } else {
              // 优先使用第一个非空值，避免"往年年报电话"覆盖"年报电话"
              if (!mapped[targetField]) {
                mapped[targetField] = strVal;
              }
            }
          }
        }
      }
      // 合并地址列（省份+城市+区县）
      if (regionParts.length > 0) {
        mapped.region = Array.from(new Set(regionParts)).join('');
      }

      // Skip if no name
      if (!mapped.name || String(mapped.name).trim() === '') {
        skipped++;
        continue;
      }

      // Score the enterprise
      const scoreResult = scoreEnterprise(mapped);

      // Parse numbers
      const socialCount = parseInt(mapped.social_security_count) || 0;
      const empCount = parseInt(mapped.employee_count) || 0;
      const isExport = mapBool(mapped.is_export);
      const isEcommerce = mapBool(mapped.is_ecommerce);

      try {
        insertStmt.run(
          String(mapped.name || '').trim(),
          String(mapped.business_scope || ''),
          String(mapped.registered_capital || ''),
          socialCount,
          String(mapped.region || ''),
          String(mapped.industry_category || ''),
          String(mapped.industry_subcategory || ''),
          String(mapped.contact_phone || ''),
          String(mapped.contact_email || ''),
          String(mapped.address || ''),
          String(mapped.website || ''),
          isExport ? 1 : 0,
          isEcommerce ? 1 : 0,
          0, 0, 0, 0,
          empCount,
          String(mapped.annual_revenue || ''),
          String(mapped.main_products || ''),
          String(mapped.contact_person || ''),
          String(mapped.contact_position || ''),
          batchId,
          scoreResult.score,
          scoreResult.level,
          scoreResult.reason,
          JSON.stringify(scoreResult.dimensions)
        );
        imported++;
      } catch {
        errors++;
      }
    }

    // Update import log
    db.prepare(`
      UPDATE import_logs SET
        imported_rows = ?, skipped_rows = ?, error_rows = ?, status = 'completed'
      WHERE id = ?
    `).run(imported, skipped, errors, batchId);

    return NextResponse.json({
      success: true,
      batchId,
      imported,
      skipped,
      errors,
      total: rows.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: `导入失败: ${error.message}` }, { status: 500 });
  }
}

function mapBool(val: any): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim();
    return ['是', 'yes', 'true', '1', 'y', '√', '✓'].includes(lower);
  }
  return false;
}
