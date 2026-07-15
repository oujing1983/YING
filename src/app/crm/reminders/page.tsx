'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { formatDate, getContactTypeLabel } from '@/lib/utils';
import Link from 'next/link';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function RemindersPage() {
  const { toast } = useToast();
  const [reminders, setReminders] = useState<any>(null);

  const fetchReminders = useCallback(async () => {
    const res = await fetch('/api/crm/reminders');
    const data = await res.json();
    setReminders(data);
  }, []);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  const handleComplete = async (id: number) => {
    await fetch(`/api/crm/follow-ups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_completed: true }),
    });
    toast('success', '已标记完成');
    fetchReminders();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/crm" className="p-1 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">提醒列表</h1>
      </div>

      {reminders && (
        <>
          {/* Overdue */}
          {reminders.overdue?.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-red-700">已逾期 ({reminders.overdue.length})</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {reminders.overdue.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <Link href={`/enterprises/${r.enterprise_id}`} className="text-sm font-medium text-blue-600 hover:underline">
                        {r.enterprise_name}
                      </Link>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {getContactTypeLabel(r.contact_type)} · {r.summary || r.next_action}
                      </p>
                      <p className="text-xs text-red-500 mt-1">逾期: {formatDate(r.next_action_date)}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleComplete(r.id)}>
                      <CheckCircle className="w-3 h-3 mr-1" />完成
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Upcoming */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">即将到期 ({reminders.upcoming?.length || 0})</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              {reminders.upcoming?.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">暂无即将到期的提醒</p>
              ) : (
                reminders.upcoming.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Link href={`/enterprises/${r.enterprise_id}`} className="text-sm font-medium text-blue-600 hover:underline">
                        {r.enterprise_name}
                      </Link>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {getContactTypeLabel(r.contact_type)} · {r.summary || r.next_action}
                      </p>
                      <p className="text-xs text-blue-500 mt-1">计划: {formatDate(r.next_action_date)}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleComplete(r.id)}>
                      <CheckCircle className="w-3 h-3 mr-1" />完成
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
