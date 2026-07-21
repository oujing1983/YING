'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { formatDateTime } from '@/lib/utils';
import { Wand2, Edit3, Save, X, Send, Copy, PhoneCall, MessageCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Letter {
  id: number;
  letter_type: string;
  subject: string;
  body: string;
  personalization_notes?: string;
  created_at: string;
}

export function LettersPanel({
  enterpriseId,
  initialLetters,
}: {
  enterpriseId: number;
  initialLetters: Letter[];
}) {
  const { toast } = useToast();
  const [letters, setLetters] = useState<Letter[]>(initialLetters);
  const [generating, setGenerating] = useState(false);
  const [letterType, setLetterType] = useState('email');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enterprise_id: enterpriseId, letter_type: letterType }),
      });
      const json = await res.json();
      if (json.success) {
        setLetters((prev) => [{
          id: json.id,  // 使用数据库真实 ID
          letter_type: letterType,
          subject: json.subject,
          body: json.body,
          personalization_notes: json.personalization_notes,
          created_at: new Date().toISOString(),
        }, ...prev]);
        toast('success', '开发信已生成');
      } else {
        toast('error', json.error || '生成失败');
      }
    } catch {
      toast('error', '请求失败，请确认已配置 AI API Key');
    }
    setGenerating(false);
  };

  const startEdit = (l: Letter) => {
    setEditingId(l.id);
    setEditSubject(l.subject);
    setEditBody(l.body);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditSubject('');
    setEditBody('');
  };

  const saveEdit = async (id: number) => {
    try {
      const res = await fetch('/api/letters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, subject: editSubject, body: editBody }),
      });
      const json = await res.json();
      if (json.success) {
        setLetters((prev) =>
          prev.map((l) => (l.id === id ? { ...l, subject: editSubject, body: editBody } : l))
        );
        cancelEdit();
        toast('success', '已保存');
      } else {
        toast('error', json.error || '保存失败');
      }
    } catch {
      toast('error', '保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这条开发信吗？')) return;
    try {
      const res = await fetch('/api/letters', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.success) {
        setLetters((prev) => prev.filter((l) => l.id !== id));
        toast('success', '已删除');
      } else {
        toast('error', json.error || '删除失败');
      }
    } catch {
      toast('error', '删除失败');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast('success', '已复制到剪贴板');
    });
  };

  const typeLabel: Record<string, string> = {
    email: '邮件',
    wechat: '微信',
    phone_script: '电话话术',
    sms: '短信',
  };

  const typeAction: Record<string, { label: string; icon: React.ReactNode }> = {
    email: { label: '发邮件', icon: <Send className="w-4 h-4" /> },
    wechat: { label: '发微信', icon: <MessageCircle className="w-4 h-4" /> },
    phone_script: { label: '打电话', icon: <PhoneCall className="w-4 h-4" /> },
    sms: { label: '发短信', icon: <Send className="w-4 h-4" /> },
  };

  return (
    <div className="space-y-4">
      {/* Generate new letter */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">生成新的开发信</h3>
          <p className="text-xs text-gray-500">使用 AI 根据企业信息自动生成开发信</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <select
              value={letterType}
              onChange={(e) => setLetterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="email">邮件</option>
              <option value="wechat">微信消息</option>
              <option value="phone_script">电话话术</option>
              <option value="sms">短信</option>
            </select>
            <Button onClick={handleGenerate} disabled={generating}>
              <Wand2 className="w-4 h-4 mr-2" />
              {generating ? 'AI 生成中...' : 'AI 生成开发信'}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            将使用系统设置中的发件人信息（姓名、电话、公司等）
          </p>
        </CardContent>
      </Card>

      {/* Letters list */}
      {letters.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>暂无开发信，点击上方按钮生成</p>
        </div>
      ) : (
        letters.map((l) => (
          <Card key={l.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                {editingId === l.id ? (
                  <input
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm font-medium"
                  />
                ) : (
                  <span className="text-sm font-medium">{l.subject || '(无标题)'}</span>
                )}
                <div className="flex items-center gap-2">
                  <Badge>{typeLabel[l.letter_type] || l.letter_type}</Badge>
                  {editingId === l.id ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => saveEdit(l.id)}>
                        <Save className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={cancelEdit}>
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(l)}>
                        <Edit3 className="w-4 h-4 text-gray-400" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(l.id)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingId === l.id ? (
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[150px] font-sans"
                  rows={8}
                />
              ) : (
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{l.body}</pre>
              )}
              {l.personalization_notes && (
                <p className="text-xs text-blue-600 mt-2">💡 {l.personalization_notes}</p>
              )}
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-400">{formatDateTime(l.created_at)}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(l.body)}>
                    <Copy className="w-4 h-4 mr-1" /> 复制
                  </Button>
                  <Button variant="outline" size="sm">
                    {typeAction[l.letter_type]?.icon}
                    <span className="ml-1">{typeAction[l.letter_type]?.label}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
