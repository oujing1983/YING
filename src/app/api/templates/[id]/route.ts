import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runMigrations } from '@/lib/db-migrate';

let migrated = false;
function ensureMigrated() { if (!migrated) { runMigrations(); migrated = true; } }

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  ensureMigrated();
  const db = getDb();
  const template = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(parseInt(params.id));
  if (!template) return NextResponse.json({ error: '模板不存在' }, { status: 404 });
  return NextResponse.json({ template });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  ensureMigrated();
  const db = getDb();
  const body = await request.json();
  db.prepare(`
    UPDATE email_templates SET name=?, type=?, subject_template=?, body_template=?, category=?, updated_at=datetime('now')
    WHERE id=?
  `).run(body.name, body.type, body.subject_template, body.body_template, body.category, parseInt(params.id));
  const template = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(parseInt(params.id));
  return NextResponse.json({ template });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  ensureMigrated();
  const db = getDb();
  db.prepare('DELETE FROM email_templates WHERE id = ?').run(parseInt(params.id));
  return NextResponse.json({ success: true });
}
