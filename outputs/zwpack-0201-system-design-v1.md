# zwpack.cn 在线纸箱刀版生成器：系统设计方案（第一轮）

> 文档状态：供人工审核，未进入正式开发  
> 范围：FEFCO 0201 第一阶段  
> 核心约束：参数 → 箱型几何规则 → 生产补偿规则 → Geometry（真实 mm）→ SVG / PDF / DXF  
> 明确不做：预制 SVG 缩放、独立图片拼接、Renderer 内计算箱型、把未经确认的行业经验写成最终公式

## 0. 设计结论与边界

系统应以 **Geometry 为唯一事实来源（single source of truth）**。0201 Generator 负责生成一张连续纸板的二维拓扑与坐标；SVG、PDF、DXF 只消费该 Geometry，不知道 L/W/H 如何变成坐标，也不允许自行补偿。

第一阶段把结果分成三种状态：

- `confirmed`：已由箱型定义或纸箱厂明确确认；
- `candidate`：可用于理论预览的候选关系，但不可默认标注为“可生产”；
- `unresolved`：缺少工厂规则，生产导出必须阻止或带显著水印。

本文 300 × 200 × 150 mm 示例是 **零补偿理论基线**。为展示完整结构，临时使用候选值：摇盖深度 `W/2 = 100 mm`、粘合舌 `40 mm`、理论槽宽 `0 mm`。三者都不是最终生产公式，必须由纸箱厂确认或配置后才能进入生产状态。

---

## 1. 系统架构

### 1.1 模块、职责与禁止事项

| 模块 | 核心职责 | 输入 | 输出 | 明确禁止 |
|---|---|---|---|---|
| 用户输入层 | 收集箱型、尺寸类型、L/W/H、材料、生产配置、单位；做基础格式校验 | 表单/URL 参数 | `BoxGenerationRequest` | 计算刀线坐标、内外尺寸换算 |
| 箱型规则引擎 | 描述“0201 是什么”；定义面顺序、邻接、共享边、压线与槽的语义 | `BoxTypeDefinition`、制造尺寸 | 理论拓扑/几何意图 | 包含工厂经验补偿、输出 SVG |
| 材料数据库 | 保存材料、楞型和版本化物性数据 | 后台配置 | `MaterialRevision` | 在代码中写死 BC、AB 厚度 |
| 尺寸转换模块 | 将 inside/outside 等输入转换为统一 `manufacturingDimensions` | 原始尺寸、材料快照、配置规则 | 制造尺寸及逐项计算轨迹 | 猜测内外尺寸换算公式 |
| 生产补偿模块 | 解析材料、设备、工艺和本厂经验；输出有效补偿值 | Material、ProductionProfile、规则上下文 | `ResolvedProductionRules` | 直接画线；把缺失值默认为 0 而不告警 |
| 几何计算引擎 | 将箱型拓扑、制造尺寸、补偿快照转成完整连续的 mm 坐标 | 理论拓扑、resolved rules | `GeometryDocument` | 依赖浏览器像素或页面大小 |
| Geometry Validator | 检查连续性、闭合性、共享边、交叉/重叠、尺寸和制造前置条件 | Geometry | errors/warnings/metrics | 自动修正而不留下审计记录 |
| SVG Renderer | 将统一 Geometry 映射为 SVG；viewBox、图层、样式、缩放/平移 | Geometry + 展示主题 | SVG | 重算 0201、应用生产补偿、按 CSS 尺寸改坐标 |
| PDF Exporter | 按真实毫米输出页面/拼版并保留刀线压线语义 | Geometry + 页面设置 | PDF | 单独实现 0201 公式 |
| DXF Exporter（后续） | 映射 cut/crease 等图层与实体 | Geometry + CAD 映射配置 | DXF | 单独实现 0201 公式 |
| 后台配置系统 | 管理材料、箱型版本、ProductionProfile、规则版本、审批与生效时间 | 管理员输入 | 版本化配置 | 无审计覆盖已发布规则 |
| 校准与打样模块 | 比较理论坐标和实测坐标，形成偏差数据；人工批准后更新配置 | Geometry、打样测量 | CalibrationRecord、建议值 | 自动把一次测量写回生产规则 |
| SEO 页面生成逻辑 | 生成箱型知识页、可索引静态内容、合法 canonical；工具参数页按策略控制索引 | BoxType 元数据、内容模板 | SEO 页面/元数据 | 把用户尺寸参数组合批量制造成薄内容页面 |

