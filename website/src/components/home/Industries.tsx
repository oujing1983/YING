"use client";

import { motion } from "framer-motion";
import { useSite } from "@/components/SiteProvider";
import { ShoppingCart, Car, Tv, Stethoscope, Leaf, Smartphone } from "lucide-react";
import Container from "@/components/ui/Container";
import SectionTitle from "@/components/ui/SectionTitle";

const industries = [
  { icon: ShoppingCart, name: "电商", desc: "快递发货、仓储包装" },
  { icon: Car, name: "汽车", desc: "零部件防护包装" },
  { icon: Tv, name: "家电", desc: "产品运输缓冲包装" },
  { icon: Stethoscope, name: "医疗", desc: "医疗器械精密包装" },
  { icon: Leaf, name: "新能源", desc: "电池组件包装" },
  { icon: Smartphone, name: "电子产品", desc: "消费电子内托包装" },
];

export default function Industries() {
  const site = useSite();
  return (
    <section id="industries" className="section-padding bg-surface">
      <Container>
        <SectionTitle
          eyebrow={site.industriesEyebrow || "服务行业"}
          title={site.industriesTitle || "覆盖多个行业领域"}
          description={site.industriesDesc || "我们的包装产品广泛应用于多个行业，为不同领域提供专业的包装解决方案。"}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {industries.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="group p-6 md:p-8 rounded-2xl bg-white border border-gray-100 hover:border-tech-blue/20 hover:shadow-lg transition-all duration-300 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-tech-blue/5 flex items-center justify-center mx-auto mb-4 group-hover:bg-tech-blue/10 transition-colors">
                  <Icon className="w-6 h-6 text-tech-blue" />
                </div>
                <h3 className="text-sm font-bold text-navy-500 mb-1">{item.name}</h3>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
