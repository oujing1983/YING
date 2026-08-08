# zwpack.cn FEFCO 0201 获客工具：第一阶段 MVP 开发拆解

> 状态：待人工审核，不进入代码开发  
> 产品定位：在线纸箱结构计算与理论刀版预览工具，不是生产级包装 CAD  
> 核心路径：理论生成 → 客户确认/提交需求 → 人工报价 → 工厂生产确认

## 1. 产品目标

第一阶段只验证两件事：

1. 客户是否愿意输入纸箱尺寸并使用 0201 刀版预览/PDF；
2. 工具是否能带来有效尺寸数据和询盘。

首期不承诺网页输出可直接送模切设备。所有页面和 PDF 应清楚标注：

> 本结果为理论结构预览及报价沟通资料，实际生产尺寸、材料与工艺参数须由纸箱厂确认。

## 2. MVP 范围

### 2.1 必须交付

- FEFCO 0201 参数化生成；
- 内尺寸、外尺寸输入；
- 长 L、宽 W、高 H 输入，统一使用 mm；
- 三层材料：B、E、C；
- 五层材料：AB、BC、EB；
- 材料厚度及基础补偿由简单后台配置；
- 连续拓扑 Geometry：Face、Shared Edge、cut/crease/slot；
- SVG 实时预览：viewBox、fit、zoom、pan、刀线/压线区分、尺寸标注；
- PDF 下载，与 SVG 共用同一份 Geometry；
- 客户需求收集：尺寸、材料、联系方式、备注及当前 Geometry 参数；
- 基础埋点：开始输入、成功预览、下载 PDF、提交询盘。

### 2.2 明确暂缓

- DXF 导出；
- CalibrationRecord 和自动校准系统；
- 多级审批、规则发布工作流、复杂审计系统；
- 完整 ProductionProfile 管理；
- 直接连接模切设备或宣称生产就绪；
- 多工厂、多设备、多租户规则；
- 0201 之外的其他箱型；
- 自动报价和自动下单。

暂缓不等于删除扩展能力。Geometry 的单位、语义和 Renderer 分离必须保留，避免以后增加 DXF 或箱型时推翻重写。

## 3. 精简系统架构

```text
0201 工具页面
  ├─ 尺寸类型：内尺寸 / 外尺寸
  ├─ L / W / H（mm）
  ├─ 材料：B / E / C / AB / BC / EB
  └─ 联系方式与需求
              │
              ▼
        输入校验与参数归一化
              │
              ├──────────────> MaterialConfig（后台维护）
              │
              ▼
       尺寸转换 / 基础补偿
              │
              ▼
        0201 Geometry Generator
        Face → Shared Edge → Topology
              │
              ▼
        Geometry Validator（轻量）
          ┌───┴────────┐
          ▼            ▼
     SVG Renderer   PDF Renderer
          │            │
          └─────┬──────┘
                ▼
       预览 / 下载 / 提交询盘
                │
                ▼
     Lead + GenerationSnapshot 存储
```

系统仍坚持唯一数据链：

```text
用户参数 → 0201规则 → 可配置补偿 → Geometry(mm) → SVG/PDF
```

SVG 和 PDF 不得计算 L/W/H、摇盖或材料补偿。

## 4. 第一阶段精简模块

| 模块 | 首期职责 | 不做 |
|---|---|---|
| 工具页面 | 输入、实时预览、错误提示、询盘入口 | CAD 编辑器、自由改线 |
| MaterialConfig | 六种材料的厚度和基础参数维护 | 版本审批、复杂适用条件 |
| Size Converter | 内/外尺寸转首期制造尺寸 | 多设备规则引擎 |
| 0201 Generator | 生成连续 Geometry 与拓扑 | SVG/PDF 格式细节 |
| Geometry Validator | 连通、共享边、重叠、自交、正尺寸检查 | 生产设备兼容认证 |
| SVG Renderer | 显示、缩放、图层样式、标注 | 箱型计算 |
| PDF Renderer | 从同一 Geometry 输出沟通版 PDF | 生产承诺、拼版、设备下发 |
| Lead Capture | 保存客户、参数、来源、下载/询盘行为 | CRM 自动化和复杂销售流程 |
| 简单后台 | 维护材料参数和少量全局公式参数 | Profile、审批、校准工作台 |

## 5. MVP 数据模型

### 5.1 MaterialConfig

```ts
type MaterialConfig = {
  id: string;
  code: "B" | "E" | "C" | "AB" | "BC" | "EB";
  name: string;
  layers: 3 | 5;
  thicknessMm: Decimal;
  insideAdjustLmm: Decimal;
  insideAdjustWmm: Decimal;
  insideAdjustHmm: Decimal;
  outsideAdjustLmm: Decimal;
  outsideAdjustWmm: Decimal;
  outsideAdjustHmm: Decimal;
  flapAdjustMm: Decimal;
  slotWidthMm: Decimal;
  enabled: boolean;
  updatedAt: Instant;
};
```

