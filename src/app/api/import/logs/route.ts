import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runMigrations } from '@/lib/db-migrate';

let migrated = false;
function ensureMigrated() {
  if (!migrated) { runMigrations(); migrated = true; }
}

export async function GET() {
  ensureMigrated();
  const db = getDb();
  const logs = db.prepare('SELECT * FROM import_logs ORDER BY created_at DESC LIMIT 20').all();
  return NextResponse.json({ logs });
}
