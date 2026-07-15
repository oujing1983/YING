export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    new: '待联系', contacted: '已联系', interested: '有意向',
    quoted: '已报价', negotiating: '洽谈中', won: '已成交', lost: '已放弃',
  };
  return map[status] || status;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    new: 'bg-gray-100 text-gray-700',
    contacted: 'bg-blue-100 text-blue-700',
    interested: 'bg-yellow-100 text-yellow-700',
    quoted: 'bg-purple-100 text-purple-700',
    negotiating: 'bg-orange-100 text-orange-700',
    won: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

export function getScoreColor(level: string): string {
  const map: Record<string, string> = {
    S: 'bg-red-100 text-red-700',
    A: 'bg-orange-100 text-orange-700',
    B: 'bg-yellow-100 text-yellow-700',
    C: 'bg-blue-100 text-blue-700',
    D: 'bg-gray-100 text-gray-500',
  };
  return map[level] || 'bg-gray-100 text-gray-500';
}

export function getContactTypeLabel(type: string): string {
  const map: Record<string, string> = {
    call: '电话', email: '邮件', wechat: '微信',
    visit: '拜访', meeting: '会议', quote_sent: '报价', other: '其他',
  };
  return map[type] || type;
}
