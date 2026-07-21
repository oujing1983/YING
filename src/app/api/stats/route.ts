import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runMigrations } from '@/lib/db-migrate';

export const dynamic = 'force-dynamic';
let migrated = false;
function ensureMigrated() { if (!migrated) { runMigrations(); migrated = true; } }

export async function GET() {
  ensureMigrated();
  const db = getDb();

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as new_week,
      SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
      SUM(CASE WHEN status IN ('interested','quoted','negotiating') THEN 1 ELSE 0 END) as interested,
      SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won
    FROM enterprises
  `).get() as any;

  const byLevel = db.prepare("SELECT score_level, COUNT(*) as c FROM enterprises GROUP BY score_level").all() as any[];
  const byStatus = db.prepare("SELECT status, COUNT(*) as c FROM enterprises GROUP BY status").all() as any[];

  const reminders = db.prepare("SELECT COUNT(*) as c FROM follow_up_records WHERE is_completed = 0 AND next_action_date IS NOT NULL AND next_action_date < datetime('now')").get() as any;
  const upcoming = db.prepare("SELECT COUNT(*) as c FROM follow_up_records WHERE is_completed = 0 AND next_action_date IS NOT NULL AND next_action_date >= datetime('now')").get() as any;

  return NextResponse.json({
    total_enterprises: stats?.total || 0,
    new_this_week: stats?.new_week || 0,
    contacted: stats?.contacted || 0,
    interested: stats?.interested || 0,
    won: stats?.won || 0,
    by_level: Object.fromEntries(byLevel.map((r: any) => [r.score_level, r.c])),
    by_status: Object.fromEntries(byStatus.map((r: any) => [r.status, r.c])),
    overdue_reminders: reminders?.c || 0,
    upcoming_reminders: upcoming?.c || 0,
  });
}
