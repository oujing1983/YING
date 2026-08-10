"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MessageCircle, MapPin } from "lucide-react";
import Container from "@/components/ui/Container";
import SectionTitle from "@/components/ui/SectionTitle";
import { useSite } from "@/components/SiteProvider";

export default function Contact() {
  const site = useSite();
  const [contactData, setContactData] = useState<any>({});
  useEffect(() => {
    fetch('/api/public/contact').then(r => r.json()).then(d => { if (d) setContactData(d) }).catch(() => {});
  }, []);

  const contactInfo = [
    { icon: Phone, label: "联系电话", value: contactData.csPhone || contactData.phone || "18005770078", href: `tel:${contactData.csPhone || contactData.phone || "18005770078"}` },
    { icon: MessageCircle, label: "微信", value: contactData.wechat || "13868685802" },
    { icon: Mail, label: "邮箱", value: contactData.email || "309985325@qq.com", href: `mailto:${contactData.email || "309985325@qq.com"}` },
    { icon: MapPin, label: "地址", value: contactData.address || "浙江省温州市乐清市石帆街道振霞路二弄3号" },
  ];

  const [formData, setFormData] = useState({ name: "", phone: "", company: "", product: "", message: "" });
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("正在提交...");
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setStatus(data.message);
      if (data.ok) setFormData({ name: "", phone: "", company: "", product: "", message: "" });
    } catch {
      setStatus("提交失败，请直接电话联系。");
    }
  };

  return (
    <section id="contact" className="section-padding bg-surface">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Info */}
          <div className="lg:col-span-2">
            <SectionTitle
              eyebrow={site.contactEyebrow}
              title={site.contactTitle}
              description={site.contactDesc}
              centered={false}
            />
            <div className="space-y-4 mt-8">
              {contactInfo.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-tech-blue/5 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-tech-blue" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 font-medium mb-0.5">{item.label}</div>
                      {item.href ? (
                        <a href={item.href} className="text-sm font-semibold text-navy-500 hover:text-tech-blue transition-colors">
                          {item.value}
                        </a>
                      ) : (
                        <div className="text-sm font-semibold text-navy-500">{item.value}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* QR Code */}
            {contactData.wechatQr && (
              <div className="mt-6 flex items-center gap-4">
                <img src={contactData.wechatQr} alt="微信二维码"
                  className="w-28 h-28 object-contain rounded-xl border border-gray-200 bg-white p-2 shadow-sm" />
                <div>
                  <div className="text-sm font-semibold text-navy-500">扫码添加微信</div>
                  <div className="text-xs text-gray-400 mt-1">在线咨询 · 快速报价</div>
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3"
          >
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">姓名 *</label>
                  <input required value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/10 outline-none transition-all text-sm"
                    placeholder="您的称呼" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">电话 *</label>
                  <input required value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/10 outline-none transition-all text-sm"
                    placeholder="方便联系的手机号" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">公司名称</label>
                  <input value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/10 outline-none transition-all text-sm"
                    placeholder="可选" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">咨询产品</label>
                  <select value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/10 outline-none transition-all text-sm bg-white">
                    <option value="">请选择</option>
                    <option>纸箱</option>
                    <option>气泡袋</option>
                    <option>珍珠棉袋</option>
                    <option>珍珠棉异形件</option>
                    <option>组合包装方案</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">需求说明</label>
                  <textarea rows={4} value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/10 outline-none transition-all text-sm resize-none"
                    placeholder="例如：产品尺寸、需要平方数、是否定制印刷、发货用途" />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full mt-5 text-sm py-3">
                提交询价
              </button>
              {status && (
                <p className="mt-4 text-sm font-medium text-tech-blue text-center">{status}</p>
              )}
            </form>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
