import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runMigrations } from '@/lib/db-migrate';

let migrated = false;
function ensureMigrated() { if (!migrated) { runMigrations(); migrated = true; } }

export async function GET() {
  ensureMigrated();
  const db = getDb();

  const reminders = db.prepare(`
    SELECT fr.*, e.name as enterprise_name
    FROM follow_up_records fr
    JOIN enterprises e ON fr.enterprise_id = e.id
    WHERE fr.is_completed = 0 AND fr.next_action_date IS NOT NULL
    ORDER BY fr.next_action_date ASC
    LIMIT 50
  `).all();

  const now = new Date();
  const overdue: any[] = [];
  const upcoming: any[] = [];

  for (const r of reminders as any[]) {
    if (new Date(r.next_action_date) < now) {
      overdue.push(r);
    } else {
      upcoming.push(r);
    }
  }

  return NextResponse.json({ overdue, upcoming, total: (reminders as any[]).length });
}
