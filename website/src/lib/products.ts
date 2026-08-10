export interface Product {
  id: string;
  name: string;
  description: string;
  features: string[];
  specs: Record<string, string>;
  applications: string[];
  image: string;
  images: string[];
}

export const products: Product[] = [
  {
    id: "carton",
    name: "纸箱",
    description: "适合快递发货、仓储周转、外箱包装。可定制三层、五层、加硬、印刷、开槽等规格，满足电商、工厂、物流等各类场景需求。",
    features: ["三层/五层/加硬可选", "支持定制印刷", "可做开槽/异形", "承重能力强"],
    specs: { "材质": "三层（B/E楞）、五层（AB/EB楞）", "规格": "尺寸按需定制", "印刷": "支持品牌Logo、警示语", "起订量": "单规格100平方", "交期": "约6天" },
    applications: ["快递发货", "仓储周转", "工业外箱", "电商打包"],
    image: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&q=80",
      "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=800&q=80",
    ],
  },
  {
    id: "bubble-bag",
    name: "气泡袋",
    description: "轻便缓冲，适合电商、小家电、玻璃制品、配件发货。可做自粘口、信封袋、防静电袋，规格按需定制。",
    features: ["轻便缓冲", "自粘口设计可选", "防静电可选", "成本低"],
    specs: { "材质": "牛皮纸/共挤膜+气垫膜", "类型": "自粘口/信封袋/防静电", "规格": "尺寸按需定制", "印刷": "支持定制", "起订量": "单规格100平方" },
    applications: ["电商发货", "小家电", "玻璃制品", "精密配件"],
    image: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=800&q=80",
      "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&q=80",
    ],
  },
  {
    id: "epe-bag",
    name: "珍珠棉袋",
    description: "EPE珍珠棉柔韧防震，适合表面防刮和缓冲保护，可按产品尺寸热合成袋，规格按需定制。",
    features: ["柔韧防震", "表面防刮", "可按尺寸热合", "防潮"],
    specs: { "材质": "EPE珍珠棉", "厚度": "1mm-5mm按需定制", "规格": "尺寸按需热合", "起订量": "单规格100平方", "交期": "约6天" },
    applications: ["电子产品", "精密配件", "表面防刮包装", "日用品缓冲"],
    image: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=800&q=80",
      "https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=800&q=80",
    ],
  },
  {
    id: "epe-foam",
    name: "珍珠棉异形件",
    description: "按产品结构开槽、冲型、粘合、复合，适合精密件、仪器、电子产品内托防护，来样定制。",
    features: ["量身定制贴合产品", "开槽/冲型/粘合", "多层复合", "精准固定缓冲"],
    specs: { "材质": "EPE珍珠棉", "工艺": "开槽/冲型/裁切/粘合/复合", "规格": "按产品图纸/实物定制", "起订量": "单规格100平方", "交期": "约6天" },
    applications: ["精密仪器", "电子产品", "医疗器械", "汽车配件"],
    image: "https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=800&q=80",
      "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=800&q=80",
    ],
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.id === slug);
}
