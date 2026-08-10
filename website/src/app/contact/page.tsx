import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Contact from "@/components/home/Contact";

export const metadata: Metadata = {
  title: "联系我们 | 至微包装",
  description: "至微包装有限公司联系方式：电话18005770078，微信13868685802，邮箱309985325@qq.com，地址浙江省温州市乐清市石帆街道振霞路二弄3号。",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="pt-24">
        <section className="bg-navy-500 py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <span className="inline-block text-xs font-semibold text-tech-light uppercase tracking-[0.2em] mb-4">联系我们</span>
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">获取报价</h1>
              <p className="mt-4 text-lg text-white/60">告诉我们你的包装需求，我们会尽快与你联系。</p>
            </div>
          </div>
        </section>
        <Contact />
      </main>
      <Footer />
    </>
  );
}
