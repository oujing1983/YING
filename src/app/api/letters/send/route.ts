import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runMigrations } from '@/lib/db-migrate';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

let migrated = false;
function ensureMigrated() { if (!migrated) { runMigrations(); migrated = true; } }

function getSmtpConfig() {
  try {
    const db = getDb();
    const row = db.prepare("SELECT value FROM settings WHERE key = 'smtp_config'").get() as any;
    if (row) return JSON.parse(row.value);
  } catch {}
  return null;
}

export async function POST(request: NextRequest) {
  ensureMigrated();

  try {
    const { letter_id, to_email, to_name } = await request.json();

    if (!letter_id) {
      return NextResponse.json({ error: '请指定开发信' }, { status: 400 });
    }

    const config = getSmtpConfig();
    if (!config || !config.host || !config.user || !config.pass) {
      return NextResponse.json({
        error: '请先在系统设置中配置 SMTP 邮箱。\n\n常用配置：\n• QQ邮箱: smtp.qq.com, 端口465, SSL\n• 163邮箱: smtp.163.com, 端口465, SSL\n• 阿里企业邮箱: smtp.qiye.aliyun.com, 端口465',
      }, { status: 400 });
    }

    // Get the letter
    const db = getDb();
    const letter = db.prepare('SELECT * FROM outreach_letters WHERE id = ?').get(letter_id) as any;
    if (!letter) {
      return NextResponse.json({ error: '开发信不存在' }, { status: 404 });
    }

    // Get enterprise info
    const enterprise = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(letter.enterprise_id) as any;

    // Get sender info
    let senderName = config.sender_name || '销售经理';
    try {
      const senderRow = db.prepare("SELECT value FROM settings WHERE key = 'sender_info'").get() as any;
      if (senderRow) {
        const s = JSON.parse(senderRow.value);
        if (s.name) senderName = s.name;
      }
    } catch {}

    const to = to_email || (enterprise ? enterprise.contact_email : '');
    if (!to) {
      return NextResponse.json({ error: '该企业没有邮箱地址，请手动输入' }, { status: 400 });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port || 465,
      secure: config.secure !== false,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    // Send mail
    const subject = letter.subject || `${enterprise?.name || ''} 包装供应合作`;
    const body = letter.body || '';
    const htmlBody = body.replace(/\n/g, '<br>');

    await transporter.sendMail({
      from: `"${senderName}" <${config.user}>`,
      to: to,
      subject: subject,
      text: body,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        ${htmlBody}
        <hr style="margin-top:30px;border:none;border-top:1px solid #eee;">
        <p style="color:#999;font-size:12px;">此邮件由 Lead-AI 系统发送</p>
      </div>`,
    });

    // Mark as sent
    db.prepare('UPDATE outreach_letters SET is_sent = 1, sent_at = datetime("now") WHERE id = ?').run(letter_id);

    return NextResponse.json({ success: true, to });
  } catch (error: any) {
    return NextResponse.json({ error: `发送失败: ${error.message}` }, { status: 500 });
  }
}
