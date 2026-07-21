import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runMigrations } from '@/lib/db-migrate';
import { scoreEnterprise } from '@/lib/scoring';
import type { EnterpriseCreate, EnterpriseListResponse } from '@/types';

// Ensure DB is migrated
let migrated = false;
function ensureMigrated() {
  if (!migrated) {
    runMigrations();
    migrated = true;
  }
}

export async function GET(request: NextRequest) {
  ensureMigrated();
  const db = getDb();
  const { searchParams } = new URL(request.url);

  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('page_size') || '20')));
  const search = searchParams.get('search') || '';
  const industry = searchParams.get('industry') || '';
  const scoreLevel = searchParams.get('score_level') || '';
  const status = searchParams.get('status') || '';
  const region = searchParams.get('region') || '';
  const sortBy = searchParams.get('sort_by') || 'created_at';
  const sortOrder = searchParams.get('sort_order') || 'desc';

  // Allowed sort columns
  const allowedSort = ['created_at', 'name', 'score', 'region', 'status'];
  const orderBy = allowedSort.includes(sortBy) ? sortBy : 'created_at';
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

  let where = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (search) {
    where += ' AND (name LIKE ? OR business_scope LIKE ? OR industry_category LIKE ? OR main_products LIKE ?)';
    const q = `%${search}%`;
    params.push(q, q, q, q);
  }
  if (industry) {
    where += ' AND industry_category LIKE ?';
    params.push(`%${industry}%`);
  }
  if (scoreLevel) {
    where += ' AND score_level = ?';
    params.push(scoreLevel);
  }
  if (status) {
    where += ' AND status = ?';
    params.push(status);
  }
  if (region) {
    where += ' AND region LIKE ?';
    params.push(`%${region}%`);
  }

  const countRow = db.prepare(`SELECT COUNT(*) as c FROM enterprises ${where}`).get(...params) as { c: number };
  const total = countRow.c;

  const offset = (page - 1) * pageSize;
  const rows = db.prepare(
    `SELECT * FROM enterprises ${where} ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`
  ).all(...params, pageSize, offset);

  const response: EnterpriseListResponse = {
    enterprises: rows as any[],
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize),
  };

  return NextResponse.json(response);
}

export async function POST(request: NextRequest) {
  ensureMigrated();
  const db = getDb();

  const body: EnterpriseCreate = await request.json();

  // Rule-based scoring on create
  const scoring = scoreEnterprise(body);

  const stmt = db.prepare(`
    INSERT INTO enterprises (
      name, business_scope, registered_capital, social_security_count,
      region, industry_category, industry_subcategory, contact_phone,
      contact_email, address, website, is_export, is_ecommerce,
      has_1688, has_taobao, has_jd, has_pdd, employee_count,
      annual_revenue, main_products, contact_person, contact_position,
      latitude, longitude, distance_km, source, external_id, extra_data,
      score, score_level, score_reason, score_dimensions
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?
    )
  `);

  const result = stmt.run(
    body.name || '',
    body.business_scope || '',
    body.registered_capital || '',
    body.social_security_count || 0,
    body.region || '',
    body.industry_category || '',
    body.industry_subcategory || '',
    body.contact_phone || '',
    body.contact_email || '',
    body.address || '',
    body.website || '',
    body.is_export ? 1 : 0,
    body.is_ecommerce ? 1 : 0,
    body.has_1688 ? 1 : 0,
    body.has_taobao ? 1 : 0,
    body.has_jd ? 1 : 0,
    body.has_pdd ? 1 : 0,
    body.employee_count || 0,
    body.annual_revenue || '',
    body.main_products || '',
    body.contact_person || '',
    body.contact_position || '',
    body.latitude || 0,
    body.longitude || 0,
    body.distance_km || 0,
    body.source || 'manual',
    body.external_id || '',
    body.extra_data || '{}',
    scoring.score,
    scoring.level,
    scoring.reason,
    JSON.stringify(scoring.dimensions)
  );

  const newRow = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(newRow, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  ensureMigrated();
  const db = getDb();

  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '请提供要删除的企业 ID 列表' }, { status: 400 });
    }

    // 使用参数化查询批量删除
    const placeholders = ids.map(() => '?').join(',');
    const result = db.prepare(
      `DELETE FROM enterprises WHERE id IN (${placeholders})`
    ).run(...ids);

    return NextResponse.json({
      success: true,
      deleted: result.changes,
    });
  } catch (error: any) {
    return NextResponse.json({ error: `批量删除失败: ${error.message}` }, { status: 500 });
  }
}
