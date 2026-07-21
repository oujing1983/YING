import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { getDb } from '@/lib/db';
import { runMigrations } from '@/lib/db-migrate';
import { formatDate, formatDateTime, getStatusLabel, getStatusColor, getScoreColor, getContactTypeLabel } from '@/lib/utils';
import { LettersPanel } from '@/components/enterprise/letters-panel';
import Link from 'next/link';
import { ArrowLeft, Edit, Phone, Mail, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

export default function EnterpriseDetailPage({ params }: { params: { id: string } }) {
  runMigrations();
  const db = getDb();
  const id = parseInt(params.id);

  const enterprise = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(id) as any;
  if (!enterprise) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-bold text-gray-900">企业不存在</h1>
        <Link href="/enterprises" className="text-blue-600 hover:underline mt-4 inline-block">返回列表</Link>
      </div>
    );
  }

  const analysis = db.prepare('SELECT * FROM ai_analyses WHERE enterprise_id = ?').get(id) as any;
  const letters = db.prepare('SELECT * FROM outreach_letters WHERE enterprise_id = ? ORDER BY created_at DESC').all(id) as any[];
  const followUps = db.prepare('SELECT * FROM follow_up_records WHERE enterprise_id = ? ORDER BY created_at DESC').all(id) as any[];

  // 上一页/下一页
  const prevRow = db.prepare('SELECT id, name FROM enterprises WHERE id < ? ORDER BY id DESC LIMIT 1').get(id) as any;
  const nextRow = db.prepare('SELECT id, name FROM enterprises WHERE id > ? ORDER BY id ASC LIMIT 1').get(id) as any;

  const InfoTab = (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader><h3 className="font-semibold">基本信息</h3></CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="企业名称" value={enterprise.name} />
          <InfoRow label="经营范围" value={enterprise.business_scope} />
          <InfoRow label="注册资金" value={enterprise.registered_capital ? `${enterprise.registered_capital}万` : '-'} />
          <InfoRow label="社保人数" value={enterprise.social_security_count || '-'} />
          <InfoRow label="员工人数" value={enterprise.employee_count || '-'} />
          <InfoRow label="年营业额" value={enterprise.annual_revenue || '-'} />
          <InfoRow label="主营产品" value={enterprise.main_products || '-'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="font-semibold">联系方式</h3></CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="联系人" value={enterprise.contact_person || '-'} />
          <InfoRow label="职位" value={enterprise.contact_position || '-'} />
          <InfoRow label="电话" value={enterprise.contact_phone ? (
            <a href={`tel:${enterprise.contact_phone}`} className="text-blue-600 hover:underline flex items-center gap-1">
              <Phone className="w-3 h-3" />{enterprise.contact_phone}
            </a>
          ) : '-'} />
          <InfoRow label="邮箱" value={enterprise.contact_email ? (
            <a href={`mailto:${enterprise.contact_email}`} className="text-blue-600 hover:underline flex items-center gap-1">
              <Mail className="w-3 h-3" />{enterprise.contact_email}
            </a>
          ) : '-'} />
          <InfoRow label="地址" value={enterprise.address ? (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{enterprise.address}</span>
          ) : '-'} />
          <InfoRow label="官网" value={enterprise.website ? (
            <a href={enterprise.website} target="_blank" className="text-blue-600 hover:underline">{enterprise.website}</a>
          ) : '-'} />
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader><h3 className="font-semibold">业务属性</h3></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <AttrBadge label="出口企业" active={enterprise.is_export} />
            <AttrBadge label="电商企业" active={enterprise.is_ecommerce} />
            <AttrBadge label="1688店铺" active={enterprise.has_1688} />
            <AttrBadge label="淘宝/天猫" active={enterprise.has_taobao} />
            <AttrBadge label="京东" active={enterprise.has_jd} />
            <AttrBadge label="拼多多" active={enterprise.has_pdd} />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const AnalysisTab = (
    <div className="space-y-4">
      {analysis ? (
        <>
          <Card>
            <CardHeader><h3 className="font-semibold">AI 分析结果</h3></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <ScoreBox label="行业匹配" score={analysis.industry_match_score} />
                <ScoreBox label="企业规模" score={analysis.scale_score} />
                <ScoreBox label="地区便利" score={analysis.region_score} />
                <ScoreBox label="采购可能" score={analysis.purchase_likelihood} />
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800">{analysis.overall_summary}</p>
              </div>
              {analysis.recommended_approach && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700">推荐策略</h4>
                  <p className="text-sm text-gray-600 mt-1">{analysis.recommended_approach}</p>
                </div>
              )}
              {analysis.estimated_monthly_demand && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700">预估月需求量</h4>
                  <p className="text-sm text-gray-600 mt-1">{analysis.estimated_monthly_demand}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>暂未进行 AI 分析</p>
          <Link href={`/screening`}>
            <Button variant="outline" className="mt-3">前往 AI 筛选中心</Button>
          </Link>
        </div>
      )}
    </div>
  );

  const LettersTab = <LettersPanel enterpriseId={id} initialLetters={letters} enterpriseEmail={enterprise.contact_email} enterprisePhone={enterprise.contact_phone} />;

  const CRMHistoryContent = followUps.length === 0 ? (
    <div className="text-center py-8 text-gray-500">
      <p>暂无跟进记录</p>
    </div>
  ) : (
    <div className="space-y-3">
      {followUps.map((f: any) => (
        <div key={f.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xs text-blue-600 font-medium">
                {getContactTypeLabel(f.contact_type)[0]}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">{getContactTypeLabel(f.contact_type)}</span>
              <span className="text-xs text-gray-400">{formatDate(f.created_at)}</span>
              {f.is_completed ? (
                <Badge variant="success">已完成</Badge>
              ) : (
                <Badge variant="warning">待跟进</Badge>
              )}
            </div>
            <p className="text-sm text-gray-700 mt-1">{f.summary}</p>
            {f.next_action && (
              <p className="text-xs text-blue-600 mt-1">下一步: {f.next_action} {f.next_action_date ? `(${formatDate(f.next_action_date)})` : ''}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const CRMForm = (
    <form action={`/api/crm/follow-ups`} method="POST" className="space-y-3">
      <input type="hidden" name="enterprise_id" value={enterprise.id} />
      <select name="contact_type" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
        <option value="call">电话</option>
        <option value="email">邮件</option>
        <option value="wechat">微信</option>
        <option value="visit">拜访</option>
        <option value="meeting">会议</option>
        <option value="quote_sent">报价</option>
        <option value="other">其他</option>
      </select>
      <textarea name="summary" placeholder="跟进内容摘要" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={2}></textarea>
      <input name="next_action" placeholder="下一步计划" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input name="next_action_date" type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <Button type="submit" size="sm">添加记录</Button>
    </form>
  );

  const CRMTab = (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <h3 className="font-semibold mb-3">跟进历史</h3>
        {CRMHistoryContent}
      </div>
      <div>
        <Card>
          <CardHeader><h3 className="font-semibold">添加跟进</h3></CardHeader>
          <CardContent>{CRMForm}</CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/enterprises" className="p-1 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{enterprise.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getScoreColor(enterprise.score_level)}`}>
                {enterprise.score_level} 级 · {enterprise.score} 分
              </span>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(enterprise.status)}`}>
                {getStatusLabel(enterprise.status)}
              </span>
              {enterprise.industry_category && (
                <span className="text-xs text-gray-500">{enterprise.industry_category}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-4">
            {prevRow ? (
              <Link href={`/enterprises/${prevRow.id}`}>
                <Button variant="outline" size="sm" title={prevRow.name}>
                  <ChevronLeft className="w-4 h-4" /> 上一页
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled><ChevronLeft className="w-4 h-4" /> 上一页</Button>
            )}
            <span className="text-xs text-gray-400">|</span>
            {nextRow ? (
              <Link href={`/enterprises/${nextRow.id}`}>
                <Button variant="outline" size="sm" title={nextRow.name}>
                  下一页 <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>下一页 <ChevronRight className="w-4 h-4" /></Button>
            )}
          </div>
          <Link href={`/enterprises/${enterprise.id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />编辑
            </Button>
          </Link>
        </div>
      </div>

      <Tabs
        tabs={[
          { key: 'info', label: '基本信息', content: InfoTab },
          { key: 'ai', label: 'AI 分析', content: AnalysisTab },
          { key: 'letters', label: '开发信', content: LettersTab },
          { key: 'crm', label: '跟进记录', content: CRMTab },
        ]}
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex">
      <span className="text-sm text-gray-500 w-20 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value || '-'}</span>
    </div>
  );
}

function AttrBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
      {active ? '✓' : '✗'} {label}
    </span>
  );
}

function ScoreBox({ label, score }: { label: string; score: number }) {
  const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : score >= 40 ? 'text-orange-600' : 'text-red-600';
  return (
    <div className="text-center p-3 bg-gray-50 rounded-lg">
      <p className={`text-2xl font-bold ${color}`}>{score}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
