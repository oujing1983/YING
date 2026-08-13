"use client";

import { motion } from "framer-motion";
import { useSite } from "@/components/SiteProvider";
import { Settings, FlaskConical, ShieldCheck, Package, Truck, Headphones } from "lucide-react";
import Container from "@/components/ui/Container";
import SectionTitle from "@/components/ui/SectionTitle";

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
          eyebrow={site.advantagesEyebrow}
          title={site.advantagesTitle}
          description={site.advantagesDesc}
        />
        <div className="grid grid-cols-1 border-t border-slate-300 md:grid-cols-2">
          {advantages.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`group grid grid-cols-[48px_1fr] gap-5 border-b border-slate-300 py-7 md:p-8 ${i % 2 === 0 ? "md:border-r" : ""}`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                  <Icon className="w-6 h-6 text-tech-blue" />
                </div>
                <div><h3 className="mb-2 text-lg font-bold text-navy-500">{item.title}</h3><p className="text-sm leading-6 text-slate-500">{item.desc}</p></div>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
