import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runMigrations } from '@/lib/db-migrate';
import { scoreEnterprise } from '@/lib/scoring';
import type { EnterpriseUpdate } from '@/types';

let migrated = false;
function ensureMigrated() {
  if (!migrated) {
    runMigrations();
    migrated = true;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  ensureMigrated();
  const db = getDb();
  const id = parseInt(params.id);

  const enterprise = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(id);
  if (!enterprise) {
    return NextResponse.json({ error: '企业不存在' }, { status: 404 });
  }

  const analyses = db.prepare('SELECT * FROM ai_analyses WHERE enterprise_id = ?').get(id) || null;
  const letters = db.prepare(
    'SELECT * FROM outreach_letters WHERE enterprise_id = ? ORDER BY created_at DESC'
  ).all(id);
  const followUps = db.prepare(
    'SELECT * FROM follow_up_records WHERE enterprise_id = ? ORDER BY created_at DESC'
  ).all(id);

  return NextResponse.json({ enterprise, analyses, letters, followUps });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  ensureMigrated();
  const db = getDb();
  const id = parseInt(params.id);

  const existing = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(id);
  if (!existing) {
    return NextResponse.json({ error: '企业不存在' }, { status: 404 });
  }

  const body: EnterpriseUpdate = await request.json();

  // If core fields changed, re-score
  let score = (existing as any).score;
  let scoreLevel = (existing as any).score_level;
  let scoreReason = (existing as any).score_reason;
  let scoreDimensions = (existing as any).score_dimensions;

  const needsRescore =
    body.business_scope !== undefined ||
    body.industry_category !== undefined ||
    body.region !== undefined ||
    body.is_export !== undefined ||
    body.is_ecommerce !== undefined ||
    body.has_1688 !== undefined ||
    body.employee_count !== undefined;

  if (needsRescore) {
    const merged = { ...existing, ...body };
    const result = scoreEnterprise(merged);
    score = result.score;
    scoreLevel = result.level;
    scoreReason = result.reason;
    scoreDimensions = JSON.stringify(result.dimensions);
  }

  const stmt = db.prepare(`
    UPDATE enterprises SET
      name = ?, business_scope = ?, registered_capital = ?, social_security_count = ?,
      region = ?, industry_category = ?, industry_subcategory = ?, contact_phone = ?,
      contact_email = ?, address = ?, website = ?, is_export = ?, is_ecommerce = ?,
      has_1688 = ?, has_taobao = ?, has_jd = ?, has_pdd = ?, employee_count = ?,
      annual_revenue = ?, main_products = ?, status = ?, contact_person = ?,
      contact_position = ?, latitude = ?, longitude = ?, distance_km = ?,
      source = ?, external_id = ?, extra_data = ?,
      score = ?, score_level = ?, score_reason = ?, score_dimensions = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `);

  stmt.run(
    body.name ?? (existing as any).name,
    body.business_scope ?? (existing as any).business_scope,
    body.registered_capital ?? (existing as any).registered_capital,
    body.social_security_count ?? (existing as any).social_security_count,
    body.region ?? (existing as any).region,
    body.industry_category ?? (existing as any).industry_category,
    body.industry_subcategory ?? (existing as any).industry_subcategory,
    body.contact_phone ?? (existing as any).contact_phone,
    body.contact_email ?? (existing as any).contact_email,
    body.address ?? (existing as any).address,
    body.website ?? (existing as any).website,
    body.is_export !== undefined ? (body.is_export ? 1 : 0) : (existing as any).is_export,
    body.is_ecommerce !== undefined ? (body.is_ecommerce ? 1 : 0) : (existing as any).is_ecommerce,
    body.has_1688 !== undefined ? (body.has_1688 ? 1 : 0) : (existing as any).has_1688,
    body.has_taobao !== undefined ? (body.has_taobao ? 1 : 0) : (existing as any).has_taobao,
    body.has_jd !== undefined ? (body.has_jd ? 1 : 0) : (existing as any).has_jd,
    body.has_pdd !== undefined ? (body.has_pdd ? 1 : 0) : (existing as any).has_pdd,
    body.employee_count ?? (existing as any).employee_count,
    body.annual_revenue ?? (existing as any).annual_revenue,
    body.main_products ?? (existing as any).main_products,
    body.status ?? (existing as any).status,
    body.contact_person ?? (existing as any).contact_person,
    body.contact_position ?? (existing as any).contact_position,
    body.latitude ?? (existing as any).latitude,
    body.longitude ?? (existing as any).longitude,
    body.distance_km ?? (existing as any).distance_km,
    body.source ?? (existing as any).source,
    body.external_id ?? (existing as any).external_id,
    body.extra_data ?? (existing as any).extra_data,
    score,
    scoreLevel,
    scoreReason,
    scoreDimensions,
    id
  );

  const updated = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(id);
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  ensureMigrated();
  const db = getDb();
  const id = parseInt(params.id);

  const existing = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(id);
  if (!existing) {
    return NextResponse.json({ error: '企业不存在' }, { status: 404 });
  }

  db.prepare('DELETE FROM enterprises WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
