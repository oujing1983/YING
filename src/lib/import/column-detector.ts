/**
 * Auto-detect Chinese column names and map them to system fields.
 * The same column can have multiple Chinese variants.
 */

interface FieldMapping {
  field: string;
  labels: string[];
  required?: boolean;
}

const FIELD_MAPPINGS: FieldMapping[] = [
  { field: 'name', labels: ['企业名称', '公司名称', '客户名称', '单位名称', '名称', '企业名'], required: true },
  { field: 'business_scope', labels: ['经营范围', '业务范围', '营业范围', '经营业务'] },
  { field: 'registered_capital', labels: ['注册资金', '注册资本', '注册资金(万)', '注册资本(万)', '注册资本(万元)'] },
  { field: 'social_security_count', labels: ['社保人数', '参保人数', '缴纳社保人数', '社保'] },
  { field: 'region', labels: ['所在地区', '地区', '省市区', '所属地区', '区域', '省份', '城市', '地址区域'] },
  { field: 'industry_category', labels: ['行业分类', '所属行业', '行业', '主营行业', '行业类别', '一级行业'] },
  { field: 'industry_subcategory', labels: ['行业细分', '二级行业', '子行业'] },
  { field: 'contact_phone', labels: ['联系电话', '电话', '手机', '联系方式', '手机号', '座机', '电话号码'] },
  { field: 'contact_email', labels: ['邮箱', '电子邮箱', 'Email', 'E-mail', '邮件', '企业邮箱'] },
  { field: 'address', labels: ['地址', '企业地址', '公司地址', '注册地址', '办公地址', '详细地址'] },
  { field: 'website', labels: ['官网', '网址', '网站', '企业官网', '公司网址'] },
  { field: 'employee_count', labels: ['员工人数', '员工数', '员工数量', '人数', '公司规模', '从业人员'] },
  { field: 'annual_revenue', labels: ['年营业额', '营业额', '年营收', '营收规模', '年收入'] },
  { field: 'main_products', labels: ['主营产品', '主要产品', '产品', '主营商品'] },
  { field: 'contact_person', labels: ['联系人', '负责人', '法人', '法人代表', '法定代表人', '企业法人'] },
  { field: 'contact_position', labels: ['职位', '职务', '联系人职位'] },
  { field: 'is_ecommerce', labels: ['是否电商', '电商企业', '电商'] },
  { field: 'is_export', labels: ['是否出口', '出口企业', '外贸企业', '进出口'] },
];

export interface ColumnDetection {
  sourceColumn: string;
  targetField: string | null;
  confidence: 'high' | 'medium' | 'manual';
}

export function detectColumns(headers: string[]): ColumnDetection[] {
  return headers.map((header) => {
    const trimmed = header.trim();

    // Try exact match first
    for (const mapping of FIELD_MAPPINGS) {
      if (mapping.labels.some((label) => label === trimmed)) {
        return { sourceColumn: trimmed, targetField: mapping.field, confidence: 'high' };
      }
    }

    // Try fuzzy match (contains)
    for (const mapping of FIELD_MAPPINGS) {
      if (mapping.labels.some((label) => trimmed.includes(label) || label.includes(trimmed))) {
        return { sourceColumn: trimmed, targetField: mapping.field, confidence: 'medium' };
      }
    }

    // No match
    return { sourceColumn: trimmed, targetField: null, confidence: 'manual' };
  });
}

export function getFieldLabel(field: string): string {
  for (const mapping of FIELD_MAPPINGS) {
    if (mapping.field === field) return mapping.labels[0];
  }
  return field;
}

export function getRequiredFields(): string[] {
  return FIELD_MAPPINGS.filter((m) => m.required).map((m) => m.field);
}

export function getAllTargetFields(): string[] {
  return FIELD_MAPPINGS.map((m) => m.field);
}
