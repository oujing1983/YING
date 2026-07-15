// ============================================================
// Enterprise
// ============================================================

export type ScoreLevel = 'S' | 'A' | 'B' | 'C' | 'D';

export type EnterpriseStatus =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'quoted'
  | 'negotiating'
  | 'won'
  | 'lost';

export type EnterpriseSource = 'manual' | 'excel_import' | 'api_qichacha';

export interface Enterprise {
  id: number;
  created_at: string;
  updated_at: string;

  // Basic info
  name: string;
  business_scope: string;
  registered_capital: string;
  social_security_count: number;
  region: string;
  industry_category: string;
  industry_subcategory: string;
  contact_phone: string;
  contact_email: string;
  address: string;
  website: string;

  // Packaging industry indicators
  is_export: boolean;
  is_ecommerce: boolean;
  has_1688: boolean;
  has_taobao: boolean;
  has_jd: boolean;
  has_pdd: boolean;
  employee_count: number;
  annual_revenue: string;
  main_products: string;

  // Scoring
  score: number;
  score_level: ScoreLevel;
  score_reason: string;
  score_dimensions: string; // JSON

  // CRM
  status: EnterpriseStatus;
  contact_person: string;
  contact_position: string;

  // Geo
  latitude: number;
  longitude: number;
  distance_km: number;

  // Source
  source: EnterpriseSource;
  import_batch_id: number | null;
  external_id: string;

  // Flexible
  extra_data: string; // JSON
}

export interface EnterpriseCreate {
  name: string;
  business_scope?: string;
  registered_capital?: string;
  social_security_count?: number;
  region?: string;
  industry_category?: string;
  industry_subcategory?: string;
  contact_phone?: string;
  contact_email?: string;
  address?: string;
  website?: string;
  is_export?: boolean;
  is_ecommerce?: boolean;
  has_1688?: boolean;
  has_taobao?: boolean;
  has_jd?: boolean;
  has_pdd?: boolean;
  employee_count?: number;
  annual_revenue?: string;
  main_products?: string;
  contact_person?: string;
  contact_position?: string;
  latitude?: number;
  longitude?: number;
  distance_km?: number;
  source?: EnterpriseSource;
  external_id?: string;
  extra_data?: string;
}

export interface EnterpriseUpdate extends Partial<EnterpriseCreate> {
  status?: EnterpriseStatus;
  score?: number;
  score_level?: ScoreLevel;
  score_reason?: string;
  score_dimensions?: string;
}

// ============================================================
// AI Analysis
// ============================================================

export interface AiAnalysis {
  id: number;
  enterprise_id: number;
  created_at: string;
  model: string;
  prompt_version: string;

  industry_match_score: number;
  industry_match_reason: string;
  scale_score: number;
  scale_reason: string;
  region_score: number;
  region_reason: string;
  purchase_likelihood: number;
  purchase_likelihood_reason: string;

  overall_score: number;
  overall_level: ScoreLevel;
  overall_summary: string;
  recommended_approach: string;
  estimated_monthly_demand: string;
  packaging_types_needed: string; // JSON
}

export interface ScreeningResult {
  enterprise_id: number;
  enterprise_name: string;
  industry_match_score: number;
  industry_match_reason: string;
  scale_score: number;
  scale_reason: string;
  region_score: number;
  region_reason: string;
  purchase_likelihood: number;
  purchase_likelihood_reason: string;
  overall_score: number;
  overall_level: ScoreLevel;
  overall_summary: string;
  recommended_approach: string;
  estimated_monthly_demand: string;
  packaging_types_needed: string[];
}

// ============================================================
// Outreach Letters
// ============================================================

export type LetterType = 'email' | 'wechat' | 'phone_script' | 'sms';

export interface OutreachLetter {
  id: number;
  enterprise_id: number;
  template_id: number | null;
  created_at: string;
  letter_type: LetterType;
  subject: string;
  body: string;
  personalization_notes: string;
  is_sent: boolean;
  sent_at: string | null;
}

// ============================================================
// Email Templates
// ============================================================

export interface EmailTemplate {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  type: LetterType;
  subject_template: string;
  body_template: string;
  category: string;
  is_default: boolean;
}

// ============================================================
// Follow-up Records
// ============================================================

export type ContactType =
  | 'call'
  | 'email'
  | 'wechat'
  | 'visit'
  | 'meeting'
  | 'quote_sent'
  | 'other';

export interface FollowUpRecord {
  id: number;
  enterprise_id: number;
  created_at: string;
  contact_type: ContactType;
  summary: string;
  next_action: string;
  next_action_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
}

// ============================================================
// Import Logs
// ============================================================

export interface ImportLog {
  id: number;
  created_at: string;
  file_name: string;
  total_rows: number;
  imported_rows: number;
  skipped_rows: number;
  error_rows: number;
  column_mapping: string; // JSON
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string;
}

// ============================================================
// API Credentials
// ============================================================

export interface ApiCredential {
  id: number;
  provider: string;
  api_key_encrypted: string;
  api_secret_encrypted: string;
  is_active: boolean;
  last_sync_at: string | null;
  config: string; // JSON
}

// ============================================================
// Dashboard Stats
// ============================================================

export interface DashboardStats {
  total_enterprises: number;
  new_this_week: number;
  contacted: number;
  interested: number;
  won: number;
  by_level: Record<ScoreLevel, number>;
  by_status: Record<EnterpriseStatus, number>;
  upcoming_reminders: number;
  overdue_reminders: number;
}

// ============================================================
// API Query Params
// ============================================================

export interface EnterpriseListParams {
  page?: number;
  page_size?: number;
  search?: string;
  industry?: string;
  score_level?: ScoreLevel;
  status?: EnterpriseStatus;
  region?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface EnterpriseListResponse {
  enterprises: Enterprise[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ============================================================
// Column Mapping (for Import)
// ============================================================

export interface ColumnMapping {
  source_column: string;
  target_field: string;
}

// ============================================================
// Settings
// ============================================================

export interface SystemSettings {
  llm_api_url: string;
  llm_api_key: string;
  llm_model: string;
  llm_temperature: number;
  factory_city: string;
  factory_province: string;
  industry_categories: string[];
}
