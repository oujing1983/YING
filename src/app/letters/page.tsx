'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { formatDateTime, copyText } from '@/lib/utils';
import { Copy, MessagesSquare, Mail, Phone, FileText, Search, X, ChevronDown, Trash2, Send } from 'lucide-react';
import type { Enterprise } from '@/types';

export default function LettersPage() {
  const { toast } = useToast();
  const [letters, setLetters] = useState<any[]>([]);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [showGenerate, setShowGenerate] = useState(false);
  const [genEnterpriseId, setGenEnterpriseId] = useState(0);
  const [genType, setGenType] = useState('email');
  const [preview, setPreview] = useState<any>(null);
  const [expandLetter, setExpandLetter] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [entSearch, setEntSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Enterprise[]>([]);
  const [searching, setSearching] = useState(false);

  // 动态搜索企业（后端 API 搜索全部数据）
  const doEnterpriseSearch = async (q: string) => {
    if (!q || q.length < 1) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/enterprises?page_size=50&search=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.enterprises || []);
    } catch {}
    setSearching(false);
  };

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
    // 一次查询获取所有开发信 + 企业名称
    const res = await fetch('/api/letters/list');
    const data = await res.json();
    setLetters(data.letters || []);
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

  const [editingLetterId, setEditingLetterId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [sendLetter, setSendLetter] = useState<any>(null);
  const [sendToEmail, setSendToEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleCopy = (text: string) => {
    if (copyText(text)) {
      toast('success', '已复制到剪贴板');
    } else {
      toast('error', '复制失败，请手动复制');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这条开发信吗？')) return;
    try {
      const res = await fetch('/api/letters', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const json = await res.json();
      if (json.success) { toast('success', '已删除'); fetchLetters(); }
      else toast('error', json.error || '删除失败');
    } catch { toast('error', '删除失败'); }
  };

  const handleSend = async () => {
    if (!sendLetter) return;
    setSending(true);
    try {
      const res = await fetch('/api/letters/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letter_id: sendLetter.id, to_email: sendToEmail || undefined }),
      });
      const json = await res.json();
      if (json.success) { toast('success', `已发送至 ${json.to}`); setSendLetter(null); setSendToEmail(''); }
      else toast('error', json.error || '发送失败');
    } catch { toast('error', '发送失败，请确认 SMTP 已配置'); }
    setSending(false);
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
      <Dialog open={showGenerate} onClose={() => { setShowGenerate(false); setEntSearch(''); }} title="生成开发信">
        <div className="space-y-3">
          {/* Searchable Enterprise Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">目标企业</label>
            {genEnterpriseId > 0 ? (
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                <span className="flex-1 text-sm font-medium">
                  {enterprises.find(e => e.id === genEnterpriseId)?.name || '已选择'}
                </span>
                <button onClick={() => { setGenEnterpriseId(0); setEntSearch(''); }} className="text-gray-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="输入关键词搜索全部企业..."
                  value={entSearch}
                  onChange={(e) => { setEntSearch(e.target.value); doEnterpriseSearch(e.target.value); }}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                  autoFocus
                />
                {entSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searching ? (
                      <p className="px-3 py-2 text-sm text-gray-400">搜索中...</p>
                    ) : searchResults.length > 0 ? (
                      searchResults.slice(0, 20).map(e => (
                        <button
                          key={e.id}
                          onClick={() => { setGenEnterpriseId(e.id); setEntSearch(''); setSearchResults([]); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0"
                        >
                          <span className="font-medium">{e.name}</span>
                          <span className="text-gray-400 ml-2 text-xs">{e.industry_category || ''} {e.score_level}级</span>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-sm text-gray-400">未找到匹配企业</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
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
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(l.body)}>
                      <Copy className="w-3 h-3 mr-1" />复制
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setExpandLetter(l)}>
                      展开
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setEditingLetterId(l.id); setEditText(l.body); }}>
                      编辑
                    </Button>
                    {(l.letter_type === 'email' || l.letter_type === 'sms') && (
                      <Button variant="ghost" size="sm" onClick={() => { setSendLetter(l); setSendToEmail(''); }}>
                        <Send className="w-3 h-3 mr-1 text-blue-500" />发送
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(l.id)}>
                      <Trash2 className="w-3 h-3 mr-1 text-red-400" />删除
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
        </div>
      )}

      {/* Expand/Preview Dialog */}
      <Dialog open={!!expandLetter} onClose={() => setExpandLetter(null)} title="开发信详情" maxWidth="max-w-2xl">
        {expandLetter && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{expandLetter.enterprise_name}</span>
              <Badge>{typeLabel[expandLetter.letter_type] || expandLetter.letter_type}</Badge>
            </div>
            {expandLetter.subject && <p className="text-sm font-medium text-gray-700 bg-gray-50 p-2 rounded">{expandLetter.subject}</p>}
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans bg-gray-50 p-3 rounded-lg max-h-96 overflow-y-auto">{expandLetter.body}</pre>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleCopy(expandLetter.body)}><Copy className="w-3 h-3 mr-1" />复制</Button>
              {(expandLetter.letter_type === 'email' || expandLetter.letter_type === 'sms') && (
                <Button variant="outline" size="sm" onClick={() => { setSendLetter(expandLetter); setExpandLetter(null); setSendToEmail(''); }}>
                  <Send className="w-3 h-3 mr-1" />发送
                </Button>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={!!sendLetter} onClose={() => { setSendLetter(null); setSendToEmail(''); }} title="发送邮件">
        {sendLetter && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">收件人邮箱</label>
              <input type="email" placeholder="customer@example.com" value={sendToEmail}
                onChange={(e) => setSendToEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" autoFocus />
              {sendLetter.enterprise_email && (
                <p className="text-xs text-blue-600 mt-1">📧 企业邮箱：{sendLetter.enterprise_email}（留空自动使用此邮箱）</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
              <p className="text-sm bg-gray-50 p-2 rounded">{sendLetter.subject || '(无标题)'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">正文预览</label>
              <pre className="text-xs bg-gray-50 p-2 rounded max-h-32 overflow-y-auto whitespace-pre-wrap font-sans">{sendLetter.body}</pre>
            </div>
            <Button onClick={handleSend} disabled={sending} className="w-full">
              <Send className="w-4 h-4 mr-2" />{sending ? '发送中...' : '确认发送'}
            </Button>
          </div>
        )}
      </Dialog>

      {/* Edit Letter Dialog */}
      <Dialog open={!!editingLetterId} onClose={() => setEditingLetterId(null)} title="编辑开发信" maxWidth="max-w-2xl">
        <div className="space-y-3">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[250px] font-sans"
            rows={12}
          />
          <div className="flex gap-2">
            <Button onClick={() => {
              if (editingLetterId) {
                fetch('/api/letters', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: editingLetterId, body: editText }),
                }).then(r => r.json()).then(j => {
                  if (j.success) { toast('success', '已保存'); fetchLetters(); setEditingLetterId(null); }
                  else toast('error', j.error || '保存失败');
                });
              }
            }} className="flex-1">保存修改</Button>
            <Button variant="outline" onClick={() => setEditingLetterId(null)}>取消</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
