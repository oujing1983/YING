"use client";

import { useState, useEffect } from "react";
import { Phone, Mail, MapPin, ChevronUp, MessageCircle, X } from "lucide-react";
import { useSite } from "@/components/SiteProvider";

const footerLinks = {
  产品中心: ["纸箱", "气泡袋", "珍珠棉袋", "珍珠棉异形件"],
  关于我们: ["公司简介", "生产设备", "品质控制"],
  服务支持: ["定制流程", "样品申请", "常见问题"],
};

export default function Footer() {
  const [contact, setContact] = useState<any>({});
  const site = useSite();
  const [showWechat, setShowWechat] = useState(false);

  useEffect(() => {
    fetch('/api/public/contact').then(r => r.json()).then(d => { if (d) setContact(d) }).catch(() => {});
  }, []);

  const csPhone = contact.csPhone || contact.phone || "18005770078";
  const [qrFailed, setQrFailed] = useState(false);
  const wechatQr = contact.wechatQr && !qrFailed ? contact.wechatQr : "/brand/wechat-qr.jpg";

  return (
    <>
      {/* Floating Customer Service Button */}
      <div className="fixed bottom-20 right-8 z-50 flex flex-col items-end gap-3">
        {/* WeChat QR Popover */}
        {showWechat && wechatQr && (
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-4 mb-2 relative"
            style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <button onClick={() => setShowWechat(false)}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
              <X size={14} />
            </button>
            <img src={wechatQr} onError={() => setQrFailed(true)} alt="微信二维码" className="w-32 h-32 object-contain" />
            <p className="text-xs text-gray-500 text-center mt-2">扫码添加微信</p>
          </div>
        )}

        {/* WeChat Button */}
        <button onClick={() => setShowWechat(!showWechat)}
            className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-lg hover:shadow-green-500/30 transition-all"
            aria-label="微信咨询">
            <MessageCircle size={18} />
        </button>

        {/* Phone Button */}
        <a href={`tel:${csPhone}`}
          className="w-10 h-10 rounded-full bg-tech-blue hover:bg-blue-600 text-white flex items-center justify-center shadow-lg hover:shadow-tech-blue/30 transition-all"
          aria-label="电话咨询">
          <Phone size={18} />
        </a>
      </div>

      {/* Main Footer */}
      <footer className="bg-navy-500 text-white">
        <div className="container-wide py-16 md:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src={site.logoImage || "/brand/zwpack-logo.png"} onError={(event) => { event.currentTarget.src = "/brand/zwpack-logo.png"; }} alt="至微包装 Logo" className="w-10 h-10 rounded-xl object-cover" />
                <div>
                  <span className="block text-sm font-semibold leading-tight">
                    {contact.company || "至微包装"}
                  </span>
                  <span className="block text-xs text-white/50 font-medium">
                    ZW PACK
                  </span>
                </div>
              </div>
              <p className="text-sm text-white/60 leading-relaxed max-w-xs">
                专注纸箱、气泡袋、珍珠棉包装产品定制，为客户提供高品质包装解决方案。
              </p>
              {/* QR Code in footer */}
                <div className="mt-4 inline-flex flex-col items-center">
                  <img src={wechatQr} onError={() => setQrFailed(true)} alt="微信二维码" className="w-24 h-24 object-contain rounded-lg bg-white p-1" />
                  <p className="text-xs text-white/40 mt-1">扫码添加微信</p>
                </div>
            </div>

            {/* Links */}
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h4 className="text-sm font-semibold mb-4 text-white/90">
                  {title}
                </h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact & Copyright */}
          <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-wrap gap-6 text-sm text-white/50">
              <a href={`tel:${csPhone}`} className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone size={14} />{csPhone}
              </a>
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail size={14} />{contact.email}
                </a>
              )}
              {contact.address && (
                <span className="flex items-center gap-2">
                  <MapPin size={14} />{contact.address}
                </span>
              )}
              {contact.wechat && (
                <span className="flex items-center gap-2">
                  <MessageCircle size={14} />微信：{contact.wechat}
                </span>
              )}
            </div>
            <p className="text-xs text-white/30">
              &copy; {new Date().getFullYear()} {contact.company || "至微包装有限公司"} All rights reserved.
            </p>
          </div>
        </div>

        {/* Back to top */}
        <a href="#top"
          className="fixed bottom-8 right-8 w-10 h-10 rounded-full bg-tech-blue/90 hover:bg-tech-blue text-white flex items-center justify-center shadow-lg hover:shadow-tech-blue/25 transition-all z-40"
          aria-label="返回顶部">
          <ChevronUp size={20} />
        </a>
      </footer>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
