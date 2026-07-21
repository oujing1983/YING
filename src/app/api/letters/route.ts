import { NextRequest, NextResponse } from 'next/server';
import { generateLetter } from '@/lib/ai/letter-gen';
import { getDb } from '@/lib/db';
import { runMigrations } from '@/lib/db-migrate';

export const dynamic = 'force-dynamic';

let migrated = false;
function ensureMigrated() { if (!migrated) { runMigrations(); migrated = true; } }

export async function POST(request: NextRequest) {
  ensureMigrated();
  const db = getDb();

  try {
    const { enterprise_id, letter_type } = await request.json();

    if (!enterprise_id) {
      return NextResponse.json({ error: '请指定企业' }, { status: 400 });
    }

    const result = await generateLetter(enterprise_id, letter_type || 'email');

    // 获取刚生成的开发信 ID
    const latest = db.prepare(
      'SELECT id FROM outreach_letters WHERE enterprise_id = ? ORDER BY id DESC LIMIT 1'
    ).get(enterprise_id) as any;

    return NextResponse.json({ success: true, id: latest?.id, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: `生成失败: ${error.message}` }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  ensureMigrated();
  const db = getDb();

  try {
    const { id, subject, body } = await request.json();

    if (!id) {
      return NextResponse.json({ error: '请指定开发信ID' }, { status: 400 });
    }

    db.prepare('UPDATE outreach_letters SET subject = ?, body = ?, updated_at = datetime("now") WHERE id = ?')
      .run(subject || '', body || '', id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: `更新失败: ${error.message}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  ensureMigrated();
  const db = getDb();

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: '请指定开发信ID' }, { status: 400 });
    }

    db.prepare('DELETE FROM outreach_letters WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: `删除失败: ${error.message}` }, { status: 500 });
  }
}
