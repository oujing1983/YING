import Link from "next/link";

export const metadata = {
  title: "在线纸箱刀版预览 | 至微包装",
  description: "输入纸箱长宽高，在线生成 FEFCO 0201 理论展开图并下载 SVG 或 PDF。",
};

export default function CartonDielinePage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
        <div>
          <strong className="text-sm text-slate-900">ZWPACK 在线纸箱刀版预览</strong>
          <span className="ml-3 hidden text-xs text-slate-500 md:inline">理论结构仅供确认，生产尺寸以人工审核为准</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/contact" className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white">提交询价</Link>
          <Link href="/tools" className="text-xs font-medium text-slate-600 hover:text-blue-600">返回工具栏</Link>
        </div>
      </div>
      <iframe
        src="/tools/carton-dieline/index.html"
        title="ZWPACK 纸箱刀版生成器"
        className="block w-full border-0"
        style={{ height: "calc(100vh - 56px)" }}
      />
    </main>
  );
}
