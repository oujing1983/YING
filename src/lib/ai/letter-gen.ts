import { getDb } from '@/lib/db';
import { llmChatJson } from './client';
import { LETTER_SYSTEM_PROMPT, buildLetterPrompt } from './prompts';

interface LetterResult {
  subject: string;
  body: string;
  personalization_notes: string;
}

export async function generateLetter(
  enterpriseId: number,
  letterType: string = 'email',
  sender?: { name: string; phone: string; wechat: string; company: string }
): Promise<LetterResult> {
  const db = getDb();

  const enterprise = db.prepare(
    'SELECT * FROM enterprises WHERE id = ?'
  ).get(enterpriseId) as any;

  if (!enterprise) {
    throw new Error('企业不存在');
  }

  const analysis = db.prepare(
    'SELECT * FROM ai_analyses WHERE enterprise_id = ?'
  ).get(enterpriseId) as any;

  // 优先读取系统设置中的发件人信息，再使用传入的 sender 参数，最后用默认值
  let settingsSender = { name: '', phone: '', wechat: '', company: '' };
  try {
    const senderRow = db.prepare("SELECT value FROM settings WHERE key = 'sender_info'").get() as any;
    if (senderRow) {
      settingsSender = JSON.parse(senderRow.value);
    }
  } catch {}
  try {
    const factoryRow = db.prepare("SELECT value FROM settings WHERE key = 'factory_location'").get() as any;
    if (factoryRow) {
      const loc = JSON.parse(factoryRow.value);
      if (!settingsSender.company && loc.city) settingsSender.company = `${loc.province || '浙江'}${loc.city}包装有限公司`;
    }
  } catch {}

  const mergedSender = {
    name: settingsSender.name || sender?.name || '张经理',
    phone: settingsSender.phone || sender?.phone || '13800000000',
    wechat: settingsSender.wechat || sender?.wechat || 'zhang_packing',
    company: settingsSender.company || sender?.company || '浙江XX包装有限公司',
  };

  const userPrompt = buildLetterPrompt(
    {
      name: enterprise.name,
      industry_category: enterprise.industry_category,
      business_scope: enterprise.business_scope,
      contact_person: enterprise.contact_person,
      region: enterprise.region,
    },
    analysis ? {
      overall_summary: analysis.overall_summary,
      recommended_approach: analysis.recommended_approach,
      packaging_types_needed: JSON.parse(analysis.packaging_types_needed || '[]'),
    } : null,
    letterType,
    mergedSender
  );

  const result = await llmChatJson<LetterResult>([
    { role: 'system', content: LETTER_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ], { temperature: 0.5, maxTokens: 1500 });

  // Save to DB
  db.prepare(`
    INSERT INTO outreach_letters (enterprise_id, letter_type, subject, body, personalization_notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    enterpriseId,
    letterType,
    result.subject || '',
    result.body || '',
    result.personalization_notes || ''
  );

  return result;
}
