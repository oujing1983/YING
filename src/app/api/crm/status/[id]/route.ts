import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runMigrations } from '@/lib/db-migrate';

let migrated = false;
function ensureMigrated() { if (!migrated) { runMigrations(); migrated = true; } }

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  ensureMigrated();
  const db = getDb();
  const id = parseInt(params.id);
  const { status } = await request.json();

  db.prepare("UPDATE enterprises SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
  const enterprise = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(id);
  return NextResponse.json({ enterprise });
}