### 1.2 主数据流

```text
用户输入
  │  BoxGenerationRequest（原始值，不覆盖）
  ▼
输入校验 ──失败──> 字段错误
  │
  ├──> BoxTypeDefinition@version ─────┐
  ├──> MaterialRevision@version ──────┤
  └──> ProductionProfileRevision ─────┤
                                      ▼
                           规则解析 / 完整性检查
                                      │
                    ResolvedProductionRules + 审计轨迹
                                      │
                                      ▼
尺寸转换模块 → ManufacturingDimensions（Lₘ/Wₘ/Hₘ）
                                      │
                                      ▼
箱型规则引擎 → 0201 连续拓扑（面、邻接、共享边、槽意图）
                                      │
                                      ▼
几何计算引擎 → GeometryDocument（mm）
                                      │
                                      ▼
Geometry Validator ──错误──> 阻止“生产导出”
       │通过/仅警告
       ├────────> SVG Renderer → 浏览器预览
       ├────────> PDF Exporter → PDF
       └────────> DXF Exporter → DXF（后续）
```

配置解析必须产生不可变快照，并记录材料版本、Profile 版本、箱型规则版本和每个有效参数的来源。历史文件重导出时使用原快照，不因后台新配置而悄悄变化。

### 1.3 两个严格分离的规则层

**箱型几何规则层**只表达：面板顺序 `L-W-L-W`、粘合舌、上下摇盖、共享连接边、纵横压线、开槽、外轮廓及各实体的语义/拓扑。

**生产补偿规则层**只表达：从用户尺寸到制造尺寸的转换与偏移，包括材料厚度相关规则、内/外尺寸转换、L/W/H 补偿、压线/摇盖/接舌/槽宽及设备差异。它必须来自版本化配置或经批准的规则表达式，不进入 Renderer，也不散落在 0201 绘图代码中。

建议规则解析优先级必须显式配置；可采用候选顺序 `订单覆盖 > ProductionProfile > MaterialRevision > BoxType 默认候选`，但该优先级本身也需业务审核。冲突不应静默取值。

### 1.4 生产就绪门禁

每次生成同时返回：

- `previewStatus`: 是否能进行理论预览；
- `productionReadiness`: `blocked | provisional | approved`；
- `unresolvedRules[]`: 未确认规则；
- `assumptions[]`: 本次使用的候选关系；
- `calculationTrace[]`: 每个制造尺寸和坐标的来源。

理论预览可以在清晰标注下使用候选值；PDF/DXF 的“生产版”应在必需规则 unresolved 时被阻止，避免“能下载”被误认为“能生产”。

---

## 2. 数据模型

所有物理量在 API/数据库中使用十进制毫米值，禁止使用二进制浮点作为最终持久化依据。建议数据库 `DECIMAL`，计算层使用 decimal 库；Renderer 输出时再按精度策略格式化。

### 2.1 Material / MaterialRevision

材料主记录与版本记录分离，订单引用不可变 revision。

```ts
type RuleValue = {
  valueMm?: Decimal;
  expression?: string;              // 受限规则 DSL，不允许任意代码
  status: "confirmed" | "candidate" | "unresolved";
  source: "factory" | "material" | "standard-reference" | "temporary-assumption";
  note?: string;
};

type Material = {
  id: UUID;
  code: string;                     // 业务编码，不隐含厚度
  name: string;
  enabled: boolean;
  currentRevisionId?: UUID;
  createdAt: Instant;
  updatedAt: Instant;
};

type MaterialRevision = {
  id: UUID;
  materialId: UUID;
  version: number;
  layers?: number;
  fluteType?: string;               // B / E / BC / AB 等，仅为分类
  nominalThickness: RuleValue;
  effectiveThickness: RuleValue;
  insideCompensation: DimensionRuleSet;
  outsideCompensation: DimensionRuleSet;
  creaseCompensation: RuleValue;
  flapCompensation: RuleValue;
  metadata?: Record<string, string>;
  status: "draft" | "approved" | "retired";
  effectiveFrom?: Instant;
  approvedBy?: UUID;
};
```

