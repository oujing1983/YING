'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { getStatusLabel, getStatusColor, getScoreColor, formatDate } from '@/lib/utils';
import { Plus, Upload, ChevronLeft, ChevronRight, Trash2, CheckSquare, Square } from 'lucide-react';
import type { Enterprise, EnterpriseListResponse } from '@/types';

export default function EnterpriseListPage() {
  const [data, setData] = useState<EnterpriseListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('page_size', '20');
    if (search) params.set('search', search);
    if (scoreFilter) params.set('score_level', scoreFilter);
    if (statusFilter) params.set('status', statusFilter);

    const res = await fetch(`/api/enterprises?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [page, search, scoreFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该企业？')) return;
    await fetch(`/api/enterprises/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!data) return;
    const currentIds = data.enterprises.map((e: Enterprise) => e.id);
    if (selectedIds.size === currentIds.length && currentIds.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentIds));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定删除选中的 ${selectedIds.size} 家企业吗？此操作不可恢复。`)) return;

    const ids = Array.from(selectedIds);
    const res = await fetch('/api/enterprises', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    const json = await res.json();
    if (json.success) {
      setSelectedIds(new Set());
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">企业数据库</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data ? `共 ${data.total} 家企业` : '加载中...'}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button variant="danger" onClick={handleBatchDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              删除选中 ({selectedIds.size})
            </Button>
          )}
          <Link href="/enterprises/import">
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              导入
            </Button>
          </Link>
          <Link href="/enterprises/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              添加企业
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="搜索企业名称、经营范围..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); setSelectedIds(new Set()); }}
              />
            </div>
            <Select
              options={[
                { value: '', label: '全部评分' },
                { value: 'S', label: 'S 级' },
                { value: 'A', label: 'A 级' },
                { value: 'B', label: 'B 级' },
                { value: 'C', label: 'C 级' },
                { value: 'D', label: 'D 级' },
              ]}
              value={scoreFilter}
              onChange={(e) => { setScoreFilter(e.target.value); setPage(1); setSelectedIds(new Set()); }}
              className="w-[140px]"
            />
            <Select
              options={[
                { value: '', label: '全部状态' },
                { value: 'new', label: '待联系' },
                { value: 'contacted', label: '已联系' },
                { value: 'interested', label: '有意向' },
                { value: 'quoted', label: '已报价' },
                { value: 'negotiating', label: '洽谈中' },
                { value: 'won', label: '已成交' },
                { value: 'lost', label: '已放弃' },
              ]}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); setSelectedIds(new Set()); }}
              className="w-[140px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="px-6 py-12 text-center text-gray-500">加载中...</div>
          ) : !data || data.enterprises.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <p className="mb-4">暂无企业数据</p>
              <Link href="/enterprises/import">
                <Button variant="outline">导入第一批企业</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-3 py-3 w-10">
                        <button onClick={toggleSelectAll} className="text-gray-400 hover:text-blue-600">
                          {selectedIds.size > 0 && data && selectedIds.size === data.enterprises.length
                            ? <CheckSquare className="w-4 h-4 text-blue-600" />
                            : <Square className="w-4 h-4" />
                          }
                        </button>
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">企业名称</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">行业</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">地区</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">评分</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">状态</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">日期</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.enterprises.map((e: Enterprise) => (
                      <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-3">
                          <button onClick={() => toggleSelect(e.id)} className="text-gray-400 hover:text-blue-600">
                            {selectedIds.has(e.id)
                              ? <CheckSquare className="w-4 h-4 text-blue-600" />
                              : <Square className="w-4 h-4" />
                            }
                          </button>
                        </td>
                        <td className="px-6 py-3">
                          <Link href={`/enterprises/${e.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                            {e.name}
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">{e.industry_category || '-'}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{e.region || '-'}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getScoreColor(e.score_level)}`}>
                            {e.score_level} ({e.score})
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(e.status)}`}>
                            {getStatusLabel(e.status)}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500">{formatDate(e.created_at)}</td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/enterprises/${e.id}`}>
                              <Button variant="ghost" size="sm">详情</Button>
                            </Link>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(e.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data.total_pages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    第 {data.page} / {data.total_pages} 页
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.total_pages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
