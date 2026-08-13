import Link from "next/link";
import { ArrowRight, Box, Layers3 } from "lucide-react";
import Container from "@/components/ui/Container";

export default function OnlineTools() {
  return (
    <section className="bg-[#0b1830] py-16 text-white md:py-20">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold text-blue-300">从尺寸开始沟通</p>
            <h2 className="mt-3 max-w-lg text-3xl font-bold tracking-tight md:text-4xl">在线确认结构，再进入人工报价</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 md:text-base">纸箱刀版预览与珍珠棉分层设计集中在一个工作区。在线结果用于结构沟通，正式生产参数由至微包装审核。</p>
            <Link href="/tools" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:scale-[0.98]">进入在线工具 <ArrowRight size={16} /></Link>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
            <div className="bg-[#101f3a] p-7"><Box className="text-blue-300" strokeWidth={1.6} /><h3 className="mt-12 text-xl font-bold">纸箱刀版预览</h3><p className="mt-2 text-sm leading-6 text-slate-400">输入长宽高，查看 0201 理论展开结构与尺寸。</p></div>
            <div className="bg-[#101f3a] p-7"><Layers3 className="text-blue-300" strokeWidth={1.6} /><h3 className="mt-12 text-xl font-bold">珍珠棉分层设计</h3><p className="mt-2 text-sm leading-6 text-slate-400">绘制二维轮廓，同步查看粘合层三维结构。</p></div>
          </div>
        </div>
      </Container>
    </section>
  );
}
