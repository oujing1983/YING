'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { getScoreColor } from '@/lib/utils';
import Link from 'next/link';
import { Plus, Calendar } from 'lucide-react';

interface Enterprise {
  id: number;
  name: string;
  industry_category: string;
  region: string;
  score: number;
  score_level: string;
  status: string;
  contact_person: string;
  contact_phone: string;
}

const PIPELINE_STAGES = [
  { key: 'new', label: '待联系' },
  { key: 'contacted', label: '已联系' },
  { key: 'interested', label: '有意向' },
  { key: 'quoted', label: '已报价' },
  { key: 'negotiating', label: '洽谈中' },
  { key: 'won', label: '已成交' },
  { key: 'lost', label: '已放弃' },
];

export default function CRMPage() {
  const { toast } = useToast();
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formEnterpriseId, setFormEnterpriseId] = useState<number>(0);
  const [form, setForm] = useState({ contact_type: 'call', summary: '', next_action: '', next_action_date: '' });

  const fetchEnterprises = useCallback(async () => {
    const res = await fetch('/api/enterprises?page_size=200');
    const data = await res.json();
    setEnterprises(data.enterprises || []);
  }, []);

  useEffect(() => { fetchEnterprises(); }, [fetchEnterprises]);

  const handleStatusChange = async (id: number, status: string) => {
    await fetch(`/api/crm/status/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchEnterprises();
    toast('success', '状态已更新');
  };

  const handleAddFollowUp = (enterpriseId: number) => {
    setFormEnterpriseId(enterpriseId);
    setForm({ contact_type: 'call', summary: '', next_action: '', next_action_date: '' });
    setShowForm(true);
  };

  const handleSubmitFollowUp = async () => {
    await fetch('/api/crm/follow-ups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, enterprise_id: formEnterpriseId }),
    });
    setShowForm(false);
    toast('success', '跟进记录已添加');
  };

  const enterprisesByStage = (stage: string) => enterprises.filter((e) => e.status === stage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">客户跟进</h1>
          <p className="text-sm text-gray-500 mt-1">销售管道管理</p>
        </div>
        <Link href="/crm/reminders">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            提醒列表
          </Button>
        </Link>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: '1200px' }}>
          {PIPELINE_STAGES.map((stage) => {
            const items = enterprisesByStage(stage.key);
            return (
              <div key={stage.key} className="flex-shrink-0 w-56">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">{stage.label}</h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((e) => (
                    <div key={e.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:border-blue-200 transition-colors group">
                      <Link href={`/enterprises/${e.id}`} className="text-sm font-medium text-blue-600 hover:underline line-clamp-1">
                        {e.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${getScoreColor(e.score_level)}`}>
                          {e.score_level}
                        </span>
                        <span className="text-xs text-gray-500">{e.industry_category}</span>
                      </div>
                      <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleAddFollowUp(e.id)}
                          className="text-xs text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 px-2 py-0.5 rounded"
                          title="添加跟进"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <select
                          value={e.status}
                          onChange={(ev) => handleStatusChange(e.id, ev.target.value)}
                          className="text-xs border-none bg-gray-50 rounded px-1 py-0.5 text-gray-600"
                        >
                          {PIPELINE_STAGES.map((s) => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-lg">
                      暂无
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Follow-up Form Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} title="添加跟进记录">
        <div className="space-y-3">
          <Select
            label="联系类型"
            options={[
              { value: 'call', label: '电话' },
              { value: 'email', label: '邮件' },
              { value: 'wechat', label: '微信' },
              { value: 'visit', label: '拜访' },
              { value: 'meeting', label: '会议' },
              { value: 'quote_sent', label: '报价' },
            ]}
            value={form.contact_type}
            onChange={(e) => setForm({ ...form, contact_type: e.target.value })}
          />
          <Textarea label="内容摘要" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={3} />
          <Input label="下一步计划" value={form.next_action} onChange={(e) => setForm({ ...form, next_action: e.target.value })} />
          <Input label="提醒日期" type="date" value={form.next_action_date} onChange={(e) => setForm({ ...form, next_action_date: e.target.value })} />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSubmitFollowUp}>保存</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>取消</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
