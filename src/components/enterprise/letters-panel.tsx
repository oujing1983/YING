'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { formatDateTime } from '@/lib/utils';
import { Wand2, Edit3, Save, X, Send, Copy, PhoneCall, MessageCircle, Trash2, Mail } from 'lucide-react';

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
  enterpriseEmail,
  enterprisePhone,
}: {
  enterpriseId: number;
  initialLetters: Letter[];
  enterpriseEmail?: string;
  enterprisePhone?: string;
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

  // Send email
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendLetter, setSendLetter] = useState<Letter | null>(null);
  const [sendToEmail, setSendToEmail] = useState('');

  const handleSendEmail = async () => {
    if (!sendLetter) return;
    setSendingId(sendLetter.id);
    try {
      const res = await fetch('/api/letters/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letter_id: sendLetter.id, to_email: sendToEmail || undefined }),
      });
      const json = await res.json();
      if (json.success) {
        toast('success', `邮件已发送至 ${json.to}`);
        setShowSendDialog(false);
        setSendLetter(null);
        setSendToEmail('');
      } else {
        toast('error', json.error || '发送失败');
      }
    } catch {
      toast('error', '发送失败，请检查 SMTP 配置');
    }
    setSendingId(null);
  };

  const openSendDialog = (l: Letter) => {
    setSendLetter(l);
    setSendToEmail(enterpriseEmail || '');
    setShowSendDialog(true);
  };

  // WeChat: format and copy
  const handleWechatSend = (l: Letter) => {
    const wechatMsg = l.body
      .replace(/尊敬的|您好|此致|敬礼/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    navigator.clipboard.writeText(wechatMsg).then(() => {
      toast('success', '微信消息已复制，打开微信粘贴即可发送');
    });
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
                  {l.letter_type === 'email' || l.letter_type === 'sms' ? (
                    <Button variant="outline" size="sm" onClick={() => openSendDialog(l)}>
                      <Mail className="w-4 h-4 mr-1" /> 发邮件
                    </Button>
                  ) : l.letter_type === 'wechat' ? (
                    <Button variant="outline" size="sm" onClick={() => handleWechatSend(l)}>
                      <MessageCircle className="w-4 h-4 mr-1" /> 复制到微信
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(l.body)}>
                      <PhoneCall className="w-4 h-4 mr-1" /> 复制话术
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Send Email Dialog */}
      <Dialog open={showSendDialog} onClose={() => { setShowSendDialog(false); setSendLetter(null); }} title="发送邮件">
        {sendLetter && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择收件方式</label>
              {enterpriseEmail ? (
                <div className="space-y-2">
                  <button
                    onClick={() => setSendToEmail(sendToEmail === enterpriseEmail ? '' : enterpriseEmail)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${sendToEmail === enterpriseEmail ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium break-all">{enterpriseEmail}</span>
                      <span className="text-xs text-green-600 ml-auto flex-shrink-0">{sendToEmail === enterpriseEmail ? '✓ 已选' : '点击选择'}</span>
                    </div>
                  </button>
                  {enterprisePhone && <p className="text-xs text-gray-500">📞 电话：{enterprisePhone}</p>}
                  <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div><div className="relative flex justify-center"><span className="bg-white px-2 text-xs text-gray-400">或手动输入</span></div></div>
                </div>
              ) : (
                <p className="text-xs text-orange-600 mb-2">⚠️ 该企业未登记邮箱，请手动输入或使用其他方式联系</p>
              )}
              <input type="email" placeholder="customer@example.com" value={sendToEmail}
                onChange={(e) => setSendToEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮件标题</label>
              <p className="text-sm bg-gray-50 p-2 rounded">{sendLetter.subject || '(无标题)'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮件正文预览</label>
              <pre className="text-xs bg-gray-50 p-2 rounded max-h-32 overflow-y-auto whitespace-pre-wrap font-sans">{sendLetter.body}</pre>
            </div>
            <Button onClick={handleSendEmail} disabled={sendingId === sendLetter.id} className="w-full">
              <Send className="w-4 h-4 mr-2" />
              {sendingId === sendLetter.id ? '发送中...' : '发送邮件'}
            </Button>
          </div>
        )}
      </Dialog>
    </div>
  );
}
