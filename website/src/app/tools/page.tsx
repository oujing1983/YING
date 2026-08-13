import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ToolsCarousel from "@/components/tools/ToolsCarousel";

export const metadata = {
  title: "在线包装工具 | 至微包装",
  description: "使用至微包装在线纸箱刀版与珍珠棉分层设计工具，快速完成结构预览与询价沟通。",
};

export default function ToolsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f4f7fb] pb-24 pt-28 md:pt-32">
        <div className="container-wide">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-semibold text-blue-600">ZWPACK 在线工具</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-navy-500 md:text-5xl">先确认结构，再进入生产沟通</h1>
            <p className="mt-5 max-w-[62ch] text-base leading-8 text-slate-600">选择纸箱或珍珠棉工具，在独立工作区中确认尺寸和结构。在线结果用于前期沟通，生产参数仍由人工审核。</p>
          </div>
          <ToolsCarousel />
          <div className="mt-8 grid gap-4 text-sm leading-6 text-slate-600 md:grid-cols-3">
            <p><strong className="block text-slate-900">理论预览</strong>在线结果用于结构沟通，不直接作为生产刀版。</p>
            <p><strong className="block text-slate-900">真实尺寸</strong>几何坐标使用毫米数据，画布缩放不改变实际比例。</p>
            <p><strong className="block text-slate-900">人工确认</strong>材料、设备和工艺补偿由至微包装确认后进入生产。</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
