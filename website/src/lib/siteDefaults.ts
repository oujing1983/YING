import { readData } from "@/lib/data";

export const SITE_DEFAULTS = {
  logo: "ZW",
  logoImage: "/assets/logo.jpg",
  heroEyebrow: "至微包装 · ZW PACK",
  heroTitle: "一站式包装解决方案",
  heroSubtitle: "专注纸箱、气泡袋、珍珠棉包装产品定制，为客户提供高品质包装解决方案。",
  productsEyebrow: "产品中心",
  productsTitle: "主营产品",
  productsDesc: "四大核心包装产品，全部支持按需定制，满足不同行业需求。",
  advantagesEyebrow: "为什么选择我们",
  advantagesTitle: "从包装效果到采购成本，都帮你算清楚",
  advantagesDesc: "不只报价单个产品，而是结合产品尺寸、运输距离、产品重量、破损风险、采购批量，给出更合适的包装组合。",
  industriesEyebrow: "服务行业",
  industriesTitle: "覆盖多个行业领域",
  industriesDesc: "我们的包装产品广泛应用于多个行业，为不同领域提供专业的包装解决方案。",
  processEyebrow: "合作流程",
  processTitle: "四步确认，减少沟通成本",
  processDesc: "从咨询到交付，流程清晰透明，让合作更高效。",
  factoryEyebrow: "工厂实力",
  factoryTitle: "现代化生产，品质保障",
  factoryDesc: "拥有先进的生产设备和严格的品控体系，确保每一个产品都符合标准。",
  contactEyebrow: "联系我们",
  contactTitle: "获取报价",
  contactDesc: "告诉我们你的包装需求，我们会尽快与你联系。",
  factoryImages: [],
  advantagesImages: [],
  industriesImages: [],
  processImages: [],
  productsImages: [],
  contactsectionImages: [],
  showHero: true,
  showProducts: true,
  showAdvantages: true,
  showIndustries: true,
  showProcess: true,
  showFactory: true,
  showContact: true,
};

export function getSiteConfig() {
  return { ...SITE_DEFAULTS, ...readData("site", {}) };
}
