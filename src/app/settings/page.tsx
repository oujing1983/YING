'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Save, Key, Settings2, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    llm_api_url: '',
    llm_api_key: '',
    llm_model: 'deepseek-chat',
    llm_temperature: '0.3',
    sender_name: '张经理',
    sender_phone: '13800000000',
    sender_wechat: 'zhang_packing',
    sender_company: '浙江XX包装有限公司',
    factory_city: '杭州',
    factory_province: '浙江省',
  });

  // 页面加载时读取已有设置
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          const s = data.settings;
          try {
            const llm = s.llm_config ? JSON.parse(s.llm_config) : {};
            const sender = s.sender_info ? JSON.parse(s.sender_info) : {};
            const factory = s.factory_location ? JSON.parse(s.factory_location) : {};
            setForm((prev) => ({
              llm_api_url: llm.apiUrl || prev.llm_api_url,
              llm_api_key: llm.apiKey || prev.llm_api_key,
              llm_model: llm.model || prev.llm_model,
              llm_temperature: String(llm.temperature ?? prev.llm_temperature),
              sender_name: sender.name || prev.sender_name,
              sender_phone: sender.phone || prev.sender_phone,
              sender_wechat: sender.wechat || prev.sender_wechat,
              sender_company: sender.company || prev.sender_company,
              factory_city: factory.city || prev.factory_city,
              factory_province: factory.province || prev.factory_province,
            }));
          } catch { /* ignore parse errors */ }
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            llm_config: JSON.stringify({
              apiUrl: form.llm_api_url,
              apiKey: form.llm_api_key,
              model: form.llm_model,
              temperature: parseFloat(form.llm_temperature) || 0.3,
            }),
            sender_info: JSON.stringify({
              name: form.sender_name,
              phone: form.sender_phone,
              wechat: form.sender_wechat,
              company: form.sender_company,
            }),
            factory_location: JSON.stringify({
              city: form.factory_city,
              province: form.factory_province,
            }),
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast('success', '设置已保存');
      } else {
        toast('error', json.error || '保存失败');
      }
    } catch {
      toast('error', '网络请求失败，请检查服务器连接');
    }
    setSaving(false);
  };

  const [clearing, setClearing] = useState(false);
  const handleClearData = async () => {
    if (!confirm('⚠️ 此操作将清空所有企业数据、跟进记录、开发信和导入日志，不可恢复！\n\n请确认要清空全部数据？')) return;
    if (!confirm('再次确认：输入 "确认清空" 以继续')) return;
    setClearing(true);
    try {
      const res = await fetch('/api/enterprises/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_enterprises' }),
      });
      const json = await res.json();
      if (json.success) {
        toast('success', `已清空 ${json.deleted} 条企业数据`);
      } else {
        toast('error', json.error || '清空失败');
      }
    } catch {
      toast('error', '清空请求失败');
    }
    setClearing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
          <p className="text-sm text-gray-500 mt-1">配置 AI 模型和发件人信息</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? '保存中...' : '保存设置'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold">AI 模型配置</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="API 地址"
            value={form.llm_api_url}
            onChange={(e) => setForm({ ...form, llm_api_url: e.target.value })}
            placeholder="https://api.deepseek.com/v1"
          />
          <Input
            label="API Key"
            type="password"
            value={form.llm_api_key}
            onChange={(e) => setForm({ ...form, llm_api_key: e.target.value })}
            placeholder="sk-..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="模型名称"
              value={form.llm_model}
              onChange={(e) => setForm({ ...form, llm_model: e.target.value })}
              placeholder="deepseek-chat"
            />
            <Input
              label="温度参数 (0-2)"
              value={form.llm_temperature}
              onChange={(e) => setForm({ ...form, llm_temperature: e.target.value })}
              placeholder="0.3"
            />
          </div>
          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
            支持所有 OpenAI 兼容 API：DeepSeek、OpenAI、智谱、通义千问等。<br />
            需要 AI 筛选和开发信生成功能时需要配置 API Key。
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold">发件人信息</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="姓名" value={form.sender_name} onChange={(e) => setForm({ ...form, sender_name: e.target.value })} />
            <Input label="电话" value={form.sender_phone} onChange={(e) => setForm({ ...form, sender_phone: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="微信" value={form.sender_wechat} onChange={(e) => setForm({ ...form, sender_wechat: e.target.value })} />
            <Input label="公司" value={form.sender_company} onChange={(e) => setForm({ ...form, sender_company: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-semibold">工厂信息</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="省份" value={form.factory_province} onChange={(e) => setForm({ ...form, factory_province: e.target.value })} />
            <Input label="城市" value={form.factory_city} onChange={(e) => setForm({ ...form, factory_city: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-red-600">危险操作</h3>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            清空所有企业数据、跟进记录、开发信和导入日志。此操作不可恢复，请在操作前备份数据。
          </p>
          <Button variant="danger" onClick={handleClearData} disabled={clearing}>
            <AlertTriangle className="w-4 h-4 mr-2" />
            {clearing ? '清空中...' : '清空所有企业数据'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
