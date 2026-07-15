import { NextRequest, NextResponse } from 'next/server';
import { runMigrations } from '@/lib/db-migrate';
import { generateLetter } from '@/lib/ai/letter-gen';

let migrated = false;
function ensureMigrated() {
  if (!migrated) { runMigrations(); migrated = true; }
}

export async function POST(request: NextRequest) {
  ensureMigrated();

  try {
    const { enterprise_id, letter_type, sender } = await request.json();

    if (!enterprise_id) {
      return NextResponse.json({ error: '请指定企业ID' }, { status: 400 });
    }

    const result = await generateLetter(enterprise_id, letter_type || 'email', sender);

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: `生成失败: ${error.message}` }, { status: 500 });
  }
}