`nominalThickness` 是供应规格，`effectiveThickness` 是参与本厂计算的有效值；二者不可混为一栏。B/E/BC/AB 不绑定固定毫米数。

### 2.2 BoxType / BoxTypeRevision

```ts
type BoxType = {
  id: UUID;
  code: "0201" | string;
  name: string;
  enabled: boolean;
  currentRevisionId?: UUID;
};

type BoxTypeRevision = {
  id: UUID;
  boxTypeId: UUID;
  version: number;
  panelSequence: ["L1", "W1", "L2", "W2"];
  requiredComponents: Array<
    "body-panels" | "glue-flap" | "top-flaps" | "bottom-flaps" |
    "vertical-creases" | "horizontal-creases" | "slots" | "outer-cut"
  >;
  topologyDefinition: TopologyRuleSet;    // 面、边、邻接和共享关系
  parameterSchema: ParameterDefinition[];
  candidateRules: {
    flapDepth?: RuleValue;
    glueFlapWidth?: RuleValue;
    slotWidth?: RuleValue;
  };
  status: "draft" | "approved" | "retired";
};
```

箱型记录保存的是结构和规则，不保存一张模板 SVG。

### 2.3 ProductionProfile / Revision

```ts
type ProductionProfile = {
  id: UUID;
  profileName: string;
  plantId?: UUID;
  enabled: boolean;
  currentRevisionId?: UUID;
};

type ProductionProfileRevision = {
  id: UUID;
  profileId: UUID;
  version: number;
  machineType?: string;
  applicableBoxTypes: string[];
  applicableMaterialIds?: UUID[];
  slotWidth: RuleValue;
  glueFlapWidth: RuleValue;
  creaseCompensation: RuleValue;
  lengthCompensation: RuleValue;
  widthCompensation: RuleValue;
  heightCompensation: RuleValue;
  flapCompensation: RuleValue;
  dimensionConversion: {
    inside?: DimensionRuleSet;
    outside?: DimensionRuleSet;
    manufacturing?: DimensionRuleSet;
  };
  rulePriority?: Record<string, number>;
  toleranceMm?: Record<string, Decimal>;
  status: "draft" | "approved" | "retired";
  effectiveFrom?: Instant;
  approvedBy?: UUID;
  changeReason?: string;
};
```

`DimensionRuleSet` 应逐轴保存受限表达式、适用条件、状态、来源与单位，例如 L/W/H 分别解析；当前阶段不预填行业公式。

### 2.4 Generation request、规则快照与追踪

```ts
type BoxGenerationRequest = {
  boxType: "0201";
  dimensionType: "inside" | "outside" | "manufacturing";
  dimensions: { L: Decimal; W: Decimal; H: Decimal; unit: "mm" };
  materialRevisionId: UUID;
  productionProfileRevisionId: UUID;
};

type ResolvedProductionRules = {
  snapshotId: UUID;
  materialRevisionId: UUID;
  profileRevisionId: UUID;
  boxTypeRevisionId: UUID;
  effective: Record<string, RuleValue>;
  unresolvedRules: string[];
  assumptions: Assumption[];
  calculationTrace: CalculationStep[];
};
```

### 2.5 GeometryDocument（统一 Geometry 数据层）

```ts
type PointMm = { x: Decimal; y: Decimal };

type GeometryMeta = {
  geometryId: UUID;
  schemaVersion: string;
  generator: "FEFCO-0201";
  generatorVersion: string;
  units: "mm";
  requestSnapshot: BoxGenerationRequest;
  ruleSnapshotId: UUID;
  productionReadiness: "blocked" | "provisional" | "approved";
  assumptions: Assumption[];
  warnings: GeometryIssue[];
};

type GeometryEntityBase = {
  id: string;
  role: "cut" | "crease" | "dimension" | "label" | "reference";
  layer: string;
  sourceRuleId: string;              // 坐标可追溯
  ownerFaceIds?: string[];
};

type GeometryDocument = {
  meta: GeometryMeta;
  bounds: { minX: Decimal; minY: Decimal; maxX: Decimal; maxY: Decimal };
  topology: {
    faces: Face[];                   // L1/W1/L2/W2/舌及八个摇盖
    edges: TopologicalEdge[];        // sharedBy 两个面表示真实共享连接边
    adjacency: FaceAdjacency[];
  };
  lines: LineEntity[];
  polylines: PolylineEntity[];
  paths: PathEntity[];
  creaseLines: LineEntity[];
  cutLines: LineEntity[];
  slots: SlotEntity[];
  labels: LabelEntity[];
  dimensions: DimensionEntity[];
  metrics: {
    bodyWidth: Decimal;
    bodyHeight: Decimal;
    overallWidth: Decimal;
    overallHeight: Decimal;
  };
};
```

