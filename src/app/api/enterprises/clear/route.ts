import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runMigrations } from '@/lib/db-migrate';

let migrated = false;
function ensureMigrated() { if (!migrated) { runMigrations(); migrated = true; } }

export async function POST(request: NextRequest) {
  ensureMigrated();
  const db = getDb();

  try {
    const body = await request.json();

    if (body.action === 'clear_enterprises') {
      const count = db.prepare('SELECT COUNT(*) as c FROM enterprises').get() as { c: number };

      // 按顺序删除关联数据和外键
      db.exec(`
        DELETE FROM follow_up_records;
        DELETE FROM outreach_letters;
        DELETE FROM ai_analyses;
        DELETE FROM enterprises;
        DELETE FROM import_logs;
      `);

      return NextResponse.json({
        success: true,
        deleted: count.c,
      });
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: `清空失败: ${error.message}` }, { status: 500 });
  }
}
