'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { formatDateTime } from '@/lib/utils';
import { Copy, MessagesSquare, Mail, Phone, FileText, Search, X } from 'lucide-react';
import type { Enterprise } from '@/types';

export default function LettersPage() {
  const { toast } = useToast();
  const [letters, setLetters] = useState<any[]>([]);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [showGenerate, setShowGenerate] = useState(false);
  const [genEnterpriseId, setGenEnterpriseId] = useState(0);
  const [genType, setGenType] = useState('email');
  const [preview, setPreview] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // 搜索过滤
  const filteredLetters = letters.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (l.enterprise_name && l.enterprise_name.toLowerCase().includes(q)) ||
      (l.subject && l.subject.toLowerCase().includes(q)) ||
      (l.body && l.body.toLowerCase().includes(q));
    const matchType = !typeFilter || l.letter_type === typeFilter;
    return matchSearch && matchType;
  });

  const fetchLetters = useCallback(async () => {
    const res = await fetch('/api/enterprises?page_size=200');
    const data = await res.json();
    setEnterprises(data.enterprises || []);

    // Collect all letters from enterprise details
    const allLetters: any[] = [];
    for (const e of data.enterprises || []) {
      try {
        const detail = await fetch(`/api/enterprises/${e.id}`).then((r) => r.json());
        if (detail.letters) {
          allLetters.push(...detail.letters.map((l: any) => ({
            ...l,
            enterprise_name: e.name,
            enterprise_id: e.id,
          })));
        }
      } catch {}
    }
    allLetters.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setLetters(allLetters);
  }, []);

  useEffect(() => { fetchLetters(); }, [fetchLetters]);

  const handleGenerate = async () => {
    if (!genEnterpriseId) { toast('error', '请选择企业'); return; }
    try {
      const res = await fetch('/api/ai/generate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enterprise_id: genEnterpriseId, letter_type: genType }),
      });
      const data = await res.json();
      if (data.error) {
        toast('error', data.error);
      } else {
        setPreview(data);
        toast('success', '开发信已生成');
        fetchLetters();
      }
    } catch {
      toast('error', '生成失败');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast('success', '已复制到剪贴板');
  };

  const typeLabel: Record<string, string> = { email: '邮件', wechat: '微信', phone_script: '电话话术', sms: '短信' };

  function getIcon(letterType: string) {
    switch (letterType) {
      case 'email': return <Mail className="w-4 h-4 text-gray-400" />;
      case 'wechat': return <MessagesSquare className="w-4 h-4 text-gray-400" />;
      case 'phone_script': return <Phone className="w-4 h-4 text-gray-400" />;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">开发信</h1>
          <p className="text-sm text-gray-500 mt-1">AI 生成的个性化开发信</p>
        </div>
        <Button onClick={() => { setShowGenerate(true); setGenEnterpriseId(0); setPreview(null); }}>
          <MessagesSquare className="w-4 h-4 mr-2" />
          生成开发信
        </Button>
      </div>

      {/* Generate Dialog */}
      <Dialog open={showGenerate} onClose={() => setShowGenerate(false)} title="生成开发信">
        <div className="space-y-3">
          <Select
            label="目标企业"
            options={[
              { value: '', label: '— 选择企业 —' },
              ...enterprises.map((e) => ({ value: String(e.id), label: `${e.name} (${e.score_level}级)` })),
            ]}
            value={String(genEnterpriseId)}
            onChange={(e) => setGenEnterpriseId(parseInt(e.target.value))}
          />
          <Select
            label="类型"
            options={[
              { value: 'email', label: '邮件' },
              { value: 'wechat', label: '微信消息' },
              { value: 'phone_script', label: '电话话术' },
              { value: 'sms', label: '短信' },
            ]}
            value={genType}
            onChange={(e) => setGenType(e.target.value)}
          />
          <Button onClick={handleGenerate} disabled={!genEnterpriseId} className="w-full">
            AI 生成
          </Button>

          {preview && (
            <div className="mt-4 space-y-3">
              {preview.subject && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">标题</p>
                  <p className="text-sm font-medium bg-gray-50 p-2 rounded">{preview.subject}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 mb-1">正文</p>
                <pre className="text-sm bg-gray-50 p-3 rounded-lg whitespace-pre-wrap font-sans">{preview.body}</pre>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleCopy(preview.body)}>
                <Copy className="w-3 h-3 mr-1" />复制正文
              </Button>
            </div>
          )}
        </div>
      </Dialog>

      {/* Search Bar */}
      {letters.length > 0 && (
        <Card>
          <CardContent className="py-3">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索企业名称、标题或正文..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-32"
              >
                <option value="">全部类型</option>
                <option value="email">邮件</option>
                <option value="wechat">微信</option>
                <option value="phone_script">电话</option>
                <option value="sms">短信</option>
              </select>
            </div>
            {search && (
              <p className="text-xs text-gray-400 mt-2">
                找到 {filteredLetters.length} / {letters.length} 条结果
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Letters List */}
      {letters.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <MessagesSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无开发信</p>
            <Button variant="outline" className="mt-3" onClick={() => setShowGenerate(true)}>生成第一封</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLetters.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>未找到匹配的开发信</p>
                <p className="text-xs mt-1">试试其他关键词或清除筛选</p>
              </CardContent>
            </Card>
          ) : (
            filteredLetters.map((l) => {
            return (
              <Card key={l.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getIcon(l.letter_type)}
                      <span className="font-medium text-sm">{l.enterprise_name}</span>
                      <Badge>{typeLabel[l.letter_type] || l.letter_type}</Badge>
                    </div>
                    <span className="text-xs text-gray-400">{formatDateTime(l.created_at)}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  {l.subject && <p className="text-sm font-medium text-gray-700 mb-2">{l.subject}</p>}
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans line-clamp-4">{l.body}</pre>
                  <div className="flex gap-2 mt-3">
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(l.body)}>
                      <Copy className="w-3 h-3 mr-1" />复制
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setPreview(l);
                    }}>
                      展开
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
        </div>
      )}
    </div>
  );
}