实现时 `lines/polylines/paths` 与语义集合不能产生两份互相矛盾的数据。建议实体只存一次，以 `role` 分类；API 可为兼容需求提供 `cutLines`、`creaseLines` 等只读索引或序列化视图。

重要拓扑字段示例：身体与上摇盖的共边 `sharedBy: ["L1", "TOP_L1"]`、`edgeRole: "crease"`。Validator 由此验证摇盖确实连接身体，而不是仅凭两条线“看上去相接”。

### 2.6 CalibrationRecord（人工校准）

```ts
type CalibrationRecord = {
  id: UUID;
  geometryId: UUID;
  sampleCode: string;
  materialRevisionId: UUID;
  profileRevisionId: UUID;
  measurements: Array<{
    featureId: string;               // 如 crease.v.L1_W1
    theoreticalMm: Decimal;
    actualMm: Decimal;
    deviationMm: Decimal;            // actual - theoretical
    method?: string;
  }>;
  environment?: Record<string, string>;
  result: "pending" | "accepted" | "rejected";
  reviewedBy?: UUID;
  note?: string;
};
```

校准记录只产生“建议差值”；必须经过人工审核，创建新的 ProductionProfileRevision，不能修改历史版本。

---

## 3. FEFCO 0201 算法拆解

### 3.1 分类说明

| 分类 | 内容 |
|---|---|
| 已确定的结构关系 | 一张连续纸板；身体面依次为 L1、W1、L2、W2；相邻身体面由纵向压线连接；每个身体面对应上/下摇盖且共享水平连接边；摇盖之间有开槽/分离刀线；存在粘合舌；最终含外刀线与压线 |
| 需纸箱厂确认 | inside/outside → manufacturing 的逐轴关系；实际压线位置；材料厚度如何参与各轴；摇盖制造深度；接舌宽度/形状；槽宽和槽端形状；各楞型/设备补偿；刀具/压线中心线解释；公差与舍入 |
| 可后台配置 | Material 物性、ProductionProfile 的逐项补偿、适用材料/设备、规则优先级、槽宽、舌宽、L/W/H/摇盖/压线补偿、容差、规则版本 |

注意：“可配置”不等于“可以随意给默认值”。生产必需参数未确认时应保持 unresolved。

### 3.2 生成步骤

1. **冻结输入**：保存原始 L/W/H、dimensionType、材料 revision、Profile revision、箱型 revision，统一单位为 mm。
2. **语义校验**：验证正数、合理范围、材料/Profile 启用状态及适用范围；不在此处推导坐标。
3. **解析规则**：按已批准优先级合并配置，逐项输出值、状态、来源和冲突。缺少生产必需项时标记 `productionReadiness=blocked`。
4. **尺寸转换**：把用户尺寸转换成 `Lₘ/Wₘ/Hₘ`。如果 inside/outside 转换公式未经确认，不得偷偷套用厚度公式；理论示例可明确使用 identity 临时假设。
5. **建立身体基准轴**：选定统一局部坐标系。推荐身体左边界 `x=0`、上水平压线 `y=T`，其中 `T` 是解析后的上摇盖制造深度。
6. **生成累计 x 轴**：依次累计 `[Lₘ, Wₘ, Lₘ, Wₘ]`，得到身体面边界；粘合舌按已解析宽度和放置侧加入。补偿应在累计前作用于“制造面宽”，不能在渲染时平移线段。
7. **建立身体面拓扑**：创建 L1/W1/L2/W2 四个 face；它们的公共纵边创建一次，并标为 crease；创建粘合舌 face 及其连接压线。禁止以五张独立矩形拼贴后再尝试对齐。
8. **生成上下摇盖 face**：每个身体 face 沿 `y=T` 或 `y=T+Hₘ` 共享一条完整连接边；该共边为水平压线。摇盖深度由 resolved rule 决定，不能在 0201 Renderer 中写 `W/2`。
9. **生成槽/分离刀线**：在身体纵压线向上下延伸处，根据已解析槽宽和槽端规则生成 SlotEntity。槽应与相邻摇盖边界和水平压线拓扑一致。槽宽为 0 仅代表理论中心线示意，不代表生产刀槽。
10. **构造外轮廓**：从拓扑边集合中选取仅被一个实体面占有且 role=cut 的边，按连通顺序形成外轮廓；共享连接边不能出现在外轮廓中。
11. **构造压线层**：输出身体纵压线、上下水平压线及接舌压线；为每条线记录 owner/sharedBy/sourceRule。
12. **规范化与精度处理**：内部保持 decimal mm；不因 SVG 尺寸、屏幕 DPR、PDF 页面大小改变坐标。输出舍入规则应配置并进入审计轨迹。
13. **验证 Geometry**：执行拓扑、几何和制造完整性测试（见下）。有硬错误不输出生产文件。
14. **渲染/导出**：各 Renderer 只做坐标与格式映射、样式和页面布局。

