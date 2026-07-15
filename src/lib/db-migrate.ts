import { getDb } from './db';

export function runMigrations(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS enterprises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),

      name TEXT NOT NULL,
      business_scope TEXT DEFAULT '',
      registered_capital TEXT DEFAULT '',
      social_security_count INTEGER DEFAULT 0,
      region TEXT DEFAULT '',
      industry_category TEXT DEFAULT '',
      industry_subcategory TEXT DEFAULT '',
      contact_phone TEXT DEFAULT '',
      contact_email TEXT DEFAULT '',
      address TEXT DEFAULT '',
      website TEXT DEFAULT '',

      is_export INTEGER DEFAULT 0,
      is_ecommerce INTEGER DEFAULT 0,
      has_1688 INTEGER DEFAULT 0,
      has_taobao INTEGER DEFAULT 0,
      has_jd INTEGER DEFAULT 0,
      has_pdd INTEGER DEFAULT 0,
      employee_count INTEGER DEFAULT 0,
      annual_revenue TEXT DEFAULT '',
      main_products TEXT DEFAULT '',

      score INTEGER DEFAULT 0,
      score_level TEXT DEFAULT 'D' CHECK(score_level IN ('S','A','B','C','D')),
      score_reason TEXT DEFAULT '',
      score_dimensions TEXT DEFAULT '{}',

      status TEXT DEFAULT 'new' CHECK(status IN ('new','contacted','interested','quoted','negotiating','won','lost')),
      contact_person TEXT DEFAULT '',
      contact_position TEXT DEFAULT '',

      latitude REAL DEFAULT 0,
      longitude REAL DEFAULT 0,
      distance_km REAL DEFAULT 0,

      source TEXT DEFAULT 'manual' CHECK(source IN ('manual','excel_import','api_qichacha')),
      import_batch_id INTEGER DEFAULT NULL,
      external_id TEXT DEFAULT '',

      extra_data TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS ai_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now')),
      model TEXT DEFAULT '',
      prompt_version TEXT DEFAULT '',

      industry_match_score INTEGER DEFAULT 0,
      industry_match_reason TEXT DEFAULT '',
      scale_score INTEGER DEFAULT 0,
      scale_reason TEXT DEFAULT '',
      region_score INTEGER DEFAULT 0,
      region_reason TEXT DEFAULT '',
      purchase_likelihood INTEGER DEFAULT 0,
      purchase_likelihood_reason TEXT DEFAULT '',

      overall_score INTEGER DEFAULT 0,
      overall_level TEXT DEFAULT 'D',
      overall_summary TEXT DEFAULT '',
      recommended_approach TEXT DEFAULT '',
      estimated_monthly_demand TEXT DEFAULT '',
      packaging_types_needed TEXT DEFAULT '{}',

      UNIQUE(enterprise_id)
    );

    CREATE TABLE IF NOT EXISTS outreach_letters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
      template_id INTEGER DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now')),

      letter_type TEXT DEFAULT 'email' CHECK(letter_type IN ('email','wechat','phone_script','sms')),
      subject TEXT DEFAULT '',
      body TEXT DEFAULT '',
      personalization_notes TEXT DEFAULT '',
      is_sent INTEGER DEFAULT 0,
      sent_at TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS email_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      name TEXT NOT NULL,
      type TEXT DEFAULT 'email' CHECK(type IN ('email','wechat','phone_script','sms')),
      subject_template TEXT DEFAULT '',
      body_template TEXT DEFAULT '',
      category TEXT DEFAULT 'general' CHECK(category IN ('general','cold_outreach','follow_up','quote','thank_you')),
      is_default INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS follow_up_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now')),

      contact_type TEXT DEFAULT 'call' CHECK(contact_type IN ('call','email','wechat','visit','meeting','quote_sent','other')),
      summary TEXT DEFAULT '',
      next_action TEXT DEFAULT '',
      next_action_date TEXT DEFAULT NULL,
      is_completed INTEGER DEFAULT 0,
      completed_at TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS import_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT DEFAULT (datetime('now')),
      file_name TEXT DEFAULT '',
      total_rows INTEGER DEFAULT 0,
      imported_rows INTEGER DEFAULT 0,
      skipped_rows INTEGER DEFAULT 0,
      error_rows INTEGER DEFAULT 0,
      column_mapping TEXT DEFAULT '{}',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','failed')),
      error_message TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS api_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      api_key_encrypted TEXT DEFAULT '',
      api_secret_encrypted TEXT DEFAULT '',
      is_active INTEGER DEFAULT 0,
      last_sync_at TEXT DEFAULT NULL,
      config TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_enterprises_score ON enterprises(score_level, score DESC);
    CREATE INDEX IF NOT EXISTS idx_enterprises_status ON enterprises(status);
    CREATE INDEX IF NOT EXISTS idx_enterprises_region ON enterprises(region);
    CREATE INDEX IF NOT EXISTS idx_enterprises_industry ON enterprises(industry_category);
    CREATE INDEX IF NOT EXISTS idx_enterprises_name ON enterprises(name);
    CREATE INDEX IF NOT EXISTS idx_letters_enterprise ON outreach_letters(enterprise_id);
    CREATE INDEX IF NOT EXISTS idx_followup_enterprise ON follow_up_records(enterprise_id);
    CREATE INDEX IF NOT EXISTS idx_followup_reminder ON follow_up_records(next_action_date) WHERE is_completed = 0;
  `);

  // Insert default email templates
  const count = db.prepare('SELECT COUNT(*) as c FROM email_templates').get() as { c: number };
  if (count.c === 0) {
    const insert = db.prepare(`
      INSERT INTO email_templates (name, type, subject_template, body_template, category, is_default)
      VALUES (?, ?, ?, ?, ?, 1)
    `);

    insert.run(
      '冷启动开发信',
      'email',
      '{{company_name}} 您好，关于包装供应合作',
      `{{company_name}} 您好：

