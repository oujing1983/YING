import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runMigrations } from '@/lib/db-migrate';

let migrated = false;
function ensureMigrated() { if (!migrated) { runMigrations(); migrated = true; } }

export async function GET(request: NextRequest) {
  ensureMigrated();
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const enterpriseId = searchParams.get('enterprise_id');

  let query = 'SELECT fr.*, e.name as enterprise_name FROM follow_up_records fr JOIN enterprises e ON fr.enterprise_id = e.id';
  const params: any[] = [];

  if (enterpriseId) {
    query += ' WHERE fr.enterprise_id = ?';
    params.push(parseInt(enterpriseId));
  }
  query += ' ORDER BY fr.created_at DESC LIMIT 100';

  const records = db.prepare(query).all(...params);
  return NextResponse.json({ records });
}

export async function POST(request: NextRequest) {
  ensureMigrated();
  const db = getDb();
  const body = await request.json();

  const stmt = db.prepare(`
    INSERT INTO follow_up_records (enterprise_id, contact_type, summary, next_action, next_action_date)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    body.enterprise_id,
    body.contact_type || 'call',
    body.summary || '',
    body.next_action || '',
    body.next_action_date || null
  );

  const record = db.prepare('SELECT fr.*, e.name as enterprise_name FROM follow_up_records fr JOIN enterprises e ON fr.enterprise_id = e.id WHERE fr.id = ?').get(result.lastInsertRowid);
  return NextResponse.json({ record }, { status: 201 });
}
