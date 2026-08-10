"use client";

import { motion } from "framer-motion";
import { useSite } from "@/components/SiteProvider";
import { MessageSquare, PenTool, FlaskConical, Factory } from "lucide-react";
import Container from "@/components/ui/Container";
import SectionTitle from "@/components/ui/SectionTitle";

const steps = [
  { icon: MessageSquare, title: "咨询", desc: "提交产品需求，我们提供专业建议和初步报价。", step: "01" },
  { icon: PenTool, title: "确认方案", desc: "确认规格、材质、印刷方案，签订合同。", step: "02" },
  { icon: FlaskConical, title: "打样", desc: "制作样品，确认尺寸、防护效果和外观。", step: "03" },
  { icon: Factory, title: "生产", desc: "批量生产，品质检验，按时发货。", step: "04" },
];

export default function Process() {
  const site = useSite();
  return (
    <section id="process" className="section-padding bg-white overflow-hidden">
      <Container>
        <SectionTitle
          eyebrow={site.processEyebrow}
          title={site.processTitle}
          description={site.processDesc}
        />
        <div className="relative">
          {/* Timeline line (desktop) */}
          <div className="hidden lg:block absolute top-24 left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-0.5 bg-gray-100" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="relative text-center lg:text-left"
                >
                  {/* Step number */}
                  <div className="lg:mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-tech-blue text-white font-bold text-sm lg:mx-0 mx-auto">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-navy-500 mt-4 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
