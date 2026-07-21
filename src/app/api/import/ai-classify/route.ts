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

    const sampleRows = rows.slice(0, 10);
    const maxCols = Math.max(...sampleRows.map((r: any[]) => r.length));

    const rowsText = sampleRows.map((r: any[], i: number) =>
      `行${i}: [${r.map((c: any) => `"${String(c || '').substring(0, 40)}"`).join(', ')}]`
    ).join('\n');

    const systemPrompt = `你是一位资深的数据分析专家，专门处理各种格式的企业数据导入。

你的任务是：分析任意格式的 Excel 数据，找到真正的表头行，并将每一列映射到标准字段。

## 核心能力（举一反三）：
你必须理解数据的**语义**而非仅仅匹配文字。例如：
- "企业名称"、"公司名"、"单位名称"、"Company Name"、"企业" → 都是 name
- "法定代表人"、"法人代表"、"法人"、"负责人"、"联系人"、"联络人" → 都是 contact_person
- "年报电话"、"联系电话"、"电话"、"手机"、"座机"、"Tel"、"Phone" → 都是 contact_phone
- "注册地址"、"办公地址"、"企业地址"、"所在地"、"Address" → 都是 address
- "社保人数"、"参保人数"、"参保"、"社保" → 都是 social_security_count
- "统一社会信用代码"、"信用代码"、"注册号"、"组织机构代码" → 都是 external_id
- "国标行业门类"、"行业分类"、"所属行业"、"行业大类"、"一级行业" → 都是 industry_category
- "国标行业中类"、"行业小类"、"二级行业"、"子行业" → 都是 industry_subcategory
- "所属省份"、"省份"、"省"、"所在省" → 都是 region
- "所属城市"、"城市"、"市" → 都是 region
- "注册资本"、"注册资金"、"注册资本金" → 都是 registered_capital
- "官网网址"、"网址"、"网站"、"官网" → 都是 website
- "邮箱"、"Email"、"电子邮件"、"电子邮箱" → 都是 contact_email
- "经营范围"、"业务范围"、"经营业务" → 都是 business_scope
- "员工人数"、"人数"、"从业人员"、"员工" → 都是 employee_count
- "年营业额"、"营业额"、"营收" → 都是 annual_revenue
- "主营产品"、"产品"、"主营" → 都是 main_products
- "职位"、"职务" → 都是 contact_position

## 表头识别规则：
1. 逐行扫描，找到包含最多列名关键词的那一行
2. 声明/免责/联系方式行 NOT 表头（如"声明：本数据仅供参考"、"联系电话：400-xxx"）
3. 空列名或纯数字列名 NOT 表头
4. 如果第一行就是表头，headerRowIndex = 0

## 示例 1（标准格式）：
行0: ["企业名称", "法定代表人", "注册资本", "联系电话"]
→ headerRowIndex: 0, mappings: [{index:0,field:"name"},{index:1,field:"contact_person"},{index:2,field:"registered_capital"},{index:3,field:"contact_phone"}]

## 示例 2（带声明行的水滴信用格式）：
行0: ["声明：本数据仅供参考...", "", "", ""]
行1: ["联系电话：400-xxx 了解更多...", "", "", ""]
行2: ["企业名称", "登记状态", "法定代表人", "注册资本"]
→ headerRowIndex: 2, 跳过行0和行1

## 示例 3（英文/混合格式）：
行0: ["Company Name", "Legal Representative", "Phone", "Address"]
→ headerRowIndex: 0, 用语义理解映射

请分析以下数据，返回 JSON：
{"headerRowIndex": <表头行号>, "mappings": [{"index": <列号>, "field": "<字段名>"}, ...]}

注意：只返回有把握的映射，不确定的列不映射。`;

    const userPrompt = `请分析以下 Excel 数据（共 ${sampleRows.length} 行），找到表头并映射字段：

${rowsText}

可映射的字段：${FIELD_OPTIONS.join(', ')}`;

    const result = await llmChatJson<AiParseResult>(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.1, maxTokens: 1500 }
    );

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