### 3.3 连续性与“断开结构”验证

至少实施以下自动不变量：

- `L1-W1-L2-W2` 身体图的连通分量数必须为 1；
- 每个上/下摇盖必须和其 owner body face 共享一条长度等于该面制造宽度的边；
- 共享边坐标必须完全相同，不允许靠容差看起来贴住；
- 水平压线是共享边，不是外刀线；
- 外部纸板面集合应形成一个连续材料区域；
- 外轮廓不得自交，不得有零长线或意外重复刀线；
- 槽不能穿过身体区域或留下未定义的悬空端点；
- 刀线与压线重叠必须有明确规则，否则报错；
- `bounds` 必须包围全部实体，overall dimensions 必须由 Geometry 反算验证；
- 每个生产相关坐标必须能追溯到输入或 resolved rule。

### 3.4 SVG / PDF / DXF 映射约束

SVG 示例规则：`viewBox="minX minY width height"`，可设置 `width="...mm" height="...mm"` 供 1:1 输出，但网页 CSS 仅负责 fit/zoom/pan。刀线与压线用不同 class/layer；矢量效果可用 `vector-effect="non-scaling-stroke"` 改善屏幕观察，但不能改变几何坐标。

PDF 需要明确页面尺寸、裁切/拼版策略及是否允许缩放；生产模式必须锁定 100% 并写入尺寸校验标记。DXF 后续按 Geometry role 映射图层/线型/单位，不能重新生成 0201。

---

## 4. 300 × 200 × 150 mm 理论 Geometry 示例

### 4.1 示例假设（全部需要区分状态）

输入：

```text
boxType = 0201
dimensionType = inside
L = 300 mm, W = 200 mm, H = 150 mm
material = 未指定实际 revision
productionProfile = 未确认
```

为了能给出一组可读坐标，本示例采用：

| 项目 | 示例值 | 状态 |
|---|---:|---|
| inside → manufacturing | `Lₘ=L, Wₘ=W, Hₘ=H` | 临时 identity 假设，仅理论演示；待纸箱厂确认 |
| 上/下摇盖深度 T/B | `Wₘ/2 = 100 mm` | 候选理论关系；待纸箱厂确认 |
| 粘合舌宽 G | `40 mm` | 任意演示配置；待纸箱厂确认 |
| 槽宽 S | `0 mm`（中心切线） | 理论示意；不可作为生产槽宽 |
| 所有补偿 | `0 mm` | 仅用于建立坐标基线，不代表任何材料 |

因此本例 `productionReadiness = blocked`，只能用于验证结构和坐标系统。

### 4.2 坐标系与累计坐标

采用 SVG 友好的坐标：原点在理论展开左上角，x 向右，y 向下。粘合舌放在身体最右侧；实际放置侧和舌形仍需工艺确认。

```text
x0=0
x1=x0+Lₘ=300
x2=x1+Wₘ=500
x3=x2+Lₘ=800
x4=x3+Wₘ=1000
x5=x4+G=1040

y0=0
y1=T=100                 上摇盖/身体共享压线
y2=y1+Hₘ=250             身体/下摇盖共享压线
y3=y2+B=350
```