这些数值由纸箱厂人工维护，不在代码中写死。首期可以只有当前值，不开发版本审批；但每次客户生成时需复制一份参数快照，避免后台改值后无法解释旧询盘。

### 5.2 BoxSettings

```ts
type BoxSettings = {
  boxType: "0201";
  defaultGlueFlapWidthMm: Decimal;
  flapDepthRule: "HALF_WIDTH_PLUS_ADJUSTMENT";
  disclaimerText: string;
  updatedAt: Instant;
};
```

首期默认摇盖关系：

```text
FlapDepth = manufacturingW / 2 + material.flapAdjustMm
```

这是一个**可用的默认经验规则**，不是不可变的行业真理：基础关系由 `BoxSettings` 选择，修正值由后台材料配置维护。页面/PDF 标注为理论值，生产前人工确认。

接舌宽度首期也可以采用后台全局默认值；如果实际业务需要按材料区分，再把覆盖字段加到 MaterialConfig，不提前建设完整 Profile 系统。

### 5.3 GenerationSnapshot

```ts
type GenerationSnapshot = {
  id: string;
  boxType: "0201";
  dimensionType: "inside" | "outside";
  inputLmm: Decimal;
  inputWmm: Decimal;
  inputHmm: Decimal;
  materialCode: string;
  materialConfigSnapshot: object;
  boxSettingsSnapshot: object;
  manufacturingDimensions: { L: Decimal; W: Decimal; H: Decimal };
  geometryJson: GeometryDocument;
  createdAt: Instant;
};
```

这不是重型审计系统，只是保存询盘当时使用的参数与结果。

### 5.4 Lead

```ts
type Lead = {
  id: string;
  generationSnapshotId: string;
  name?: string;
  company?: string;
  phone?: string;
  email?: string;
  wechat?: string;
  quantity?: number;
  note?: string;
  sourceUrl: string;
  consentAccepted: boolean;
  createdAt: Instant;
};
```

至少要求一种有效联系方式。联系方式采集和分析埋点应符合站点隐私政策。

### 5.5 GeometryDocument（保留为地基）

首期 Schema 只保留实际需要：

```ts
type GeometryDocument = {
  units: "mm";
  bounds: { minX: Decimal; minY: Decimal; maxX: Decimal; maxY: Decimal };
  faces: Face[];
  edges: Array<{
    id: string;
    from: PointMm;
    to: PointMm;
    role: "cut" | "crease";
    sharedBy: string[];
  }>;
  slots: Slot[];
  labels: Label[];
  dimensions: Dimension[];
  metrics: {
    overallWidthMm: Decimal;
    overallHeightMm: Decimal;
  };
};
```

避免首期同时维护 `lines/cutLines/creaseLines/paths` 多份实体。边只存一次，通过 `role` 分类，Renderer 按 role 读取。

## 6. 0201 MVP 算法实现方案

### 6.1 输入与参数解析

输入：`dimensionType, L, W, H, materialCode`。

1. 校验 L/W/H 为正数并在网站允许范围内；
2. 读取启用的 MaterialConfig；
3. 按内尺寸或外尺寸的后台调整值获得 `manufacturingL/W/H`；
4. 计算首期摇盖深度：`manufacturingW/2 + flapAdjustMm`；
5. 读取槽宽和接舌宽度；
6. 把所有实际采用值复制进 GenerationSnapshot。

内外尺寸的 `adjustL/W/H` 初始具体数值必须由 zwpack 工厂人员填写。代码只执行配置，不臆测厚度倍数。

### 6.2 连续身体结构

沿 x 方向累计：

```text
x0 = 0
x1 = x0 + manufacturingL
x2 = x1 + manufacturingW
x3 = x2 + manufacturingL
x4 = x3 + manufacturingW
x5 = x4 + glueFlapWidth
```

沿 y 方向累计：

```text
y0 = 0
y1 = topFlapDepth
y2 = y1 + manufacturingH
y3 = y2 + bottomFlapDepth
```

创建 L1、W1、L2、W2 和 Glue Face。相邻 Face 共用同一个纵向 edge；这条 edge 的 role 是 crease。禁止先生成独立矩形再对齐。

### 6.3 摇盖与开槽

为四个身体 Face 分别创建上、下摇盖 Face。每个摇盖与身体共享一条水平 crease edge。

在 `x1/x2/x3` 处生成上下槽。槽不是简单覆盖一条粗线：Geometry 应保存槽边或规范化 Slot 实体，使其宽度来自 `slotWidthMm`。接舌与 W2 邻接处的切口形状需在开发前由工厂给出首期固定规则。

