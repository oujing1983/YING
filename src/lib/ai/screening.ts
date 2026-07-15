import { getDb } from '@/lib/db';
import { llmChatJson } from './client';
import { SCREENING_SYSTEM_PROMPT, buildScreeningUserPrompt } from './prompts';

interface ScreeningResult {
  enterprise_id: number;
  industry_match_score: number;
  industry_match_reason: string;
  scale_score: number;
  scale_reason: string;
  region_score: number;
  region_reason: string;
  purchase_likelihood: number;
  purchase_likelihood_reason: string;
  overall_score: number;
  overall_level: string;
  overall_summary: string;
  recommended_approach: string;
  estimated_monthly_demand: string;
  packaging_types_needed: string[];
}

export async function screenEnterprises(enterpriseIds: number[], model?: string): Promise<ScreeningResult[]> {
  const db = getDb();

  const placeholders = enterpriseIds.map(() => '?').join(',');
  const enterprises = db.prepare(
    `SELECT id, name, business_scope, industry_category, region, registered_capital,
            social_security_count, employee_count, is_export, is_ecommerce
     FROM enterprises WHERE id IN (${placeholders})`
  ).all(...enterpriseIds) as any[];

  if (enterprises.length === 0) {
    throw new Error('未找到指定的企业');
  }

  const userPrompt = buildScreeningUserPrompt(enterprises);

  const response = await llmChatJson<{ results: ScreeningResult[] }>([
    { role: 'system', content: SCREENING_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ], { temperature: 0.3, maxTokens: 4000 });

  // Save results to DB
  const upsertStmt = db.prepare(`
    INSERT INTO ai_analyses (
      enterprise_id, model, prompt_version,
      industry_match_score, industry_match_reason,
      scale_score, scale_reason,
      region_score, region_reason,
      purchase_likelihood, purchase_likelihood_reason,
      overall_score, overall_level, overall_summary,
      recommended_approach, estimated_monthly_demand,
      packaging_types_needed
    ) VALUES (?, ?, 'v1', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(enterprise_id) DO UPDATE SET
      model = excluded.model,
      industry_match_score = excluded.industry_match_score,
      industry_match_reason = excluded.industry_match_reason,
      scale_score = excluded.scale_score,
      scale_reason = excluded.scale_reason,
      region_score = excluded.region_score,
      region_reason = excluded.region_reason,
      purchase_likelihood = excluded.purchase_likelihood,
      purchase_likelihood_reason = excluded.purchase_likelihood_reason,
      overall_score = excluded.overall_score,
      overall_level = excluded.overall_level,
      overall_summary = excluded.overall_summary,
      recommended_approach = excluded.recommended_approach,
      estimated_monthly_demand = excluded.estimated_monthly_demand,
      packaging_types_needed = excluded.packaging_types_needed
  `);

  // Update enterprise scores
  const updateEnterprise = db.prepare(`
    UPDATE enterprises SET
      score = ?, score_level = ?, score_reason = ?, score_dimensions = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `);

  for (const result of response.results) {
    if (!result.enterprise_id) continue;

    upsertStmt.run(
      result.enterprise_id,
      model || 'default',
      result.industry_match_score || 0,
      result.industry_match_reason || '',
      result.scale_score || 0,
      result.scale_reason || '',
      result.region_score || 0,
      result.region_reason || '',
      result.purchase_likelihood || 0,
      result.purchase_likelihood_reason || '',
      result.overall_score || 0,
      result.overall_level || 'D',
      result.overall_summary || '',
      result.recommended_approach || '',
      result.estimated_monthly_demand || '',
      JSON.stringify(result.packaging_types_needed || [])
    );

    // Update enterprise with AI score
    updateEnterprise.run(
      result.overall_score || 0,
      result.overall_level || 'D',
      result.overall_summary || '',
      JSON.stringify({
        industry_match: result.industry_match_score,
        scale: result.scale_score,
        region: result.region_score,
        purchase_likelihood: result.purchase_likelihood,
      }),
      result.enterprise_id
    );
  }

  return response.results;
}
