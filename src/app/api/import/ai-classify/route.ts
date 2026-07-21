import { NextRequest, NextResponse } from 'next/server';
import { llmChatJson } from '@/lib/ai/client';

export const dynamic = 'force-dynamic';

const FIELD_OPTIONS = [
  'name', 'business_scope', 'registered_capital', 'social_security_count',
  'region', 'industry_category', 'industry_subcategory', 'contact_phone',
  'contact_email', 'address', 'website', 'is_export', 'is_ecommerce',
  'employee_count', 'annual_revenue', 'main_products', 'contact_person', 'contact_position',
];

export async function POST(request: NextRequest) {
  try {
    const { headers } = await request.json();

    if (!headers || !Array.isArray(headers)) {
      return NextResponse.json({ error: '请提供列名列表' }, { status: 400 });
    }

    const prompt = `你是一位数据处理专家。请分析以下 Excel 表格的列名，将每个列名映射到对应的系统字段。

可用的系统字段：${FIELD_OPTIONS.join(', ')}

说明：
- name: 企业名称/公司名称
- business_scope: 经营范围
- registered_capital: 注册资金/注册资本
- social_security_count: 社保人数/参保人数
- region: 所在地区/省市
- industry_category: 行业分类/所属行业
- industry_subcategory: 行业细分/二级行业
- contact_phone: 联系电话/手机/电话
- contact_email: 邮箱/电子邮箱
- address: 地址/详细地址
- website: 官网/网址
- is_export: 是否出口企业
- is_ecommerce: 是否电商企业
- employee_count: 员工人数/人数
- annual_revenue: 年营业额/营收
- main_products: 主营产品
- contact_person: 联系人/法人
- contact_position: 职位/职务

列名如下：
${headers.map((h: string, i: number) => `${i + 1}. "${h}"`).join('\n')}

请以 JSON 格式返回映射结果，跳过无法识别的列：
{
  "mappings": [
    {"index": 0, "field": "name"},
    {"index": 1, "field": "contact_phone"},
    ...
  ]
}
注意：只返回有把握的映射，不确定的就不要映射。`;

    const result = await llmChatJson<{ mappings: { index: number; field: string }[] }>(
      [{ role: 'user', content: prompt }],
      { temperature: 0.1, maxTokens: 1000 }
    );

    // Build mapping result: index -> field
    const mapping: Record<number, string> = {};
    for (const m of result.mappings) {
      if (FIELD_OPTIONS.includes(m.field) && m.index >= 0 && m.index < headers.length) {
        mapping[m.index] = m.field;
      }
    }

    return NextResponse.json({ success: true, mapping });
  } catch (error: any) {
    return NextResponse.json({ error: `AI 分类失败: ${error.message}` }, { status: 500 });
  }
}
