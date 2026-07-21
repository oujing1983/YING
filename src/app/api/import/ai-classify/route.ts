import { NextRequest, NextResponse } from 'next/server';
import { llmChatJson } from '@/lib/ai/client';

export const dynamic = 'force-dynamic';

const FIELD_OPTIONS = [
  'name', 'business_scope', 'registered_capital', 'social_security_count',
  'region', 'industry_category', 'industry_subcategory', 'contact_phone',
  'contact_email', 'address', 'website', 'is_export', 'is_ecommerce',
  'employee_count', 'annual_revenue', 'main_products', 'contact_person',
  'contact_position', 'external_id',
];

const FIELD_DESC: Record<string, string> = {
  name: '企业名称/公司名称/单位名称',
  business_scope: '经营范围/业务范围',
  registered_capital: '注册资金/注册资本',
  social_security_count: '社保人数/参保人数',
  region: '所在地区/省份/城市/区县/所属地区',
  industry_category: '行业分类/所属行业/国标行业门类/大类',
  industry_subcategory: '行业细分/国标行业中类/小类',
  contact_phone: '联系电话/电话/手机/年报电话',
  contact_email: '邮箱/电子邮箱/Email',
  address: '地址/企业注册地址/年报地址',
  website: '官网/网址/官方网站',
  is_export: '是否出口企业',
  is_ecommerce: '是否电商企业',
  employee_count: '员工人数/从业人员',
  annual_revenue: '年营业额/年营收',
  main_products: '主营产品/主要产品',
  contact_person: '联系人/法人/法定代表人/负责人',
  contact_position: '职位/职务',
  external_id: '统一社会信用代码/注册号/组织机构代码',
};

interface AiParseResult {
  headerRowIndex: number;
  mappings: { index: number; field: string }[];
}

export async function POST(request: NextRequest) {
  try {
    const { rows } = await request.json();

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: '请提供数据行' }, { status: 400 });
    }

    // 取前 10 行发给 AI 分析
    const sampleRows = rows.slice(0, 10);
    const maxCols = Math.max(...sampleRows.map((r: any[]) => r.length));

    const rowsText = sampleRows.map((r: any[], i: number) =>
      `第${i + 1}行: [${r.map((c: any) => `"${String(c || '').substring(0, 30)}"`).join(', ')}]`
    ).join('\n');

    const fieldsText = FIELD_OPTIONS.map(f => `- ${f}: ${FIELD_DESC[f] || f}`).join('\n');

    const prompt = `你是一位数据分析专家。请分析以下 Excel 导出的前 ${sampleRows.length} 行数据。

第一步：找出哪一行是列名/表头行（通常包含"企业名称"、"法定代表人"、"注册资本"等关键词的行）。
第二步：将表头行的每个列映射到对应的系统字段。

可用的系统字段：
${fieldsText}

原始数据：
${rowsText}

请以 JSON 格式返回结果：
{
  "headerRowIndex": <表头所在行号(从0开始)>,
  "mappings": [
    {"index": <列号从0开始>, "field": "<系统字段名>"},
    ...
  ]
}

规则：
1. 只映射你有把握的列，不确定的不要映射
2. 表头行通常包含最多的列名关键词
3. 跳过声明、联系方式、空行等非数据行
4. 如果前几行都是声明/联系信息，表头可能在后面`;

    const result = await llmChatJson<AiParseResult>(
      [{ role: 'user', content: prompt }],
      { temperature: 0.1, maxTokens: 1500 }
    );

    // 验证并过滤结果
    const mapping: Record<number, string> = {};
    for (const m of result.mappings) {
      if (FIELD_OPTIONS.includes(m.field) && m.index >= 0 && m.index < maxCols) {
        mapping[m.index] = m.field;
      }
    }

    return NextResponse.json({
      success: true,
      headerRowIndex: result.headerRowIndex ?? 0,
      mapping,
    });
  } catch (error: any) {
    return NextResponse.json({ error: `AI 解析失败: ${error.message}` }, { status: 500 });
  }
}
