import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runMigrations } from '@/lib/db-migrate';

export const dynamic = 'force-dynamic';

let migrated = false;
function ensureMigrated() { if (!migrated) { runMigrations(); migrated = true; } }

export async function GET() {
  ensureMigrated();
  const db = getDb();
  const templates = db.prepare('SELECT * FROM email_templates ORDER BY created_at DESC').all();
  return NextResponse.json({ templates });
}

export async function POST(request: NextRequest) {
  ensureMigrated();
  const db = getDb();
  const body = await request.json();

  const stmt = db.prepare(`
    INSERT INTO email_templates (name, type, subject_template, body_template, category)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    body.name, body.type || 'email',
    body.subject_template || '', body.body_template || '',
    body.category || 'general'
  );

  const template = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json({ template }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  ensureMigrated();
  const db = getDb();
  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: '缺少模板ID' }, { status: 400 });
  }

  db.prepare(`
    UPDATE email_templates SET
      name = ?, type = ?, subject_template = ?, body_template = ?, category = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    body.name, body.type || 'email',
    body.subject_template || '', body.body_template || '',
    body.category || 'general',
    body.id
  );

  return NextResponse.json({ success: true });
}