理论总展开包围尺寸：`1040 × 350 mm`。若实际舌形不占满高度、槽有宽度或补偿改变面宽，这个总尺寸会变化。

### 4.3 Face 与共享边

| Face | 矩形范围（本例理论基线） | 与身体共享的真实连接边 |
|---|---|---|
| TOP_L1 | `(0,0)–(300,100)` | `(0,100)→(300,100)`，与 L1 共享 |
| TOP_W1 | `(300,0)–(500,100)` | `(300,100)→(500,100)`，与 W1 共享 |
| TOP_L2 | `(500,0)–(800,100)` | `(500,100)→(800,100)`，与 L2 共享 |
| TOP_W2 | `(800,0)–(1000,100)` | `(800,100)→(1000,100)`，与 W2 共享 |
| L1 | `(0,100)–(300,250)` | 上下边分别与 TOP_L1 / BOTTOM_L1 共享 |
| W1 | `(300,100)–(500,250)` | 上下边分别与 TOP_W1 / BOTTOM_W1 共享 |
| L2 | `(500,100)–(800,250)` | 上下边分别与 TOP_L2 / BOTTOM_L2 共享 |
| W2 | `(800,100)–(1000,250)` | 上下边分别与 TOP_W2 / BOTTOM_W2 共享 |
| GLUE | `(1000,100)–(1040,250)` | 左边与 W2 共享接舌压线 |
| BOTTOM_L1 | `(0,250)–(300,350)` | `(0,250)→(300,250)`，与 L1 共享 |
| BOTTOM_W1 | `(300,250)–(500,350)` | `(300,250)→(500,250)`，与 W1 共享 |
| BOTTOM_L2 | `(500,250)–(800,350)` | `(500,250)→(800,250)`，与 L2 共享 |
| BOTTOM_W2 | `(800,250)–(1000,350)` | `(800,250)→(1000,250)`，与 W2 共享 |

这不是把矩形图片拼起来：Face 是用于说明材料区域和邻接关系的拓扑数据；共边在 `edges` 中只创建一次。Renderer 可以根据这些实体画线，但不能反过来从图形猜拓扑。

### 4.4 关键线与槽

理论纵向身体压线：

```text
V1: (300,100) → (300,250)  // L1 | W1
V2: (500,100) → (500,250)  // W1 | L2
V3: (800,100) → (800,250)  // L2 | W2
V4: (1000,100) → (1000,250) // W2 | GLUE
```

理论水平压线（可存为四段以保留 owner 语义）：

```text
Top:    (0,100)→(300,100), (300,100)→(500,100),
        (500,100)→(800,100), (800,100)→(1000,100)
Bottom: (0,250)→(300,250), (300,250)→(500,250),
        (500,250)→(800,250), (800,250)→(1000,250)
```

理论零宽槽中心线（生产槽需替换成有宽度/端部形状的几何）：

```text
Top slots:    x=300,500,800; y=0→100
Bottom slots: x=300,500,800; y=250→350
```

是否在 `x=1000` 处生成摇盖与舌之间的切口、接舌上下斜切形状，取决于最终确认的舌和设备规则；本示例将其列为 unresolved，不能伪装成已完成生产刀线。

### 4.5 精简 Geometry JSON 示例

下例着重展示统一数据与拓扑；为可读性省略重复的底部 face、标签、标注和部分外轮廓段。正式 Schema 不允许用省略号。

