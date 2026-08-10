import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Container from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "关于我们 | 至微包装",
  description: "至微包装有限公司位于浙江乐清，专业生产纸箱、气泡袋、珍珠棉袋、珍珠棉异形件等包装产品。",
};

export default function About() {
  return (
    <>
      <Header />
      <main className="pt-24">
        {/* Hero */}
        <section className="bg-navy-500 py-20 md:py-28">
          <Container>
            <div className="max-w-2xl">
              <span className="inline-block text-xs font-semibold text-tech-light uppercase tracking-[0.2em] mb-4">关于我们</span>
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">至微包装有限公司</h1>
              <p className="mt-4 text-lg text-white/60">专业包装定制 · 品质值得信赖</p>
            </div>
          </Container>
        </section>

        {/* Intro */}
        <section className="section-padding">
          <Container>
            <div className="max-w-3xl">
              <h2 className="text-2xl md:text-3xl font-bold text-navy-500 mb-6">公司简介</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>至微包装有限公司座落于浙江省温州市乐清市石帆街道振霞路二弄3号，是一家专业从事包装制品生产和销售的企业。</p>
                <p>公司主营纸箱、气泡袋、珍珠棉袋、珍珠棉异形件等包装产品，规格按需定制，单规格100平方起订，交期约6天，支持定制印刷。</p>
                <p>我们致力于为客户提供从包装方案设计到产品交付的一站式服务，结合产品尺寸、运输距离、产品重量、破损风险、采购批量等因素，给出更合适的包装组合方案。</p>
              </div>
            </div>
          </Container>
        </section>

        {/* Values */}
        <section className="section-padding bg-surface">
          <Container>
            <h2 className="text-2xl md:text-3xl font-bold text-navy-500 mb-10 text-center">企业文化</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "使命", desc: "为客户提供高品质、高性价比的包装解决方案" },
                { title: "愿景", desc: "成为华东地区领先的包装制品供应商" },
                { title: "价值观", desc: "诚信经营、品质为本、客户至上、持续创新" },
              ].map((item) => (
                <div key={item.title} className="text-center p-8 rounded-2xl bg-white border border-gray-100">
                  <div className="w-14 h-14 rounded-full bg-tech-blue/5 flex items-center justify-center mx-auto mb-4">
                    <span className="text-tech-blue font-bold text-sm">{item.title[0]}</span>
                  </div>
                  <h3 className="text-lg font-bold text-navy-500 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
