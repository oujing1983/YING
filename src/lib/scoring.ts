import { Enterprise } from '@/types';

interface ScoreResult {
  score: number;
  level: 'S' | 'A' | 'B' | 'C' | 'D';
  reason: string;
  dimensions: Record<string, number>;
}

// Industry keywords mapped to scores
const INDUSTRY_KEYWORDS: Record<string, { score: number; keywords: string[] }> = {
  ecommerce: { score: 25, keywords: ['电商', '电子商务', '互联网', '网络科技', '淘宝', '天猫', '京东', '拼多多', '直播', '跨境'] },
  manufacturing: { score: 25, keywords: ['制造', '生产', '加工', '五金', '机械', '电器', '电子', '汽配', '汽车配件'] },
  food: { score: 20, keywords: ['食品', '饮料', '酒', '茶', '零食', '农产品', '粮油', '水产品', '调味品'] },
  logistics: { score: 20, keywords: ['物流', '仓储', '供应链', '货运', '快递', '运输'] },
  electronics: { score: 20, keywords: ['电子', '数码', '手机', '电脑', '电器', '家电', '仪器仪表'] },
  pharma: { score: 15, keywords: ['医药', '制药', '生物', '医疗', '器械', '保健品', '中药'] },
  textile: { score: 15, keywords: ['纺织', '服装', '鞋', '帽', '家纺', '面料', '皮革', '箱包'] },
  retail: { score: 10, keywords: ['贸易', '商贸', '销售', '批发', '零售', '进出口'] },
  daily_chemical: { score: 15, keywords: ['日化', '化妆品', '日用', '化工', '塑料', '玩具', '文具', '体育'] },
};

const REGION_SCORES: Record<string, number> = {
  '浙江': 20, '江苏': 18, '上海': 18, '安徽': 15, '福建': 12,
  '江西': 10, '山东': 8, '广东': 5, '北京': 5, '天津': 5,
};

function getIndustryScore(scope: string, category: string): { score: number; matched: string[] } {
  const text = (scope + category).toLowerCase();
  let totalScore = 0;
  const matched: string[] = [];

  for (const [industry, config] of Object.entries(INDUSTRY_KEYWORDS)) {
    let industryMatched = false;
    for (const keyword of config.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        industryMatched = true;
        break;
      }
    }
    if (industryMatched) {
      totalScore += config.score;
      matched.push(industry);
    }
  }

  // Cap at 70 for rule-based
  return { score: Math.min(totalScore, 70), matched };
}

function getScaleScore(enterprise: Partial<Enterprise>): number {
  let score = 0;
  const empCount = enterprise.employee_count || 0;
  const socialCount = enterprise.social_security_count || 0;
  const capital = parseFloat(enterprise.registered_capital || '0');

  if (empCount >= 100 || socialCount >= 50) score += 10;
  else if (empCount >= 50 || socialCount >= 20) score += 7;
  else if (empCount >= 20 || socialCount >= 10) score += 5;

  if (capital >= 500) score += 10;
  else if (capital >= 100) score += 7;

  return Math.min(score, 20);
}

function getRegionScore(region: string): number {
  for (const [key, score] of Object.entries(REGION_SCORES)) {
    if (region.includes(key)) return score;
  }
  return 3; // default for other regions
}

function getEcommerceScore(enterprise: Partial<Enterprise>): number {
  let score = 0;
  if (enterprise.is_export) score += 15;
  if (enterprise.has_1688) score += 10;
  if (enterprise.has_taobao) score += 10;
  if (enterprise.has_jd) score += 10;
  if (enterprise.has_pdd) score += 10;
  if (enterprise.is_ecommerce) score += 10;
  return Math.min(score, 25);
}

function scoreToLevel(score: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  if (score >= 85) return 'S';
  if (score >= 70) return 'A';
  if (score >= 55) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

export function scoreEnterprise(enterprise: Partial<Enterprise>): ScoreResult {
  const industryResult = getIndustryScore(
    enterprise.business_scope || '',
    enterprise.industry_category || ''
  );
  const scaleScore = getScaleScore(enterprise);
  const regionScore = getRegionScore(enterprise.region || '');
  const ecommerceScore = getEcommerceScore(enterprise);

  const dimensions = {
    industry_match: industryResult.score,
    scale: scaleScore,
    region: regionScore,
    ecommerce: ecommerceScore,
  };

  // Weighted total (capped at 100)
  const totalScore = Math.min(
    industryResult.score + scaleScore + regionScore + ecommerceScore,
    100
  );

  const level = scoreToLevel(totalScore);

  const reasons: string[] = [];
  if (industryResult.matched.length > 0) {
    const names = industryResult.matched.map((m) => {
      const map: Record<string, string> = {
        ecommerce: '电商', manufacturing: '制造业', food: '食品饮料',
        logistics: '物流仓储', electronics: '电子电器', pharma: '医药医疗',
        textile: '纺织服装', retail: '贸易零售', daily_chemical: '日化消费品',
      };
      return map[m] || m;
    });
    reasons.push(`行业匹配(${names.join('/')}): +${industryResult.score}`);
  }
  if (scaleScore > 0) reasons.push(`企业规模: +${scaleScore}`);
  if (regionScore > 0) reasons.push(`地区便利(${enterprise.region}): +${regionScore}`);
  if (ecommerceScore > 0) reasons.push(`电商/出口属性: +${ecommerceScore}`);
  if (reasons.length === 0) reasons.push('暂无明确的包装需求匹配');

  return {
    score: totalScore,
    level,
    reason: reasons.join('；'),
    dimensions,
  };
}

export function batchScoreEnterprises(enterprises: Partial<Enterprise>[]): (Partial<Enterprise> & { score: number; score_level: string; score_reason: string; score_dimensions: string })[] {
  return enterprises.map((e) => {
    const result = scoreEnterprise(e);
    return {
      ...e,
      score: result.score,
      score_level: result.level,
      score_reason: result.reason,
      score_dimensions: JSON.stringify(result.dimensions),
    };
  });
}
