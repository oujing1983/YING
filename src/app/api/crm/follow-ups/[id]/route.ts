import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runMigrations } from '@/lib/db-migrate';

let migrated = false;
function ensureMigrated() { if (!migrated) { runMigrations(); migrated = true; } }

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  ensureMigrated();
  const db = getDb();
  const id = parseInt(params.id);
  const body = await request.json();

  db.prepare(`
    UPDATE follow_up_records SET
      contact_type = ?, summary = ?, next_action = ?, next_action_date = ?,
      is_completed = ?, completed_at = ?
    WHERE id = ?
  `).run(
    body.contact_type, body.summary || '', body.next_action || '',
    body.next_action_date || null,
    body.is_completed ? 1 : 0,
    body.is_completed ? new Date().toISOString() : null,
    id
  );

  const record = db.prepare('SELECT * FROM follow_up_records WHERE id = ?').get(id);
  return NextResponse.json({ record });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  ensureMigrated();
  const db = getDb();
  db.prepare('DELETE FROM follow_up_records WHERE id = ?').run(parseInt(params.id));
  return NextResponse.json({ success: true });
}