```json
{
  "meta": {
    "schemaVersion": "1.0-draft",
    "generator": "FEFCO-0201",
    "units": "mm",
    "productionReadiness": "blocked",
    "assumptions": [
      "inside-to-manufacturing: identity (temporary)",
      "flapDepth: W/2 = 100 (candidate)",
      "glueFlapWidth: 40 (temporary)",
      "slotWidth: 0 (theoretical centerline only)"
    ]
  },
  "bounds": { "minX": 0, "minY": 0, "maxX": 1040, "maxY": 350 },
  "metrics": {
    "bodyWidth": 1000,
    "bodyHeight": 150,
    "overallWidth": 1040,
    "overallHeight": 350
  },
  "topology": {
    "faces": [
      { "id": "L1", "polygon": [[0,100],[300,100],[300,250],[0,250]] },
      { "id": "W1", "polygon": [[300,100],[500,100],[500,250],[300,250]] },
      { "id": "L2", "polygon": [[500,100],[800,100],[800,250],[500,250]] },
      { "id": "W2", "polygon": [[800,100],[1000,100],[1000,250],[800,250]] },
      { "id": "GLUE", "polygon": [[1000,100],[1040,100],[1040,250],[1000,250]] },
      { "id": "TOP_L1", "polygon": [[0,0],[300,0],[300,100],[0,100]] }
    ],
    "edges": [
      {
        "id": "crease.top.L1",
        "from": [0,100], "to": [300,100],
        "edgeRole": "crease",
        "sharedBy": ["L1", "TOP_L1"]
      },
      {
        "id": "crease.v.L1_W1",
        "from": [300,100], "to": [300,250],
        "edgeRole": "crease",
        "sharedBy": ["L1", "W1"]
      }
    ]
  },
  "creaseLines": [
    { "id": "crease.v1", "from": [300,100], "to": [300,250], "role": "crease" },
    { "id": "crease.v2", "from": [500,100], "to": [500,250], "role": "crease" },
    { "id": "crease.v3", "from": [800,100], "to": [800,250], "role": "crease" },
    { "id": "crease.glue", "from": [1000,100], "to": [1000,250], "role": "crease" }
  ],
  "slots": [
    {
      "id": "slot.top.x300",
      "centerline": [[300,0],[300,100]],
      "width": 0,
      "status": "unresolved-for-production"
    }
  ]
}
```

### 4.6 本例为何不是断开结构

TOP_L1 的底边与 L1 的顶边是同一个 TopologicalEdge：`(0,100)→(300,100)`；其角色是 crease，不是两条分别生成、恰好重合的边。其余七个摇盖采用同样关系。身体四面也通过三条纵向共享压线形成一个连通带，W2 再与粘合舌共享压线。因此 Geometry 的材料拓扑是一个连通整体；SVG 仅呈现该结果。

---

## 5. 算法测试与人工校准设计

### 5.1 UI 开发前的参数化测试矩阵

基础尺寸：

- 300 × 200 × 150
- 400 × 300 × 300
- 500 × 400 × 300
- 100 × 100 × 100
- 600 × 200 × 150

维度类型：inside、outside。材料：B、E、BC、AB。完整笛卡尔积为 `5 × 2 × 4 = 40` 个基本案例；每个案例必须绑定明确 MaterialRevision 与 ProductionProfileRevision。若某种转换规则未确认，测试的正确结果应是 `productionReadiness=blocked + unresolved rule`，而不是编造坐标。

每个案例输出并快照比对：

- 解析后的 `Lₘ/Wₘ/Hₘ` 及计算轨迹；
- 累计 x/y 关键轴；
- 全部纵横压线端点；
- 槽中心、宽度、端点/端部形状；
- 外轮廓顶点；
- 总展开尺寸与 bounds；
- 拓扑连通分量、共享边数量、自交和重叠检查；
- unresolved/assumptions/warnings；
- SVG、PDF、DXF（后续）反读后的 Geometry 尺寸一致性。

测试类型：规则单元测试、属性测试（正尺寸范围随机取样）、Golden Geometry 快照、拓扑不变量测试、Renderer 契约测试、毫米尺度 PDF/DXF 实测测试。

### 5.2 理论值 vs 实际值校准流程

1. 用固定规则版本生成 Geometry 和样品编号。
2. 打样后按同一坐标基准测量关键压线、槽、总长宽、成箱尺寸。
3. 录入 `theoreticalMm / actualMm / deviationMm`，保留材料批次、设备和环境。
4. 按箱型、材料、设备和轴向聚合偏差，查看均值、离散程度和样本数；不把一次结果直接视为规则。
5. 人工判断偏差来自材料、尺寸转换、设备、测量还是操作。
6. 经审批创建新的 ProductionProfileRevision，并重新跑 40 个基本案例和回归样本。
7. 新 revision 仅作用于新生成任务；历史任务保留原快照，可重现。

---

## 6. 风险清单：网页看似正确但实际不能生产

### 6.1 尺寸与补偿风险

