"use client";

import { motion } from "framer-motion";
import { useSite } from "@/components/SiteProvider";
import { Settings, FlaskConical, ShieldCheck, Package, Truck, Headphones, ArrowRight, Ruler } from "lucide-react";
import Container from "@/components/ui/Container";
import SectionTitle from "@/components/ui/SectionTitle";
import Link from "next/link";

const advantages = [
  { icon: Settings, title: "定制生产", desc: "按需定制规格、材质、印刷，灵活满足各种需求。" },
  { icon: FlaskConical, title: "快速打样", desc: "高效打样流程，48小时内出样，加速确认周期。" },
  { icon: ShieldCheck, title: "品质稳定", desc: "严格品控体系，从原材料到成品全程把控质量。" },
  { icon: Package, title: "小批量支持", desc: "单规格100平方起订，满足中小订单需求。" },
  { icon: Truck, title: "快速交货", desc: "常规订单约6天交付，加急订单可协商。支持长期复购。" },
  { icon: Headphones, title: "售后服务", desc: "专业售后团队，及时响应，解决产品使用中的问题。" },
];

export default function Advantages() {
  const site = useSite();
  return (
    <section id="advantages" className="section-padding bg-surface">
      <Container>
        <SectionTitle
          eyebrow={site.advantagesEyebrow || "为什么选择我们"}
          title={site.advantagesTitle || "从包装效果到采购成本，都帮你算清楚"}
          description={site.advantagesDesc || "不只报价单个产品，而是结合产品尺寸、运输距离、产品重量、破损风险、采购批量，给出更合适的包装组合。"}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {advantages.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="group p-6 md:p-8 rounded-2xl bg-white border border-gray-100 hover:border-tech-blue/20 hover:shadow-lg hover:shadow-tech-blue/5 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-tech-blue/5 flex items-center justify-center mb-5 group-hover:bg-tech-blue/10 transition-colors">
                  <Icon className="w-6 h-6 text-tech-blue" />
                </div>
                <h3 className="text-lg font-bold text-navy-500 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
        <div className="mt-8 flex flex-col gap-6 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white"><Ruler size={24} /></div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">ZWPACK 在线工具</span>
              <h3 className="mt-1 text-xl font-bold text-navy-500">在线纸箱刀版预览</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">输入纸箱长、宽、高，生成 FEFCO 0201 理论展开图并下载 SVG 或 PDF。生成结果用于结构预览和询价，正式生产尺寸由至微包装人工确认。</p>
            </div>
          </div>
          <Link href="/tools/carton-dieline" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">打开刀版工具 <ArrowRight size={16} /></Link>
        </div>
      </Container>
    </section>
  );
}
