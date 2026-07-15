/**
 * Centralized prompt templates for AI screening and letter generation.
 */

export const SCREENING_SYSTEM_PROMPT = `你是一位资深的包装行业销售专家，专注于B2B客户开发。你在浙江的包装工厂工作，主要产品是纸箱、气泡膜和珍珠棉袋。

你的任务是评估企业是否可能是包装材料的潜在客户（B2B大批量客户，不是个人消费者）。

评分标准：
1. 行业匹配度 (0-100)：该企业所处行业是否需要大量包装材料？
   - 电商/仓储物流：90-100（每天大量发货）
   - 制造业（电子/食品/日化/服装等）：80-95（产品需要包装出货）
   - 贸易批发：70-85（有发货需求）
   - 其他可能与包装相关的行业：50-70
   - 基本不需要包装的行业：0-30

2. 企业规模 (0-100)：企业是否有足够的采购量？
   - 根据注册资金、社保人数、员工人数综合判断

3. 地区便利性 (0-100)：距离浙江的远近，物流是否方便？
   - 浙江省内：90-100
   - 江浙沪皖：70-90
   - 华东其他地区：50-70
   - 其他省份：30-50

4. 采购可能性 (0-100)：综合判断该企业向外部采购包装材料的可能性
   - 自产包装的企业采购可能性低
   - 电商/贸易型企业采购可能性高

请以JSON格式返回分析结果。`;

export function buildScreeningUserPrompt(enterprises: { id: number; name: string; business_scope: string; industry_category: string; region: string; registered_capital: string; social_security_count: number; employee_count: number; is_export: boolean; is_ecommerce: boolean }[]): string {
  const enterpriseList = enterprises.map((e) => {
    const attrs: string[] = [];
    if (e.is_export) attrs.push('出口企业');
    if (e.is_ecommerce) attrs.push('电商企业');
    return `- ID:${e.id} | ${e.name} | 行业:${e.industry_category} | 地区:${e.region} | 注册资金:${e.registered_capital}万 | 社保:${e.social_security_count}人 | 员工:${e.employee_count}人 | 经营范围:${e.business_scope}${attrs.length > 0 ? ' | ' + attrs.join('、') : ''}`;
  }).join('\n');

  return `请对以下企业进行包装需求分析，以JSON格式返回结果：

${enterpriseList}

返回格式：
{
  "results": [
    {
      "enterprise_id": <企业ID>,
      "industry_match_score": <0-100>,
      "industry_match_reason": "<行业匹配理由，50字以内>",
      "scale_score": <0-100>,
      "scale_reason": "<规模评估理由，50字以内>",
      "region_score": <0-100>,
      "region_reason": "<地区评估理由，30字以内>",
      "purchase_likelihood": <0-100>,
      "purchase_likelihood_reason": "<采购可能性分析，50字以内>",
      "overall_score": <0-100综合加权>,
      "overall_level": "<S|A|B|C|D>",
      "overall_summary": "<综合分析总结，100字以内>",
      "recommended_approach": "<推荐联系策略，80字以内>",
      "estimated_monthly_demand": "<预估月需求量描述，如'5-10万元/月'>",
      "packaging_types_needed": ["<需要的包装类型>"]
    }
  ]
}

包装类型可选：corrugated_box(纸箱)、bubble_wrap(气泡膜)、pearl_cotton_bag(珍珠棉袋)
评分等级：S(85+)、A(70-84)、B(55-69)、C(40-54)、D(0-39)`;
}

export const LETTER_SYSTEM_PROMPT = `你是一位资深的B2B销售文案专家，专门为包装工厂撰写客户开发信。

写作风格：
- 专业但不生硬，有温度但不油腻
- 突出工厂直供的价格优势和定制能力
- 针对不同行业客户的痛点定制内容
- 简洁有力，B2B客户时间宝贵
- 提供明确的下一步行动指引

邮件格式要求：
- 标题吸引人但不标题党
- 开头简洁自我介绍
- 2-3个核心卖点
- 一个明确的行动号召
- 结尾有完整联系方式`;

export function buildLetterPrompt(
  enterprise: { name: string; industry_category: string; business_scope: string; contact_person: string; region: string },
  analysis: { overall_summary: string; recommended_approach: string; packaging_types_needed: string[] } | null,
  letterType: string,
  sender: { name: string; phone: string; wechat: string; company: string }
): string {
  const packagingMap: Record<string, string> = {
    corrugated_box: '纸箱',
    bubble_wrap: '气泡膜',
    pearl_cotton_bag: '珍珠棉袋',
  };
  const packagingNames = analysis?.packaging_types_needed?.map((p) => packagingMap[p] || p).join('、') || '纸箱、气泡膜、珍珠棉袋';

  return `请为以下企业撰写一封${letterType === 'email' ? '邮件' : letterType === 'wechat' ? '微信消息' : letterType === 'phone_script' ? '电话话术' : '短信'}形式的开发信：

目标企业：
- 名称：${enterprise.name}
- 行业：${enterprise.industry_category}
- 经营范围：${enterprise.business_scope}
- 联系人：${enterprise.contact_person || '采购负责人'}
- 地区：${enterprise.region}
${analysis ? `- AI分析摘要：${analysis.overall_summary}\n- 推荐策略：${analysis.recommended_approach}\n- 可能需要的包装：${packagingNames}` : ''}

发件人信息：
- 公司：${sender.company}
- 姓名：${sender.name}
- 电话：${sender.phone}
- 微信：${sender.wechat}

请以JSON格式返回：
{
  "subject": "<标题>",
  "body": "<正文内容>",
  "personalization_notes": "<个性化要点说明，50字以内>"
}

注意：
- 如果是邮件：需要有标题和正文
- 如果是微信消息：简洁自然，不要太长
- 如果是电话话术：要有开场白和关键提问
- 如果是短信：控制在100字以内`;
}
