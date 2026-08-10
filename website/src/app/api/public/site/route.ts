import { NextResponse } from 'next/server'
import { readData } from '@/lib/data'

export async function GET() {
  const fallback = { logo: 'ZW', logoImage: '/assets/logo.jpg', heroTitle: '一站式包装解决方案', heroSubtitle: '专注纸箱、气泡袋、珍珠棉包装产品定制', factoryImages: [] }
 const data: any = readData('site', fallback)
  data.carouselImages = readData('carousel', [])
  if (!data.logoImage) data.logoImage = '/assets/logo.jpg';
  if (!data.heroEyebrow) data.heroEyebrow = '至微包装 · ZW PACK';
  if (!data.advantagesEyebrow) data.advantagesEyebrow = '为什么选择我们';
  if (!data.advantagesTitle) data.advantagesTitle = '从包装效果到采购成本，都帮你算清楚';
  if (!data.advantagesDesc) data.advantagesDesc = '不只报价单个产品，而是结合产品尺寸、运输距离、产品重量、破损风险、采购批量，给出更合适的包装组合。';
  if (!data.industriesEyebrow) data.industriesEyebrow = '服务行业';
  if (!data.industriesTitle) data.industriesTitle = '覆盖多个行业领域';
  if (!data.industriesDesc) data.industriesDesc = '我们的包装产品广泛应用于多个行业，为不同领域提供专业的包装解决方案。';
  if (!data.processEyebrow) data.processEyebrow = '合作流程';
  if (!data.processTitle) data.processTitle = '四步确认，减少沟通成本';
  if (!data.processDesc) data.processDesc = '从咨询到交付，流程清晰透明，让合作更高效。';
  if (!data.factoryEyebrow) data.factoryEyebrow = '工厂实力';
  if (!data.factoryTitle) data.factoryTitle = '现代化生产，品质保障';
  if (!data.factoryDesc) data.factoryDesc = '拥有先进的生产设备和严格的品控体系，确保每一个产品都符合标准。';
  if (!data.productsEyebrow) data.productsEyebrow = '产品中心';
  if (!data.productsTitle) data.productsTitle = '主营产品';
  if (!data.productsDesc) data.productsDesc = '四大核心包装产品，全部支持按需定制，满足不同行业需求。';
  if (!data.contactEyebrow) data.contactEyebrow = '联系我们';
  if (!data.contactTitle) data.contactTitle = '获取报价';
  if (!data.contactDesc) data.contactDesc = '告诉我们你的包装需求，我们会尽快与你联系。';
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store, max-age=0' } })
}
