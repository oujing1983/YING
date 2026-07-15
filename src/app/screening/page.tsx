'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/toast';
import { getScoreColor, getStatusLabel, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Brain, Zap, CheckCircle, ExternalLink } from 'lucide-react';
import type { Enterprise } from '@/types';

export default function ScreeningPage() {
  const { toast } = useToast();
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [screening, setScreening] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  const fetchEnterprises = useCallback(async () => {
    const res = await fetch('/api/enterprises?page_size=100&sort_by=created_at&sort_order=desc');
    const data = await res.json();
    setEnterprises(data.enterprises || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEnterprises();
  }, [fetchEnterprises]);

  const toggleSelect = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === enterprises.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(enterprises.map((e) => e.id)));
    }
  };

  const handleScreen = async () => {
    if (selected.size === 0) {
      toast('error', '请选择至少一家企业');
      return;
    }
    setScreening(true);
    setResults(null);
    try {
      const res = await fetch('/api/ai/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (data.error) {
        toast('error', data.error);
      } else {
        setResults(data.results);
        toast('success', `完成 ${data.results.length} 家企业分析`);
        fetchEnterprises();
      }
    } catch {
      toast('error', 'AI 分析请求失败');
    }
    setScreening(false);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI 筛选中心</h1>
          <p className="text-sm text-gray-500 mt-1">
            选择企业，AI 深度分析其包装需求和采购潜力
          </p>
        </div>
        <Button onClick={handleScreen} disabled={screening || selected.size === 0}>
          <Brain className="w-4 h-4 mr-2" />
          {screening ? '分析中...' : `AI 分析 (${selected.size})`}
        </Button>
      </div>

      {screening && (
        <Card>
          <CardContent className="py-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-gray-700 font-medium">AI 正在分析企业...</p>
            <p className="text-sm text-gray-500 mt-1">正在综合评估行业匹配、企业规模、地区便利和采购可能性</p>
            <Progress value={60} label="处理中" className="mt-4 max-w-md mx-auto" />
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">分析结果</h3>
              <div className="flex gap-2">
                {(['S', 'A', 'B', 'C', 'D'] as const).map((level) => {
                  const count = results.filter((r) => r.overall_level === level).length;
                  if (count === 0) return null;
                  return (
                    <span key={level} className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getScoreColor(level)}`}>
                      {level}: {count}
                    </span>
                  );
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((r, i) => {
              const enterprise = enterprises.find((e) => e.id === r.enterprise_id);
              return (
                <div key={i} className="border border-gray-200 rounded-xl p-4 hover:border-blue-200 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Link href={`/enterprises/${r.enterprise_id}`} className="font-medium text-blue-600 hover:underline flex items-center gap-1">
                        {enterprise?.name || `企业 #${r.enterprise_id}`}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">{enterprise?.industry_category} | {enterprise?.region}</p>
                    </div>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${getScoreColor(r.overall_level)}`}>
                      {r.overall_level} · {r.overall_score}分
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <ScoreBar label="行业匹配" score={r.industry_match_score} reason={r.industry_match_reason} />
                    <ScoreBar label="企业规模" score={r.scale_score} reason={r.scale_reason} />
                    <ScoreBar label="地区便利" score={r.region_score} reason={r.region_reason} />
                    <ScoreBar label="采购可能" score={r.purchase_likelihood} reason={r.purchase_likelihood_reason} />
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                    {r.overall_summary}
                  </div>

                  {r.recommended_approach && (
                    <div className="mt-2 flex items-start gap-2 text-sm">
                      <Zap className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{r.recommended_approach}</span>
                    </div>
                  )}

                  {r.packaging_types_needed?.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {r.packaging_types_needed.map((t: string) => (
                        <Badge key={t} variant="info">
                          {t === 'corrugated_box' ? '纸箱' : t === 'bubble_wrap' ? '气泡膜' : t === 'pearl_cotton_bag' ? '珍珠棉袋' : t}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {r.estimated_monthly_demand && (
                    <p className="mt-2 text-xs text-gray-500">
                      预估月需求：{r.estimated_monthly_demand}
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Enterprise selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">选择企业进行 AI 分析</h3>
            <Button variant="ghost" size="sm" onClick={selectAll}>
              {selected.size === enterprises.length ? '取消全选' : '全选'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {enterprises.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              暂无企业数据，请先导入企业
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.size === enterprises.length && enterprises.length > 0}
                        onChange={selectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">企业名称</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">行业</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">地区</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">当前评分</th>
                  </tr>
                </thead>
                <tbody>
                  {enterprises.map((e) => (
                    <tr
                      key={e.id}
                      className={`border-b border-gray-50 cursor-pointer transition-colors ${selected.has(e.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      onClick={() => toggleSelect(e.id)}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(e.id)}
                          onChange={() => toggleSelect(e.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{e.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{e.industry_category || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{e.region || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getScoreColor(e.score_level)}`}>
                          {e.score_level} ({e.score})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ScoreBar({ label, score, reason }: { label: string; score: number; reason: string }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : score >= 40 ? 'bg-orange-500' : 'bg-red-400';
  return (
    <div className="text-center">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-bold text-gray-700">{score}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-1 line-clamp-1" title={reason}>{reason}</p>
    </div>
  );
}
