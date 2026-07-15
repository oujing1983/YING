'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileUpload } from '@/components/ui/file-upload';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ColumnDetection {
  sourceColumn: string;
  targetField: string | null;
  confidence: 'high' | 'medium' | 'manual';
}

interface ImportData {
  fileName: string;
  headers: string[];
  totalRows: number;
  columnDetection: ColumnDetection[];
  previewRows: Record<string, string | number>[];
}

const TARGET_FIELDS = [
  { value: '', label: '— 跳过此列 —' },
  { value: 'name', label: '企业名称 *' },
  { value: 'business_scope', label: '经营范围' },
  { value: 'registered_capital', label: '注册资金' },
  { value: 'social_security_count', label: '社保人数' },
  { value: 'region', label: '所在地区' },
  { value: 'industry_category', label: '行业分类' },
  { value: 'industry_subcategory', label: '行业细分' },
  { value: 'contact_phone', label: '联系电话' },
  { value: 'contact_email', label: '邮箱' },
  { value: 'address', label: '地址' },
  { value: 'website', label: '官网' },
  { value: 'employee_count', label: '员工人数' },
  { value: 'annual_revenue', label: '年营业额' },
  { value: 'main_products', label: '主营产品' },
  { value: 'contact_person', label: '联系人' },
  { value: 'contact_position', label: '职位' },
  { value: 'is_ecommerce', label: '是否电商' },
  { value: 'is_export', label: '是否出口' },
];

export default function ImportPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<'upload' | 'mapping' | 'importing' | 'done'>('upload');
  const [importData, setImportData] = useState<ImportData | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<File | null>(null);

  // Step 1: File uploaded
  const handleFile = async (file: File) => {
    fileRef.current = file;
    setProcessing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/import/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) {
        toast('error', data.error);
      } else {
        setImportData(data);
        // Auto-set mapping from detection
        const autoMapping: Record<string, string> = {};
        data.columnDetection.forEach((d: ColumnDetection) => {
          autoMapping[d.sourceColumn] = d.targetField || '';
        });
        setMapping(autoMapping);
        setStep('mapping');
      }
    } catch {
      toast('error', '文件上传失败');
    }
    setProcessing(false);
  };

  // Step 2: Confirm mapping and import
  const handleImport = async () => {
    // Check required field
    const hasName = Object.values(mapping).includes('name');
    if (!hasName) {
      toast('error', '请至少映射"企业名称"字段');
      return;
    }

    if (!fileRef.current) {
      toast('error', '文件已丢失，请重新上传');
      return;
    }

    setStep('importing');
    setProcessing(true);

    try {
      // Re-parse file client-side to get all rows
      const buffer = await fileRef.current.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      const headers = (data[0] as any[]).map((h: any) => String(h || '').trim());
      const rows: Record<string, string | number>[] = [];

      for (let i = 1; i < data.length; i++) {
        const row: Record<string, string | number> = {};
        headers.forEach((header: string, idx: number) => {
          const val = data[i][idx];
          row[header] = val !== undefined && val !== null ? val : '';
        });
        if (Object.values(row).some((v) => v !== '' && v !== 0)) {
          rows.push(row);
        }
      }

      const res = await fetch('/api/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows,
          columnMapping: mapping,
          fileName: importData?.fileName,
        }),
      });
      const json = await res.json();
      setResult(json);
      setStep('done');
      if (json.success) {
        toast('success', `成功导入 ${json.imported} 家企业`);
      } else {
        toast('error', json.error || '导入失败');
      }
    } catch {
      toast('error', '导入请求失败');
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/enterprises" className="p-1 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">导入企业</h1>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6">
        {['upload', 'mapping', 'importing'].map((s, i) => {
          const stepNum = i + 1;
          const isActive = step === s;
          const isDone = (step === 'mapping' && i === 0) || (step === 'importing' && i < 2) || (step === 'done');
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 ${isActive ? 'text-blue-600' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isActive ? 'bg-blue-100 text-blue-600' :
                  isDone ? 'bg-green-100 text-green-600' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {isDone ? <Check className="w-4 h-4" /> : stepNum}
                </div>
                <span className="text-sm font-medium">
                  {i === 0 ? '上传文件' : i === 1 ? '确认映射' : '导入完成'}
                </span>
              </div>
              {i < 2 && <div className="w-8 h-px bg-gray-300" />}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      {step === 'upload' && (
        <Card>
          <CardHeader><h3 className="font-semibold">第一步：上传 Excel 文件</h3></CardHeader>
          <CardContent>
            <FileUpload onFile={handleFile} />
            {processing && (
              <div className="mt-4">
                <Progress value={50} label="解析文件中..." />
              </div>
            )}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>提示：</strong>支持从企查查、天眼查、水滴等平台导出的 Excel 文件。
                系统会自动识别列名并匹配到对应字段。
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'mapping' && importData && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">第二步：确认列映射</h3>
                <span className="text-sm text-gray-500">
                  文件：{importData.fileName} | 共 {importData.totalRows} 行数据
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {importData.columnDetection.map((col) => (
                  <div key={col.sourceColumn} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-48 flex-shrink-0">
                      <span className="text-sm font-medium text-gray-700">{col.sourceColumn}</span>
                      {col.confidence === 'high' && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">
                          <Check className="w-3 h-3 mr-0.5" />自动匹配
                        </span>
                      )}
                      {col.confidence === 'medium' && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700">
                          可能匹配
                        </span>
                      )}
                    </div>
                    <span className="text-gray-300">→</span>
                    <select
                      value={mapping[col.sourceColumn] || ''}
                      onChange={(e) => setMapping((prev) => ({ ...prev, [col.sourceColumn]: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                      {TARGET_FIELDS.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader><h3 className="font-semibold">数据预览（前 5 行）</h3></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {importData.headers.map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                          {h}
                          {mapping[h] && (
                            <span className="ml-1 text-blue-500">→{TARGET_FIELDS.find((f) => f.value === mapping[h])?.label}</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importData.previewRows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        {importData.headers.map((h) => (
                          <td key={h} className="px-3 py-2 whitespace-nowrap text-gray-700">{String(row[h] || '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={handleImport} disabled={processing}>
              {processing ? '导入中...' : `开始导入 ${importData.totalRows} 家企业`}
            </Button>
            <Button variant="outline" onClick={() => setStep('upload')}>返回重选文件</Button>
          </div>
        </>
      )}

      {step === 'importing' && (
        <Card>
          <CardContent className="py-12 text-center">
            <Progress value={80} label="正在导入企业..." />
            <p className="text-sm text-gray-500 mt-4">正在处理数据并进行智能评分...</p>
          </CardContent>
        </Card>
      )}

      {step === 'done' && result && (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">导入完成</h3>
            <div className="flex justify-center gap-8 mt-4">
              <div>
                <p className="text-3xl font-bold text-green-600">{result.imported}</p>
                <p className="text-sm text-gray-500">成功导入</p>
              </div>
              {result.skipped > 0 && (
                <div>
                  <p className="text-3xl font-bold text-yellow-600">{result.skipped}</p>
                  <p className="text-sm text-gray-500">已跳过</p>
                </div>
              )}
              {result.errors > 0 && (
                <div>
                  <p className="text-3xl font-bold text-red-600">{result.errors}</p>
                  <p className="text-sm text-gray-500">导入失败</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-center mt-6">
              <Link href="/enterprises">
                <Button>查看企业列表</Button>
              </Link>
              <Button variant="outline" onClick={() => { setStep('upload'); setImportData(null); setResult(null); }}>
                继续导入
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
