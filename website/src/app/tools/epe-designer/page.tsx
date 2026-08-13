import Link from "next/link";

export const metadata = {
  title: "珍珠棉分层设计 Demo | 至微包装",
  description: "在线绘制珍珠棉二维结构并查看三维分层预览。",
};

export default function EpeDesignerPage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
        <div className="min-w-0">
          <strong className="block truncate text-sm text-slate-900">ZWPACK 珍珠棉分层设计</strong>
          <span className="hidden text-xs text-slate-500 md:inline">几何验证版，生产参数以人工审核为准</span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link href="/contact" className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white">提交询价</Link>
          <Link href="/tools" className="text-xs font-medium text-slate-600 hover:text-blue-600">返回工具栏</Link>
        </div>
      </div>
      <iframe src="/tools/epe-designer/index.html" title="ZWPACK 珍珠棉分层设计器" className="block w-full border-0" style={{ height: "calc(100vh - 56px)" }} />
    </main>
  );
}