我是浙江XX包装有限公司的{{sender_name}}，我们专业生产纸箱、气泡袋、珍珠棉袋等包装材料。

了解到贵司从事{{industry}}行业，在日常生产/发货中应该对包装材料有较大需求。我们作为源头工厂，具备以下优势：

1. 厂家直供，价格有竞争力
2. 支持定做印刷，起订量灵活
3. 浙江工厂直发，物流时效快
4. 可开增值税专票

如有需要，可以寄送样品供您检验。期待与您合作！

联系人：{{sender_name}}
电话：{{sender_phone}}
微信：{{sender_wechat}}`,
      'cold_outreach'
    );

    insert.run(
      '跟进邮件',
      'email',
      '回复：关于{{company_name}}的包装需求',
      `{{company_name}} {{contact_person}}您好：

之前和您联系过关于包装供应的事宜，不知贵司目前是否还有这方面的需求？

我们最近给{{case_industry}}行业的几家客户提供了包装方案，反馈都不错。如果您方便，我可以根据贵司的产品特点，出一个针对性的包装方案和报价。

有任何问题随时联系我，期待您的回复！

{{sender_name}}
{{sender_phone}}`,
      'follow_up'
    );

    insert.run(
      '微信话术模板',
      'wechat',
      '首次添加好友话术',
      `{{contact_person}}总/经理您好，我是浙江XX包装的{{sender_name}}。

我们专做纸箱、气泡袋、珍珠棉袋，源头工厂直供。看到贵司是做{{industry}}的，应该有包装需求，加您微信方便发个产品目录给您参考。`,
      'cold_outreach'
    );

    insert.run(
      '电话话术模板',
      'phone_script',
      '首次电话联系话术',
      `您好，请问是{{company_name}}的{{contact_person}}吗？

我是浙江XX包装有限公司的{{sender_name}}，我们主要生产纸箱、气泡袋、珍珠棉袋等包装材料。

给您打电话是想了解一下，贵司目前有没有包装采购方面的需求？我们是源头工厂，价格和品质都有优势，也可以根据你们的产品定制尺寸和印刷。

方便的话，我可以先发一份产品目录和报价给您参考。`,
      'cold_outreach'
    );
  }
}
