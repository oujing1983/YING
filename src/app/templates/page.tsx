'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { copyText } from '@/lib/utils';
import { Copy, FileText, Plus, Edit3, Save, X } from 'lucide-react';

export default function TemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'email', subject_template: '', body_template: '', category: 'general' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTpl, setEditingTpl] = useState<any>(null);

  const fetchTemplates = useCallback(async () => {
    const res = await fetch('/api/templates');
    const data = await res.json();
    setTemplates(data.templates || []);
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleSave = async () => {
    await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    toast('success', '模板已保存');
    setShowForm(false);
    fetchTemplates();
  };

  const typeLabel: Record<string, string> = { email: '邮件', wechat: '微信', phone_script: '电话话术', sms: '短信' };
  const catLabel: Record<string, string> = { general: '通用', cold_outreach: '冷启动', follow_up: '跟进', quote: '报价', thank_you: '感谢' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">模板管理</h1>
          <p className="text-sm text-gray-500 mt-1">{'开发信模板，支持 {{变量}} 占位符'}</p>
        </div>
        <Button onClick={() => { setForm({ name: '', type: 'email', subject_template: '', body_template: '', category: 'general' }); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          新建模板
        </Button>
      </div>

      <div className="space-y-3">
        {templates.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{t.name}</span>
                  <Badge variant="info">{typeLabel[t.type] || t.type}</Badge>
                  <Badge>{catLabel[t.category] || t.category}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {t.subject_template && (
                <p className="text-sm font-medium text-gray-700 mb-1">标题：{t.subject_template}</p>
              )}
              <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans bg-gray-50 p-3 rounded-lg line-clamp-3">{t.body_template}</pre>
              <div className="flex gap-2 mt-2">
                <Button variant="ghost" size="sm" onClick={() => { copyText(t.body_template); toast('success', '已复制'); }}>
                  <Copy className="w-3 h-3 mr-1" />复制
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setEditingId(t.id); setEditingTpl({ ...t }); }}>
                  <Edit3 className="w-3 h-3 mr-1" />编辑
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {templates.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              暂无模板，点击新建模板创建
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={!!editingId} onClose={() => { setEditingId(null); setEditingTpl(null); }} title="编辑模板" maxWidth="max-w-2xl">
        {editingTpl && (
          <div className="space-y-3">
            <Input label="模板名称" value={editingTpl.name} onChange={(e) => setEditingTpl({ ...editingTpl, name: e.target.value })} />
            <Input label="标题模板" value={editingTpl.subject_template} onChange={(e) => setEditingTpl({ ...editingTpl, subject_template: e.target.value })} />
            <Textarea label="正文模板" value={editingTpl.body_template} onChange={(e) => setEditingTpl({ ...editingTpl, body_template: e.target.value })} rows={10} />
            <Button onClick={async () => {
              await fetch('/api/templates', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingTpl),
              });
              toast('success', '已保存');
              setEditingId(null);
              fetchTemplates();
            }} className="w-full">保存修改</Button>
          </div>
        )}
      </Dialog>

      {/* New Template Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} title="新建模板" maxWidth="max-w-2xl">
        <div className="space-y-3">
          <Input label="模板名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select
            label="类型"
            options={[
              { value: 'email', label: '邮件' },
              { value: 'wechat', label: '微信消息' },
              { value: 'phone_script', label: '电话话术' },
              { value: 'sms', label: '短信' },
            ]}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
          <Select
            label="分类"
            options={[
              { value: 'general', label: '通用' },
              { value: 'cold_outreach', label: '冷启动' },
              { value: 'follow_up', label: '跟进' },
              { value: 'quote', label: '报价' },
              { value: 'thank_you', label: '感谢' },
            ]}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <Input label="标题模板" value={form.subject_template} onChange={(e) => setForm({ ...form, subject_template: e.target.value })}
            placeholder="如：{{company_name}} 您好，关于包装供应合作" />
          <Textarea label="正文模板" value={form.body_template} onChange={(e) => setForm({ ...form, body_template: e.target.value })} rows={8}
            placeholder={'支持变量：{{company_name}} {{industry}} {{contact_person}} {{sender_name}} {{sender_phone}} {{sender_wechat}}'} />
          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
            可用变量：{`{{company_name}} {{industry}} {{contact_person}} {{region}} {{sender_name}} {{sender_phone}} {{sender_wechat}} {{sender_company}}`}
          </div>
          <Button onClick={handleSave} className="w-full">保存模板</Button>
        </div>
      </Dialog>
    </div>
  );
}