- 未确认就采用内尺寸/外尺寸转换公式；不同轴使用了错误或同一补偿。
- 把 nominalThickness 当成 effectiveThickness，或把楞型名称硬编码成厚度。
- 默认 `flap=W/2`、固定舌宽、零槽宽，却没有阻止生产导出。
- 补偿方向或基准错误：加在面宽、压线中心、刀线边缘的含义不同。
- 同一补偿在尺寸转换和 Geometry 中应用两次，或漏用。
- 不同设备、材料、楞向、批次使用了错误 Profile。
- 毫米/英寸转换、浮点累计、过早舍入导致长尺寸累计误差。
- 未定义公差、刀缝、压线宽度与测量基准。

### 6.2 几何与拓扑风险

- 把箱身与摇盖作为独立矩形拼接，出现微小缝隙、重复线或错位。
- 摇盖在视觉上接触身体，但没有共享同一拓扑边。
- 外轮廓未闭合、自交、重叠切线、零长段或孤立线。
- 压线误导出为刀线，或同一位置同时出现刀线和压线。
- 开槽穿过水平压线进入身体、槽端不合设备要求、槽宽/端部形状错误。
- 接舌与相邻摇盖处的切口/斜角遗漏，纸板干涉。
- 面顺序、粘口侧或观察面方向错误，导致镜像刀版。
- 楞向/纸纹方向未建模，强度和加工方向错误。

### 6.3 Renderer 与文件格式风险

- SVG Renderer 重新计算或修改 Geometry；三个导出器产生不同刀版。
- 用 CSS 像素、屏幕缩放或截图代替真实 mm；缺失/错误 viewBox。
- PDF 打印被“适合页面”缩放，页面过小却无拼版/大幅面策略。
- SVG/PDF stroke 宽度参与外形解释不清，刀线中心与实体边界混淆。
- DXF 单位、图层、线型、坐标方向、闭合 polyline 或样条兼容性错误。
- 导出过程中坐标精度降低，或字体/标注轮廓污染生产刀线层。
- 预览中的虚线只是一种样式，但下游设备无法识别压线语义。

### 6.4 配置、版本与审计风险

- 后台修改材料/Profile 后历史订单不可重现。
- 冲突规则静默覆盖，无法知道某个坐标来自哪里。
- 草稿配置误用于生产，缺少审批、生效时间和回滚。
- 用户选择了不适用的材料/Profile 组合而系统未阻止。
- 缺失值被自动当 0，界面仍显示“生成成功”。
- 缓存键未包含规则 revision，返回旧 Geometry。

### 6.5 验证与现场风险

- 只做视觉截图测试，没有关键坐标、拓扑和毫米实测。
- 只验证单个尺寸，极小/极大或 L/W 比例极端时槽/摇盖相交。
- 没有将 PDF/DXF 交给实际软件反读和设备链路验证。
- 未做实体打样、折叠、粘合、装箱和尺寸测量闭环。
- 把理论值与一次实测偏差直接固化，忽视材料批次和测量误差。
- 没有校准样、版本号、操作者和设备记录，无法追责/复盘。

### 6.6 产品与 SEO 风险

- 页面把 provisional 预览宣传成可直接生产，造成错误预期。
- 下载文件未携带规则版本、单位、状态和未确认项说明。
- 将任意 L/W/H 参数 URL 全量索引，产生重复/薄内容和抓取膨胀。
- SEO 模板与实际支持状态不一致，宣传尚未批准的材料或箱型。

---

## 7. 人工审核清单与下一阶段入口

进入正式开发前，至少需要人工确认：

1. 0201 面序、粘合舌侧、坐标/观察方向以及接舌上下端形状。
2. inside/outside/manufacturing 三种尺寸的严格业务定义和逐轴转换规则。
3. B/E/BC/AB 的实际 MaterialRevision 数据来源与适用范围。
4. 每台设备/Profile 的槽宽、槽端形状、接舌、压线和摇盖规则。
5. 规则优先级、缺失项门禁、生产状态和审批流程。
6. PDF/DXF 下游软件、设备、图层/线型、单位与精度要求。
7. 第一批实物打样的测量点、方法、容差与样本量。

审核通过后的建议顺序是：先冻结 Geometry Schema 与规则 DSL，再实现纯函数式 0201 Generator + Validator 和 40 案例测试；之后才接 SVG 预览与 UI；PDF/DXF 在 Geometry 契约稳定后接入。本文件到此停止，不进入正式业务开发。
