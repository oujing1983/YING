import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDb } from '@/lib/db';
import { runMigrations } from '@/lib/db-migrate';
import { formatDate, getStatusLabel, getStatusColor, getScoreColor } from '@/lib/utils';
import Link from 'next/link';
import { TrendingUp, Users, Target, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  runMigrations();
  const db = getDb();

  // Stats
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as new_week,
      SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
      SUM(CASE WHEN status IN ('interested', 'quoted', 'negotiating') THEN 1 ELSE 0 END) as interested,
      SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won
    FROM enterprises
  `).get() as any;

  // Recent enterprises
  const recent = db.prepare(
    'SELECT * FROM enterprises ORDER BY created_at DESC LIMIT 10'
  ).all() as any[];

  // Reminders
  const reminders = db.prepare(`
    SELECT fr.*, e.name as enterprise_name FROM follow_up_records fr
    JOIN enterprises e ON fr.enterprise_id = e.id
    WHERE fr.is_completed = 0 AND fr.next_action_date IS NOT NULL
    ORDER BY fr.next_action_date ASC
    LIMIT 5
  `).all() as any[];

  const statCards = [
    { label: '企业总数', value: stats?.total || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '本周新增', value: stats?.new_week || 0, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: '意向客户', value: stats?.interested || 0, icon: Target, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: '已成交', value: stats?.won || 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">销售看板</h1>
          <p className="text-sm text-gray-500 mt-1">AI 获客系统概览</p>
        </div>
        <Link href="/enterprises/import">
          <Button>
            <TrendingUp className="w-4 h-4 mr-2" />
            导入企业
          </Button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className={`p-3 rounded-xl ${s.bg}`}>
                  <Icon className={`w-6 h-6 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Enterprises */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">近期新增企业</h2>
                <Link href="/enterprises" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  查看全部 <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recent.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>暂无企业数据</p>
                  <Link href="/enterprises/import" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                    导入第一批企业
                  </Link>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">企业名称</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">行业</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">评分</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">状态</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((e) => (
                      <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <Link href={`/enterprises/${e.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                            {e.name}
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">{e.industry_category || '-'}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getScoreColor(e.score_level)}`}>
                            {e.score_level}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(e.status)}`}>
                            {getStatusLabel(e.status)}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500">{formatDate(e.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reminders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">待办提醒</h2>
              <Link href="/crm/reminders" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                全部 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {reminders.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-300" />
                暂无待办事项
              </div>
            ) : (
              <div className="space-y-3">
                {reminders.map((r, i) => {
                  const isOverdue = new Date(r.next_action_date) < new Date();
                  return (
                    <div key={i} className={`p-3 rounded-lg ${isOverdue ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
                      <div className="flex items-start gap-2">
                        <AlertCircle className={`w-4 h-4 mt-0.5 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{r.enterprise_name}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{r.next_action || r.summary}</p>
                          <p className={`text-xs mt-1 ${isOverdue ? 'text-red-600' : 'text-gray-400'}`}>
                            {isOverdue ? '已逾期: ' : ''}{formatDate(r.next_action_date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