### 6.4 外轮廓

从 Face 拓扑中选择只属于一个 Face 的边作为外部候选边；共享 crease 绝不能进入外轮廓。结合槽实体得到最终 cut edges。这样外刀线由连续材料结构推导，而不是手绘一条“看起来像”的 SVG path。

### 6.5 首期 Validator

必须阻止以下错误进入预览/PDF：

- 身体与摇盖不在同一个连通拓扑中；
- 任一摇盖没有和身体共享完整连接边；
- 外刀线自交、零长或重复；
- cut 与 crease 意外重合；
- 槽进入身体区域；
- bounds 与实际边界不一致；
- 材料配置缺失或产生非正制造尺寸。

Validator 只判断结构正确性，不宣称生产认证。

## 7. 页面与转化流程

推荐单页流程：

1. 用户选择内/外尺寸；
2. 输入 L/W/H；
3. 选择 B/E/C/AB/BC/EB；
4. 页面立即更新 SVG；
5. 显示理论展开总尺寸、材料和免责声明；
6. “下载理论刀版 PDF”；
7. 下载前或下载后提供低摩擦询盘表单；
8. 提交时保存 Lead 和 GenerationSnapshot，通知人工跟进报价。

不应为了获客强制客户在看到任何结果前填写完整联系方式。建议先允许预览，再用 PDF、报价或工厂确认作为转化入口，并通过数据验证哪种路径更有效。

## 8. PDF 首期内容

PDF 使用同一 Geometry，至少包含：

- 0201 理论刀版；
- L/W/H、内/外尺寸类型、材料；
- 理论总展开尺寸；
- 刀线/压线图例；
- 唯一方案编号；
- zwpack.cn 联系方式或询盘入口；
- 醒目免责声明：“理论预览，生产前须确认”；
- 打印缩放提示，避免客户把普通打印件误认为 1:1 生产版。

首期 PDF 的定位是沟通与获客资料，不是模切机文件。

## 9. 开发批次与审核门

### 批次 0：工厂规则确认（当前下一步）

- 确认内/外尺寸首期调整值；
- 填写六种材料参数；
- 确认默认接舌宽度与形状；
- 确认槽宽与槽端；
- 确认 `W/2 + adjustment` 的适用范围；
- 确认尺寸上下限和免责声明。

**审核门 A：上述规则没有明确值时，不进入 Generator 开发。**

### 批次 1：Geometry 核心

- 定稿精简 Geometry Schema；
- 实现 0201 Generator；
- 实现轻量 Validator；
- 建立典型尺寸与极端尺寸测试。

**审核门 B：人工查看关键坐标和拓扑测试，通过后才做界面。**

### 批次 2：预览与 PDF

- SVG Renderer；
- zoom/pan/fit、图层和标注；
- PDF Renderer；
- 浏览器及 PDF 尺寸一致性测试。

**审核门 C：确认 SVG/PDF 来自同一 Geometry，且免责声明清晰。**

### 批次 3：获客闭环

- 询盘表单和 GenerationSnapshot；
- 通知人工销售跟进；
- SEO 落地页和基础埋点；
- 上线前隐私、安全、反垃圾与移动端检查。

**审核门 D：小流量上线，观察真实使用，不扩箱型。**

## 10. MVP 验收标准

- 同一参数生成的 SVG 和 PDF 关键坐标完全一致；
- 所有物理坐标使用真实 mm，不受屏幕缩放影响；
- 0201 身体、八个摇盖和接舌组成一个连续拓扑；
- 材料厚度/调整值不写死在 Generator 或 Renderer；
- 六种材料都能后台启停和修改参数；
- 默认摇盖公式可用且可调整；
- 内/外尺寸均能按后台配置生成；
- 错误 Geometry 不显示为成功；
- 每个询盘能还原客户输入、采用配置和 Geometry；
- 页面/PDF 不暗示可直接生产；
- 能统计预览、PDF 下载和询盘转化。

## 11. MVP 成功指标与停止条件

建议上线前确定观察周期和目标，不在开发中无限扩范围。首期关注：

- 工具访问 → 成功预览率；
- 成功预览 → PDF 下载率；
- 成功预览/PDF → 有效询盘率；
- 询盘信息完整率；
- 人工判定的有效客户比例；
- 因尺寸/结构错误导致的投诉或无法报价比例。

若客户只看不询盘，优先优化页面价值表达和转化流程；若询盘多但尺寸不可用，优先修正规则和输入引导；只有验证 0201 能稳定带来有效询盘后，才增加其他 FEFCO 箱型或 DXF、校准、复杂 Profile。

本方案到此停止，等待人工审核，不进入代码开发。
