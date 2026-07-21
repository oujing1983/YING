import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runMigrations } from '@/lib/db-migrate';

export const dynamic = 'force-dynamic';

let migrated = false;
function ensureMigrated() { if (!migrated) { runMigrations(); migrated = true; } }

export async function GET(request: NextRequest) {
  ensureMigrated();
  const db = getDb();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || '';

  let where = 'WHERE 1=1';
  const params: any[] = [];
  if (search) {
    where += ' AND (l.subject LIKE ? OR l.body LIKE ? OR e.name LIKE ?)';
    const q = `%${search}%`;
    params.push(q, q, q);
  }
  if (type) {
    where += ' AND l.letter_type = ?';
    params.push(type);
  }

  // 一次查询获取所有开发信及企业名称
  const letters = db.prepare(`
    SELECT l.*, e.name as enterprise_name, e.contact_email as enterprise_email
    FROM outreach_letters l
    LEFT JOIN enterprises e ON l.enterprise_id = e.id
    ${where}
    ORDER BY l.created_at DESC
    LIMIT 500
  `).all(...params);

  return NextResponse.json({ letters });
}
