import { NextRequest, NextResponse } from 'next/server';
import { runMigrations } from '@/lib/db-migrate';
import { screenEnterprises } from '@/lib/ai/screening';

let migrated = false;
function ensureMigrated() {
  if (!migrated) { runMigrations(); migrated = true; }
}

export async function POST(request: NextRequest) {
  ensureMigrated();

  try {
    const { ids, model } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '请选择要筛选的企业' }, { status: 400 });
    }

    if (ids.length > 20) {
      return NextResponse.json({ error: '单次最多筛选20家企业' }, { status: 400 });
    }

    const results = await screenEnterprises(ids, model);

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: `AI 筛选失败: ${error.message}` }, { status: 500 });
  }
}
