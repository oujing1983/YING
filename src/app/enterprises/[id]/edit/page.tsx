'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditEnterprisePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    fetch(`/api/enterprises/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.enterprise) {
          setForm({
            ...data.enterprise,
            is_export: Boolean(data.enterprise.is_export),
            is_ecommerce: Boolean(data.enterprise.is_ecommerce),
            has_1688: Boolean(data.enterprise.has_1688),
            has_taobao: Boolean(data.enterprise.has_taobao),
            has_jd: Boolean(data.enterprise.has_jd),
            has_pdd: Boolean(data.enterprise.has_pdd),
          });
        }
        setLoading(false);
      });
  }, [params.id]);

  const handleChange = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/enterprises/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast('success', '保存成功');
      router.push(`/enterprises/${params.id}`);
    } else {
      toast('error', '保存失败');
    }
    setSaving(false);
  };

  if (loading) return <div className="text-center py-12 text-gray-500">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/enterprises/${params.id}`} className="p-1 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">编辑企业：{form.name}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><h3 className="font-semibold">基本信息</h3></CardHeader>
          <CardContent className="space-y-4">
            <Input label="企业名称" id="name" value={form.name || ''} onChange={(e) => handleChange('name', e.target.value)} required />
            <Textarea label="经营范围" id="business_scope" value={form.business_scope || ''} onChange={(e) => handleChange('business_scope', e.target.value)} rows={2} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="注册资金(万)" id="registered_capital" value={form.registered_capital || ''} onChange={(e) => handleChange('registered_capital', e.target.value)} />
              <Input label="社保人数" id="social_security_count" type="number" value={form.social_security_count || 0} onChange={(e) => handleChange('social_security_count', parseInt(e.target.value) || 0)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="所在地区" id="region" value={form.region || ''} onChange={(e) => handleChange('region', e.target.value)} />
              <Input label="行业分类" id="industry_category" value={form.industry_category || ''} onChange={(e) => handleChange('industry_category', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="员工人数" id="employee_count" type="number" value={form.employee_count || 0} onChange={(e) => handleChange('employee_count', parseInt(e.target.value) || 0)} />
              <Input label="年营业额" id="annual_revenue" value={form.annual_revenue || ''} onChange={(e) => handleChange('annual_revenue', e.target.value)} />
            </div>
            <Input label="主营产品" id="main_products" value={form.main_products || ''} onChange={(e) => handleChange('main_products', e.target.value)} />
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><h3 className="font-semibold">联系方式</h3></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="联系人" id="contact_person" value={form.contact_person || ''} onChange={(e) => handleChange('contact_person', e.target.value)} />
              <Input label="职位" id="contact_position" value={form.contact_position || ''} onChange={(e) => handleChange('contact_position', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="电话" id="contact_phone" value={form.contact_phone || ''} onChange={(e) => handleChange('contact_phone', e.target.value)} />
              <Input label="邮箱" id="contact_email" value={form.contact_email || ''} onChange={(e) => handleChange('contact_email', e.target.value)} />
            </div>
            <Input label="地址" id="address" value={form.address || ''} onChange={(e) => handleChange('address', e.target.value)} />
            <Input label="官网" id="website" value={form.website || ''} onChange={(e) => handleChange('website', e.target.value)} />
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><h3 className="font-semibold">业务属性</h3></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'is_export', label: '出口企业' },
                { key: 'is_ecommerce', label: '电商企业' },
                { key: 'has_1688', label: '1688店铺' },
                { key: 'has_taobao', label: '淘宝/天猫' },
                { key: 'has_jd', label: '京东' },
                { key: 'has_pdd', label: '拼多多' },
              ].map((attr) => (
                <label key={attr.key} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[attr.key] || false}
                    onChange={(e) => handleChange(attr.key, e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">{attr.label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><h3 className="font-semibold">跟进状态</h3></CardHeader>
          <CardContent>
            <Select
              label="客户状态"
              id="status_select"
              options={[
                { value: 'new', label: '待联系' },
                { value: 'contacted', label: '已联系' },
                { value: 'interested', label: '有意向' },
                { value: 'quoted', label: '已报价' },
                { value: 'negotiating', label: '洽谈中' },
                { value: 'won', label: '已成交' },
                { value: 'lost', label: '已放弃' },
              ]}
              value={form.status || 'new'}
              onChange={(e) => handleChange('status', e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 mt-6">
          <Button type="submit" disabled={saving}>
            {saving ? '保存中...' : '保存修改'}
          </Button>
          <Link href={`/enterprises/${params.id}`}>
            <Button type="button" variant="outline">取消</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
