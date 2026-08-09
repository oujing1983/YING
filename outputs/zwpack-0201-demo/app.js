const NS = "http://www.w3.org/2000/svg";

// Demo-only values. The production version will read these from the backend.
const materials = [
  { code: "B", layers: 3, thickness: 3.0, slot: 5 },
  { code: "E", layers: 3, thickness: 1.8, slot: 4 },
  { code: "C", layers: 3, thickness: 4.0, slot: 6 },
  { code: "AB", layers: 5, thickness: 7.0, slot: 8 },
  { code: "BC", layers: 5, thickness: 7.0, slot: 8 },
  { code: "EB", layers: 5, thickness: 5.0, slot: 7 }
];

const state = {
  material: "BC",
  artworks: [],
  selectedArtworkId: null,
  artworkDrag: null,
  geometry: null,
  transform: { scale: 1, x: 0, y: 0 },
  dragging: false,
  pointer: { x: 0, y: 0 }
};

const el = {
  form: document.querySelector("#boxForm"),
  materialGrid: document.querySelector("#materialGrid"),
  thickness: document.querySelector("#materialThickness"),
  boxTypeStatus: document.querySelector("#boxTypeStatus"),
  boxTypeEyebrow: document.querySelector("#boxTypeEyebrow"),
  ruleTitle: document.querySelector("#ruleTitle"),
  ruleFormula: document.querySelector("#ruleFormula"),
  ruleNote: document.querySelector("#ruleNote"),
  error: document.querySelector("#dimensionError"),
  svg: document.querySelector("#drawing"),
  viewport: document.querySelector("#viewport"),
  canvas: document.querySelector("#canvasWrap"),
  width: document.querySelector("#overallWidth"),
  height: document.querySelector("#overallHeight"),
  area: document.querySelector("#boardArea"),
  areaFormula: document.querySelector("#areaFormula"),
  zoom: document.querySelector("#zoomReadout"),
  manufacturingSummary: document.querySelector("#manufacturingSummary"),
  reset: document.querySelector("#resetButton"),
  fit: document.querySelector("#fitButton"),
  zoomIn: document.querySelector("#zoomInButton"),
  zoomOut: document.querySelector("#zoomOutButton"),
  settings: document.querySelector("#settingsButton"),
  settingsPanel: document.querySelector("#displaySettings"),
  download: document.querySelector("#downloadButton"),
  print: document.querySelector("#printButton"),
  lead: document.querySelector("#leadButton"),
  toast: document.querySelector("#toast")
};
el.artworkInput = document.querySelector("#artworkInput");
el.artworkList = document.querySelector("#artworkList");

function svgNode(name, attrs = {}, text = "") {
  const node = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  if (text) node.textContent = text;
  return node;
}

function renderMaterials() {
  el.materialGrid.innerHTML = materials.map((material) => `
    <label class="material-option" title="${material.layers} 层瓦楞纸板">
      <input type="radio" name="material" value="${material.code}" ${material.code === state.material ? "checked" : ""}>
      <span>${material.code}</span>
    </label>
  `).join("");
}

function readInputs() {
  return {
    boxType: document.querySelector('input[name="boxType"]:checked').value,
    L: Number(document.querySelector("#lengthInput").value),
    W: Number(document.querySelector("#widthInput").value),
    H: Number(document.querySelector("#heightInput").value),
    G: Number(document.querySelector("#glueInput").value),
    flapAdjustment: Number(document.querySelector("#flapAdjustmentInput").value),
    dimensionType: document.querySelector('input[name="dimensionType"]:checked').value
  };
}

function calculateBoardArea(Lmm, Wmm, Hmm) {
  const Lcm = Lmm / 10;
  const Wcm = Wmm / 10;
  const Hcm = Hmm / 10;
  const factorA = Lcm + Wcm + 8;
  const factorB = Wcm + Hcm + 4;
  return {
    factorA,
    factorB,
    squareMeters: factorA * factorB * 2 / 10000
  };
}

function generate0201({ L, W, H, G, flapAdjustment, dimensionType }) {
  const material = materials.find((item) => item.code === state.material);
  if (![L, W, H, G, flapAdjustment].every(Number.isFinite) || [L, W, H].some((n) => n < 50) || G < 10) {
    throw new Error("L、W、H 需不小于 50 mm，接舌 G 需不小于 10 mm，补偿需为有效数值。");
  }

  // MVP demo: inside/outside conversion is intentionally identity.
  const mL = L;
  const mW = W;
  const mH = H;
  const flap = (mW + flapAdjustment) / 2;
  if (flap <= 0) throw new Error("当前补偿使摇盖深度小于或等于 0，请调整 ΔF。");
  const glue = G;
  const halfSlot = material.slot / 2;
  const xs = [0, mL, mL + mW, 2 * mL + mW, 2 * (mL + mW), 2 * (mL + mW) + glue];
  const ys = [0, flap, flap + mH, 2 * flap + mH];
  const bodyNames = ["L1", "W1", "L2", "W2"];
  const faces = [];

  for (let i = 0; i < 4; i += 1) {
    faces.push({ id: bodyNames[i], x: xs[i], y: ys[1], w: xs[i + 1] - xs[i], h: mH, type: "body", alt: i % 2 === 1 });
    faces.push({ id: `TOP_${bodyNames[i]}`, x: xs[i] + (i ? halfSlot : 0), y: ys[0], w: xs[i + 1] - xs[i] - (i ? halfSlot : 0) - (i < 3 ? halfSlot : 0), h: flap, type: "flap", alt: i % 2 === 1 });
    faces.push({ id: `BOT_${bodyNames[i]}`, x: xs[i] + (i ? halfSlot : 0), y: ys[2], w: xs[i + 1] - xs[i] - (i ? halfSlot : 0) - (i < 3 ? halfSlot : 0), h: flap, type: "flap", alt: i % 2 === 1 });
  }
  faces.push({ id: "GLUE", x: xs[4], y: ys[1], w: glue, h: mH, type: "glue", alt: true });

  const creases = [
    ...xs.slice(1, 5).map((x, i) => ({ id: `V${i + 1}`, x1: x, y1: ys[1], x2: x, y2: ys[2] })),
    ...Array.from({ length: 4 }, (_, i) => ({ id: `T${i + 1}`, x1: xs[i], y1: ys[1], x2: xs[i + 1], y2: ys[1] })),
    ...Array.from({ length: 4 }, (_, i) => ({ id: `B${i + 1}`, x1: xs[i], y1: ys[2], x2: xs[i + 1], y2: ys[2] }))
  ];

  // Outer cuts plus U-shaped slots. The closed end of each slot is rounded at the crease.
  const cuts = [];
  faces.filter((face) => face.type === "flap").forEach((face) => {
    const outerY = face.y === 0 ? face.y : face.y + face.h;
    cuts.push({ x1: face.x, y1: outerY, x2: face.x + face.w, y2: outerY });
  });
  cuts.push(
    { x1: 0, y1: ys[0], x2: 0, y2: ys[1] },
    { x1: 0, y1: ys[1], x2: 0, y2: ys[2] },
    { x1: 0, y1: ys[2], x2: 0, y2: ys[3] },
    { x1: xs[4], y1: ys[0], x2: xs[4], y2: ys[1] },
    { x1: xs[4], y1: ys[2], x2: xs[4], y2: ys[3] },
    { x1: xs[4], y1: ys[1], x2: xs[5], y2: ys[1] },
    { x1: xs[5], y1: ys[1], x2: xs[5], y2: ys[2] },
    { x1: xs[5], y1: ys[2], x2: xs[4], y2: ys[2] }
  );
  const slotRadius = Math.max(material.slot / 2, 2);
  const slots = xs.slice(1, 4).flatMap((x, index) => {
    const left = x - halfSlot;
    const right = x + halfSlot;
    return [
      {
        id: `slot-top-${index + 1}`,
        d: `M ${left} ${ys[0]} L ${left} ${ys[1] - slotRadius} Q ${left} ${ys[1]} ${x} ${ys[1]} Q ${right} ${ys[1]} ${right} ${ys[1] - slotRadius} L ${right} ${ys[0]}`
      },
      {
        id: `slot-bottom-${index + 1}`,
        d: `M ${left} ${ys[3]} L ${left} ${ys[2] + slotRadius} Q ${left} ${ys[2]} ${x} ${ys[2]} Q ${right} ${ys[2]} ${right} ${ys[2] + slotRadius} L ${right} ${ys[3]}`
      }
    ];
  });

  return {
    boxType: "0201",
    layout: "0201",
    units: "mm",
    input: { L, W, H, G, flapAdjustment, dimensionType, material: material.code },
    assumptions: ["dimension conversion = identity", `flap depth = (W + ${flapAdjustment})/2`, `glue flap = ${G}mm`],
    bounds: { minX: 0, minY: 0, maxX: xs[5], maxY: ys[3] },
    faces,
    creases,
    cuts,
    slots,
    slotWidth: material.slot,
    metrics: { overallWidth: xs[5], overallHeight: ys[3], flapDepth: flap }
  };
}

function generateMortiseFlipLegacy({ L, W, H, dimensionType }) {
  if (![L, W, H].every(Number.isFinite) || [L, W, H].some((n) => n < 30)) {
    throw new Error("双扣内盒的 L、W、H 需为不小于 30 mm 的有效数值。");
  }

  // Candidate ratios reconstructed from the supplied traced SVG and its 158 × 120 × 52 mm labels.
  // They produce the agreed 305 × 361 mm theoretical envelope at the reference size. These remain
  // configurable demo rules and require a dimensioned dieline/factory sample for production use.
  const ear = H * (43 / 104);
  const lockDepth = H * (17 / 52);
  const sideDepth = H;
  const centerX = ear + sideDepth;
  const rightX = centerX + L;
  const outerRight = rightX + sideDepth + ear;
  const y0 = 0;
  const y1 = lockDepth;
  const y2 = y1 + W;
  const y3 = y2 + H;
  const y4 = y3 + W;
  const y5 = y4 + H;
  const corner = Math.min(8, H * 0.16);
  const outerCorner = Math.min(8, H * 0.17);
  const hook = Math.min(ear * 0.82, H * 0.36);
  const neck = Math.min(ear * 0.28, H * 0.12);

  const faces = [
    { id: "LID", x: centerX, y: y1, w: L, h: W, type: "body" },
    { id: "BACK", x: centerX, y: y2, w: L, h: H, type: "panel", alt: true },
    { id: "BASE", x: centerX, y: y3, w: L, h: W, type: "body" },
    { id: "FRONT", x: centerX, y: y4, w: L, h: H, type: "panel", alt: true },
    { id: "SIDE_L", x: centerX - H, y: y3, w: H, h: W, type: "panel" },
    { id: "SIDE_R", x: rightX, y: y3, w: H, h: W, type: "panel" }
  ];

  const topLockPath = [
    `M ${centerX + 10} ${y1}`,
    `L ${centerX + 10} ${corner}`,
    `Q ${centerX + 10} ${y0} ${centerX + 10 + corner} ${y0}`,
    `L ${rightX - 10 - corner} ${y0}`,
    `Q ${rightX - 10} ${y0} ${rightX - 10} ${corner}`,
    `L ${rightX - 10} ${y1}`,
    `L ${centerX + 10} ${y1} Z`
  ].join(" ");
  const topLockCutPath = [
    `M ${centerX + 10} ${y1}`,
    `L ${centerX + 10} ${corner}`,
    `Q ${centerX + 10} ${y0} ${centerX + 10 + corner} ${y0}`,
    `L ${rightX - 10 - corner} ${y0}`,
    `Q ${rightX - 10} ${y0} ${rightX - 10} ${corner}`,
    `L ${rightX - 10} ${y1}`
  ].join(" ");

  const wingPath = (side, top, closePath = true) => {
    const isLeft = side === "left";
    const yTop = top ? y2 : y4;
    const yBottom = yTop + H;
    const edge = isLeft ? centerX : rightX;
    const inner = isLeft ? edge - H : edge + H;
    const outer = isLeft ? inner - ear : inner + ear;
    const direction = isLeft ? -1 : 1;
    return [
      `M ${edge} ${yTop}`,
      `L ${inner} ${yTop}`,
      `L ${inner + direction * neck} ${yTop + H * 0.22}`,
      `L ${inner + direction * neck} ${yBottom - hook}`,
      `C ${inner + direction * neck} ${yBottom - hook * 0.35} ${outer} ${yBottom - hook * 0.65} ${outer} ${yBottom - hook}`,
      `L ${outer} ${yBottom - corner}`,
      `Q ${outer} ${yBottom} ${outer - direction * corner} ${yBottom}`,
      `L ${edge} ${yBottom}`,
      closePath ? `Z` : ``
    ].join(" ");
  };

  const sidePanelPath = (side, closePath = true) => {
    const isLeft = side === "left";
    const edge = isLeft ? centerX : rightX;
    const inner = isLeft ? edge - H : edge + H;
    const outer = isLeft ? 0 : outerRight;
    const direction = isLeft ? -1 : 1;
    const notchRun = Math.min(ear * 0.58, 12);
    return [
      `M ${edge} ${y3}`,
      `L ${outer + direction * -outerCorner} ${y3}`,
      `Q ${outer} ${y3} ${outer} ${y3 + outerCorner}`,
      `L ${outer} ${y4 - outerCorner * 1.25}`,
      `Q ${outer} ${y4} ${outer - direction * outerCorner} ${y4}`,
      `L ${inner + direction * notchRun} ${y4}`,
      `Q ${inner + direction * notchRun * 0.62} ${y4} ${inner + direction * notchRun * 0.48} ${y4 + neck * 0.45}`,
      `L ${inner} ${y4}`,
      `L ${edge} ${y4}`,
      closePath ? "Z" : ""
    ].join(" ");
  };

  const frontNotch = Math.min(18, L * 0.09);
  const frontCutPath = [
    `M ${centerX} ${y5}`,
    `L ${centerX + L / 2 - frontNotch} ${y5}`,
    `A ${frontNotch} ${frontNotch * 0.55} 0 0 0 ${centerX + L / 2 + frontNotch} ${y5}`,
    `L ${rightX} ${y5}`
  ].join(" ");

  const facePaths = [
    { id: "TOP_LOCK", d: topLockPath },
    { id: "WING_BACK_L", d: wingPath("left", true) },
    { id: "WING_BACK_R", d: wingPath("right", true) },
    { id: "SIDE_PANEL_L", d: sidePanelPath("left") },
    { id: "SIDE_PANEL_R", d: sidePanelPath("right") },
    { id: "WING_FRONT_L", d: wingPath("left", false) },
    { id: "WING_FRONT_R", d: wingPath("right", false) }
  ];

  const cuts = [
    { x1: centerX, y1, x2: centerX + 10, y2: y1 },
    { x1: rightX - 10, y1, x2: rightX, y2: y1 },
    { x1: centerX, y1: y1, x2: centerX, y2: y2 },
    { x1: rightX, y1: y1, x2: rightX, y2: y2 },
    { x1: centerX - H, y1: y3, x2: centerX, y2: y3 },
    { x1: rightX, y1: y3, x2: rightX + H, y2: y3 },
    { x1: centerX - H, y1: y4, x2: centerX, y2: y4 },
    { x1: rightX, y1: y4, x2: rightX + H, y2: y4 }
  ];

  const creases = [
    { id: "LOCK_LID", x1: centerX + 10, y1, x2: rightX - 10, y2: y1 },
    { id: "LID_BACK", x1: centerX, y1: y2, x2: rightX, y2 },
    { id: "BACK_BASE", x1: centerX, y1: y3, x2: rightX, y2: y3 },
    { id: "BASE_FRONT", x1: centerX, y1: y4, x2: rightX, y2: y4 },
    { id: "BACK_WING_L", x1: centerX, y1: y2, x2: centerX, y2: y3 },
    { id: "BACK_WING_R", x1: rightX, y1: y2, x2: rightX, y2: y3 },
    { id: "BASE_SIDE_L", x1: centerX, y1: y3, x2: centerX, y2: y4 },
    { id: "BASE_SIDE_R", x1: rightX, y1: y3, x2: rightX, y2: y4 },
    { id: "FRONT_WING_L", x1: centerX, y1: y4, x2: centerX, y2: y5 },
    { id: "FRONT_WING_R", x1: rightX, y1: y4, x2: rightX, y2: y5 }
  ];

  return {
    boxType: "double-lock-inner",
    layout: "double-lock-inner",
    units: "mm",
    input: { L, W, H, G: 0, flapAdjustment: 0, dimensionType, material: state.material },
    assumptions: ["side lock ear = 43H/104", "top lock depth = 17H/52", "visual-reference demo geometry"],
    bounds: { minX: 0, minY: 0, maxX: outerRight, maxY: y5 },
    faces,
    facePaths,
    creases,
    cuts,
    cutPaths: [
      { id: "cut-TOP_LOCK", d: topLockCutPath },
      { id: "cut-WING_BACK_L", d: wingPath("left", true, false) },
      { id: "cut-WING_BACK_R", d: wingPath("right", true, false) },
      { id: "cut-SIDE_PANEL_L", d: sidePanelPath("left", false) },
      { id: "cut-SIDE_PANEL_R", d: sidePanelPath("right", false) },
      { id: "cut-WING_FRONT_L", d: wingPath("left", false, false) },
      { id: "cut-WING_FRONT_R", d: wingPath("right", false, false) },
      { id: "cut-front-notch", d: frontCutPath }
    ],
    slots: [],
    annotations: [
      { axis: "x", x1: centerX, y1: y3 + W * 0.7, x2: rightX, y2: y3 + W * 0.7, label: `L = ${L} mm` },
      { axis: "y", x1: centerX + L * 0.28, y1: y3, x2: centerX + L * 0.28, y2: y4, label: `W = ${W} mm` },
      { axis: "y", x1: centerX + L * 0.76, y1: y2, x2: centerX + L * 0.76, y2: y3, label: `H = ${H} mm` }
    ],
    metrics: { overallWidth: outerRight, overallHeight: y5, flapDepth: lockDepth }
  };
}

// Vector master extracted from 双扣内盒.svg. Black = cut line, red = crease line.
// The source was traced from a screenshot, so this first preview preserves its outline and
// fits it to the agreed envelope. Semantic L/W/H stretch zones are the next calibration step.
const doubleLockMaster = {
  minX: 3108,
  minY: 3072,
  width: 728.5,
  height: 777.5,
  cut: `M3290.5 3116V3092.5C3292.5 3085.67 3299.8 3072 3313 3072M3314.5 3123.5C3314.5 3118.7 3311.83 3116.5 3310.5 3116H3290.5M3290.5 3116H3287.5M3313 3072C3326.2 3072 3529.5 3072 3629.5 3072M3652.5 3095C3652.5 3078.2 3637.17 3072.67 3629.5 3072H3313M3652.5 3095C3652.5 3101.8 3652.5 3111.83 3652.5 3116M3652.5 3095V3116M3652.5 3116H3637C3634.5 3116.17 3629.5 3117.9 3629.5 3123.5M3652.5 3116H3658.5V3359.5L3663 3368H3751L3774.5 3425C3777 3428.5 3782.1 3433.4 3782.5 3425C3782.9 3416.6 3782.5 3391.5 3782.5 3385C3782.5 3378.5 3788 3368 3804.5 3368C3821 3368 3829.5 3375 3829.5 3385V3392.5V3464C3829.5 3472.5 3830.42 3477.5 3818 3477.5M3836.5 3503.69C3836.5 3485.5 3833.5 3485.5 3826 3485.5H3663C3663 3485.5 3659.33 3478.05 3663 3477.5C3711.5 3477.5 3810.4 3477.5 3818 3477.5M3818 3477.5H3663M3826 3718C3836 3718 3837.17 3705 3836.5 3698.5C3836.5 3640.17 3836.5 3519.54 3836.5 3503.69M3836.5 3503.69V3698.5M3782.5 3793.5C3782.5 3798 3776.5 3798 3774.5 3793.5L3751 3735.5C3725.67 3736.17 3666 3735.5 3663 3735.5C3654 3735.5 3658.5 3727.5 3663 3729H3778.5L3782.5 3725H3804.5L3812 3718C3814 3718 3819.6 3718 3826 3718M3826 3718H3812M3782.5 3793.5C3782.5 3786.3 3782.5 3763.5 3782.5 3753M3818 3845C3826 3845 3829 3837.33 3829.5 3833.5V3753C3827 3747.17 3818.5 3735.5 3804.5 3735.5C3790.5 3735.5 3784 3747.17 3782.5 3753V3793.5M3288.5 3849.5C3353.33 3849.5 3389.67 3849.5 3454.5 3849.5C3454.5 3841 3455.5 3829.5 3472 3829.5C3488.5 3829.5 3491.5 3838 3491.5 3849.5H3658.5L3663 3845C3711.33 3845 3810 3845 3818 3845M3818 3845H3663M3127.5 3845H3282.5L3288.5 3849.5H3454.5M3282.5 3845C3282.5 3845 3134 3845 3127.5 3845M3163 3789.5C3163 3785 3163 3756.5 3163 3756.5C3161 3748.67 3153.1 3733.5 3137.5 3735.5C3121.9 3737.5 3116.33 3750.33 3115.5 3756.5V3777V3829.5C3115.5 3844.3 3121 3845 3127.5 3845M3163 3756.5V3789.5M3163 3789.5C3163 3794 3166.5 3796.5 3169.5 3793.5C3171.86 3789.5 3187.5 3753.5 3194 3735.5H3282.5C3284.17 3735.17 3287.4 3733.9 3287 3731.5C3286.6 3729.1 3283.83 3728.17 3282.5 3728H3163V3724.5H3141.5L3135.5 3717.5H3119.5C3115.83 3716.83 3108.4 3713.1 3108 3703.5C3107.6 3693.9 3107.83 3562.83 3108 3498.5C3107.33 3493.67 3108.9 3484 3120.5 3484M3120.5 3484C3132.1 3484 3233.67 3484 3283 3484M3310.5 3116H3287.5V3360L3283 3367H3194.5C3187.83 3382.33 3173.8 3414.9 3171 3422.5C3168.2 3430.1 3164.83 3427.33 3163.5 3425C3163.5 3410.36 3163.5 3402.14 3163.5 3387.5C3163 3380.67 3163.5 3367 3139 3367C3114.5 3367 3115.33 3380.67 3115 3387.5C3114.83 3407.67 3114.6 3450.9 3115 3462.5C3115.4 3474.1 3123.5 3477 3127.5 3477H3283C3284.83 3477.17 3288.3 3478.2 3287.5 3481C3286.7 3483.8 3284.17 3484.17 3283 3484H3120.5M3163.5 3387.5V3425`,
  creases: [
    `M3314.5 3120H3629.5M3658 3361V3484H3287.5V3361M3283.5 3486V3728H3287.5M3661 3484V3728H3657.5M3782 3484V3726M3163 3484V3722.5M3657.5 3728V3848M3657.5 3728H3287.5M3287.5 3728V3848.5`,
    `M3288.5 3361.5H3656.5`
  ]
};

function piecewiseMap(value, sourceKnots, targetKnots) {
  let index = sourceKnots.findIndex((knot) => value <= knot);
  if (index <= 0) index = 1;
  if (index >= sourceKnots.length) index = sourceKnots.length - 1;
  const sourceStart = sourceKnots[index - 1];
  const sourceEnd = sourceKnots[index];
  const targetStart = targetKnots[index - 1];
  const targetEnd = targetKnots[index];
  const ratio = (value - sourceStart) / (sourceEnd - sourceStart);
  return targetStart + ratio * (targetEnd - targetStart);
}

function mapMasterPath(d, mapX, mapY) {
  const tokens = d.match(/[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) || [];
  const arity = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
  const output = [];
  let command = null;
  let cursor = 0;
  while (cursor < tokens.length) {
    if (/^[A-Za-z]$/.test(tokens[cursor])) {
      command = tokens[cursor].toUpperCase();
      output.push(command);
      cursor += 1;
      if (command === "Z") continue;
    }
    const count = arity[command];
    if (!count || cursor + count > tokens.length) break;
    const values = tokens.slice(cursor, cursor + count).map(Number);
    if (command === "H") values[0] = mapX(values[0]);
    else if (command === "V") values[0] = mapY(values[0]);
    else if (command === "A") {
      values[5] = mapX(values[5]);
      values[6] = mapY(values[6]);
    } else {
      for (let i = 0; i < values.length; i += 2) {
        values[i] = mapX(values[i]);
        values[i + 1] = mapY(values[i + 1]);
      }
    }
    output.push(values.map((value) => Number(value.toFixed(3))).join(" "));
    cursor += count;
  }
  return output.join(" ");
}

function generateDoubleLockMaster({ L, W, H, dimensionType }) {
  if (![L, W, H].every(Number.isFinite) || [L, W, H].some((n) => n < 30)) {
    throw new Error("双扣内盒的 L、W、H 需为不小于 30 mm 的有效数值。");
  }
  const overallWidth = L + 2 * H + H * (43 / 52);
  const overallHeight = 2 * W + 2 * H + H * (17 / 52);
  const ear = H * (43 / 104);
  const lockDepth = H * (17 / 52);
  const centerLeft = H + ear;
  const sourceX = [3108, 3287.5, 3658.5, 3836.5];
  const targetX = [0, centerLeft, centerLeft + L, overallWidth];
  const sourceY = [3072, 3120, 3361, 3484, 3728, 3849.5];
  const targetY = [0, lockDepth, lockDepth + W, lockDepth + W + H, lockDepth + 2 * W + H, overallHeight];
  const mapX = (value) => piecewiseMap(value, sourceX, targetX);
  const mapY = (value) => piecewiseMap(value, sourceY, targetY);
  const yLidBottom = lockDepth + W;
  const yBackBottom = yLidBottom + H;
  const yBaseBottom = yBackBottom + W;
  return {
    boxType: "double-lock-inner",
    layout: "double-lock-inner",
    units: "mm",
    input: { L, W, H, G: 0, flapAdjustment: 0, dimensionType, material: state.material },
    assumptions: ["uploaded vector master", "semantic L/W/H stretch zones", "lock details scale with H"],
    bounds: { minX: 0, minY: 0, maxX: overallWidth, maxY: overallHeight },
    faces: [],
    creases: [],
    cuts: [],
    slots: [],
    cutPaths: [{ id: "double-lock-master-cut", d: mapMasterPath(doubleLockMaster.cut, mapX, mapY) }],
    creasePaths: doubleLockMaster.creases.map((d, index) => ({ id: `double-lock-master-crease-${index + 1}`, d: mapMasterPath(d, mapX, mapY) })),
    annotations: [
      { axis: "x", x1: centerLeft, y1: yBackBottom + W * 0.7, x2: centerLeft + L, y2: yBackBottom + W * 0.7, label: `L = ${L} mm` },
      { axis: "y", x1: centerLeft + L * 0.28, y1: yBackBottom, x2: centerLeft + L * 0.28, y2: yBaseBottom, label: `W = ${W} mm` },
      { axis: "y", x1: centerLeft + L * 0.76, y1: yLidBottom, x2: centerLeft + L * 0.76, y2: yBackBottom, label: `H = ${H} mm` }
    ],
    metrics: { overallWidth, overallHeight, flapDepth: lockDepth }
  };
}

function generateGeometry(input) {
  if (input.boxType === "double-lock-inner") return generateDoubleLockMaster(input);
  return generate0201(input);
}

function renderGeometry(geometry) {
  el.viewport.replaceChildren();

  const defs = svgNode("defs");
  const markerSpecs = [
    ["arrowStart", "#0878ff", "M 8 1 L 1 5 L 8 9", 1],
    ["arrowEnd", "#0878ff", "M 1 1 L 8 5 L 1 9", 8],
    ["arrowStartLight", "#81868e", "M 8 1 L 1 5 L 8 9", 1],
    ["arrowEndLight", "#81868e", "M 1 1 L 8 5 L 1 9", 8]
  ];
  markerSpecs.forEach(([id, color, path, refX]) => {
    const marker = svgNode("marker", { id, markerWidth: 9, markerHeight: 10, refX, refY: 5, orient: "auto", markerUnits: "strokeWidth" });
    marker.append(svgNode("path", { d: path, fill: "none", stroke: color, "stroke-width": 1.4 }));
    defs.append(marker);
  });
  el.viewport.append(defs);

  (geometry.facePaths || []).forEach((path) => {
    el.viewport.append(svgNode("path", { d: path.d, class: "sheet-face shape-face", "data-face-id": path.id }));
  });

  geometry.faces.forEach((face) => {
    el.viewport.append(svgNode("rect", {
      x: face.x, y: face.y, width: face.w, height: face.h,
      class: `sheet-face${face.alt ? " alt" : ""}`
    }));
  });

  const printableFaces = geometry.faces.filter((face) => face.type === "body");
  state.artworks.forEach((artwork, index) => {
    const face = printableFaces[index % printableFaces.length];
    const sameFaceIndex = Math.floor(index / printableFaces.length);
    const maxW = face.w * .48;
    const maxH = face.h * .42;
    const offset = sameFaceIndex * Math.min(18, face.h * .08);
    if (!artwork.position) {
      artwork.position = {
        x: face.x + (face.w - maxW) / 2,
        y: face.y + (face.h - maxH) / 2 + offset,
        width: maxW,
        height: maxH
      };
    }
    el.viewport.append(svgNode("image", {
      href: artwork.dataUrl,
      x: artwork.position.x,
      y: artwork.position.y,
      width: artwork.position.width,
      height: artwork.position.height,
      preserveAspectRatio: "xMidYMid meet",
      class: "artwork-image",
      "data-artwork-id": artwork.id
    }));
    if (state.selectedArtworkId === artwork.id) {
      el.viewport.append(svgNode("rect", {
        x: artwork.position.x - 3,
        y: artwork.position.y - 3,
        width: artwork.position.width + 6,
        height: artwork.position.height + 6,
        rx: 2,
        class: "artwork-selection editor-only",
        "data-selection-for": artwork.id
      }));
    }
  });

  geometry.cuts.forEach((line) => el.viewport.append(svgNode("line", {
    x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2, class: "cut-line"
  })));
  geometry.slots.forEach((slot) => el.viewport.append(svgNode("path", {
    d: slot.d, class: "cut-line slot-line", "data-slot-id": slot.id
  })));
  (geometry.cutPaths || []).forEach((path) => el.viewport.append(svgNode("path", {
    d: path.d, transform: path.transform, class: "cut-line shape-cut", "data-cut-id": path.id
  })));

  geometry.creases.forEach((line) => el.viewport.append(svgNode("line", {
    x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2, class: "crease-line"
  })));
  (geometry.creasePaths || []).forEach((path) => el.viewport.append(svgNode("path", {
    d: path.d, transform: path.transform, class: "crease-line", "data-crease-id": path.id
  })));

  geometry.faces.filter((face) => face.type === "body" || face.type === "glue").forEach((face) => {
    const x = face.x + face.w / 2;
    const y = face.y + face.h / 2;
    el.viewport.append(svgNode("text", { x, y: y - 5, class: "face-label" }, face.id));
    el.viewport.append(svgNode("text", { x, y: y + 12, class: "face-label sub" }, face.type === "glue" ? `${face.w} mm` : `${face.w} × ${face.h}`));
  });

  if (geometry.layout === "0201") {
    const bodyFaces = geometry.faces.filter((face) => face.type === "body");
    const lFace = bodyFaces[0];
    const wFace = bodyFaces[1];
    const hFace = bodyFaces[2];
    const glueFace = geometry.faces.find((face) => face.type === "glue");
    const inset = Math.min(32, lFace.h * 0.16);
    const horizontalDimension = (face, label, y) => {
      const pad = Math.min(28, face.w * 0.12);
      el.viewport.append(svgNode("line", { x1: face.x + pad, y1: y, x2: face.x + face.w - pad, y2: y, class: "panel-dimension" }));
      el.viewport.append(svgNode("text", { x: face.x + face.w / 2, y: y - 12, class: "panel-dimension-text" }, label));
    };
    horizontalDimension(lFace, `L = ${geometry.input.L} mm`, lFace.y + inset);
    horizontalDimension(wFace, `W = ${geometry.input.W} mm`, wFace.y + inset);
    const hX = hFace.x + hFace.w / 2;
    const hPad = Math.min(30, hFace.h * 0.18);
    el.viewport.append(svgNode("line", { x1: hX, y1: hFace.y + hPad, x2: hX, y2: hFace.y + hFace.h - hPad, class: "panel-dimension" }));
    const hText = svgNode("text", { x: hX - 15, y: hFace.y + hFace.h / 2, class: "panel-dimension-text", transform: `rotate(-90 ${hX - 15} ${hFace.y + hFace.h / 2})` }, `H = ${geometry.input.H} mm`);
    el.viewport.append(hText);
    if (glueFace) {
      const gPad = Math.min(8, glueFace.w * 0.12);
      const gY = glueFace.y + glueFace.h / 2;
      el.viewport.append(svgNode("line", { x1: glueFace.x + gPad, y1: gY, x2: glueFace.x + glueFace.w - gPad, y2: gY, class: "panel-dimension glue-dimension" }));
      el.viewport.append(svgNode("text", { x: glueFace.x + glueFace.w / 2, y: gY - 13, class: "panel-dimension-text glue-dimension" }, `G = ${geometry.input.G} mm`));
    }
  } else {
    (geometry.annotations || []).forEach((annotation) => {
      el.viewport.append(svgNode("line", { x1: annotation.x1, y1: annotation.y1, x2: annotation.x2, y2: annotation.y2, class: "panel-dimension" }));
      const tx = (annotation.x1 + annotation.x2) / 2;
      const ty = (annotation.y1 + annotation.y2) / 2;
      const attrs = { x: tx, y: annotation.axis === "x" ? ty - 12 : ty - 14, class: "panel-dimension-text" };
      if (annotation.axis === "y") attrs.transform = `rotate(-90 ${tx - 14} ${ty})`, attrs.x = tx - 14, attrs.y = ty;
      el.viewport.append(svgNode("text", attrs, annotation.label));
    });
  }

  const margin = 26;
  el.viewport.append(svgNode("line", { x1: 0, y1: -margin / 2, x2: geometry.bounds.maxX, y2: -margin / 2, class: "dimension-line total-dimension" }));
  el.viewport.append(svgNode("text", { x: geometry.bounds.maxX / 2, y: -margin / 2 - 6, class: "dimension-text" }, `${geometry.metrics.overallWidth} mm`));
  el.viewport.append(svgNode("line", { x1: -margin / 2, y1: 0, x2: -margin / 2, y2: geometry.bounds.maxY, class: "dimension-line total-dimension" }));
  const verticalText = svgNode("text", { x: -margin / 2 - 6, y: geometry.bounds.maxY / 2, class: "dimension-text", transform: `rotate(-90 ${-margin / 2 - 6} ${geometry.bounds.maxY / 2})` }, `${geometry.metrics.overallHeight} mm`);
  el.viewport.append(verticalText);

  el.width.textContent = `${geometry.metrics.overallWidth} mm`;
  el.height.textContent = `${geometry.metrics.overallHeight} mm`;
  el.manufacturingSummary.textContent = geometry.layout === "0201"
    ? `${geometry.input.L} × ${geometry.input.W} × ${geometry.input.H} mm · 接舌 ${geometry.input.G} mm`
    : `${geometry.input.L} × ${geometry.input.W} × ${geometry.input.H} mm · 双扣内盒`;
  const area = calculateBoardArea(geometry.input.L, geometry.input.W, geometry.input.H);
  el.area.textContent = `${area.squareMeters.toFixed(4)} ㎡`;
  el.areaFormula.textContent = `(${area.factorA.toFixed(1)} × ${area.factorB.toFixed(1)} × 2) ÷ 10000`;
  el.thickness.textContent = `${materials.find((item) => item.code === state.material).thickness.toFixed(1)} mm（示例）`;
  if (geometry.layout === "0201") {
    el.boxTypeStatus.textContent = "FEFCO 0201 · 理论预览";
    el.boxTypeEyebrow.textContent = "FEFCO 0201";
    el.ruleTitle.textContent = "当前摇盖规则";
    el.ruleFormula.textContent = "FlapDepth = (W + ΔF) ÷ 2";
    el.ruleNote.textContent = "当前 ΔF=26.6 mm，用于复现本次工厂计算结果；正式系统由后台维护。";
  } else {
    el.boxTypeStatus.textContent = "双扣内盒 · 理论母版";
    el.boxTypeEyebrow.textContent = "DOUBLE LOCK INNER";
    el.ruleTitle.textContent = "当前 SVG 母版规则";
    el.ruleFormula.textContent = "L/W/H 分区伸缩 · 卡扣随共享边移动";
    el.ruleNote.textContent = "本版已按母版压线位置划分长、宽、高区域；卡扣细节暂随 H 比例变化，仍需实样校准。";
  }
  el.svg.setAttribute("viewBox", `${-margin} ${-margin} ${geometry.bounds.maxX + margin * 2} ${geometry.bounds.maxY + margin * 2}`);
  state.geometry = geometry;
  fitDrawing();
}

function update() {
  try {
    el.error.textContent = "";
    renderGeometry(generateGeometry(readInputs()));
  } catch (error) {
    el.error.textContent = error.message;
  }
}

function applyTransform() {
  el.viewport.style.transform = `translate(${state.transform.x}px, ${state.transform.y}px) scale(${state.transform.scale})`;
  el.zoom.textContent = `${Math.round(state.transform.scale * 100)}%`;
  updateReadableAnnotations();
}

function updateReadableAnnotations() {
  if (!state.geometry || !el.canvas.clientWidth) return;
  const viewBoxWidth = state.geometry.metrics.overallWidth + 52;
  const unitsPerPixel = viewBoxWidth / el.canvas.clientWidth;
  const mode = document.body.dataset.fontSize || "standard";
  const modeScale = mode === "large" ? 1.2 : mode === "small" ? .86 : 1;
  const readableSize = (screenPixels) => {
    const size = screenPixels * modeScale * unitsPerPixel / state.transform.scale;
    return Math.max(8, Math.min(72, size));
  };
  el.viewport.querySelectorAll(".panel-dimension-text").forEach((node) => {
    node.style.fontSize = `${readableSize(14)}px`;
  });
  el.viewport.querySelectorAll(".dimension-text").forEach((node) => {
    node.style.fontSize = `${readableSize(13)}px`;
  });
  el.viewport.querySelectorAll(".face-label").forEach((node) => {
    node.style.fontSize = `${readableSize(11)}px`;
  });
}

function fitDrawing() {
  state.transform = { scale: 1, x: 0, y: 0 };
  applyTransform();
}

function downloadSvg() {
  if (!state.geometry) return;
  const clone = el.svg.cloneNode(true);
  clone.setAttribute("width", `${state.geometry.metrics.overallWidth}mm`);
  clone.setAttribute("height", `${state.geometry.metrics.overallHeight}mm`);
  clone.querySelector("#viewport").removeAttribute("style");
  clone.querySelectorAll(".editor-only").forEach((node) => node.remove());
  const embeddedStyle = svgNode("style");
  embeddedStyle.textContent = `
    .sheet-face { fill: #fff; }
    .cut-line { fill: none; stroke: #182052; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
    .crease-line { fill: none; stroke: #ff535a; stroke-width: 1.45; stroke-dasharray: 4 3; }
    .panel-dimension { fill: none; stroke: #0878ff; stroke-width: 1.5; marker-start: url(#arrowStart); marker-end: url(#arrowEnd); }
    .panel-dimension-text { fill: #0878ff; paint-order: stroke; stroke: #fff; stroke-width: 6px; font: 800 13px sans-serif; text-anchor: middle; dominant-baseline: middle; }
    .dimension-line { stroke: #858990; stroke-width: 1; marker-start: url(#arrowStartLight); marker-end: url(#arrowEndLight); }
    .dimension-text { fill: #4f5359; font: 700 12px sans-serif; text-anchor: middle; paint-order: stroke; stroke: #fff; stroke-width: 5px; }
    .face-label { display: none; }
  `;
  clone.insertBefore(embeddedStyle, clone.firstChild);
  const source = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
  const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `ZWPACK-${state.geometry.boxType}-${state.geometry.input.L}x${state.geometry.input.W}x${state.geometry.input.H}-${state.geometry.input.material}-DEMO.svg`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("理论刀版 SVG 已下载");
}

let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  el.toast.textContent = message;
  el.toast.classList.add("show");
  toastTimer = setTimeout(() => el.toast.classList.remove("show"), 2200);
}

function renderArtworkList() {
  el.artworkList.replaceChildren();
  state.artworks.forEach((artwork) => {
    const row = document.createElement("div");
    row.className = "artwork-item";
    const preview = document.createElement("img");
    preview.src = artwork.dataUrl;
    preview.alt = "";
    const name = document.createElement("span");
    name.textContent = artwork.name;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.setAttribute("aria-label", `删除 ${artwork.name}`);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      state.artworks = state.artworks.filter((item) => item.id !== artwork.id);
      renderArtworkList();
      update();
    });
    row.append(preview, name, remove);
    el.artworkList.append(row);
  });
}

function fileToArtwork(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      type: file.type,
      dataUrl: reader.result,
      position: null
    });
    reader.onerror = () => reject(new Error(`无法读取 ${file.name}`));
    reader.readAsDataURL(file);
  });
}

el.artworkInput.addEventListener("change", async () => {
  const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
  const selected = Array.from(el.artworkInput.files || []);
  const valid = selected.filter((file) => allowedTypes.has(file.type) && file.size <= 5 * 1024 * 1024);
  if (valid.length !== selected.length) showToast("已跳过格式不支持或超过 5MB 的图片");
  const remaining = Math.max(0, 12 - state.artworks.length);
  try {
    const added = await Promise.all(valid.slice(0, remaining).map(fileToArtwork));
    state.artworks.push(...added);
    renderArtworkList();
    update();
    if (added.length) showToast(`已添加 ${added.length} 张图片`);
    if (valid.length > remaining) showToast("Demo 最多同时预览 12 张图片");
  } catch (error) {
    showToast(error.message);
  } finally {
    el.artworkInput.value = "";
  }
});

el.form.addEventListener("input", (event) => {
  if (event.target.name === "material") state.material = event.target.value;
  if (event.target.name === "boxType") return;
  update();
});
document.querySelectorAll('input[name="boxType"]').forEach((input) => {
  input.addEventListener("change", (event) => {
    if (!event.target.checked) return;
    document.body.dataset.boxType = event.target.value;
    const isDoubleLock = event.target.value === "double-lock-inner";
    document.querySelector("#lengthInput").value = isDoubleLock ? 158 : 500;
    document.querySelector("#widthInput").value = isDoubleLock ? 120 : 380;
    document.querySelector("#heightInput").value = isDoubleLock ? 52 : 400;
    state.artworks.forEach((artwork) => { artwork.position = null; });
    update();
  });
});
el.fit.addEventListener("click", fitDrawing);
el.zoomIn.addEventListener("click", () => {
  state.transform.scale = Math.min(2.5, state.transform.scale * 1.15);
  applyTransform();
});
el.zoomOut.addEventListener("click", () => {
  state.transform.scale = Math.max(.6, state.transform.scale / 1.15);
  applyTransform();
});
el.settings.addEventListener("click", () => {
  el.settingsPanel.hidden = !el.settingsPanel.hidden;
  el.settings.setAttribute("aria-expanded", el.settingsPanel.hidden ? "false" : "true");
});
document.querySelector("#toggleOverall").addEventListener("change", (event) => {
  el.viewport.classList.toggle("hide-overall-dimensions", !event.target.checked);
});
document.querySelector("#toggleBasic").addEventListener("change", (event) => {
  el.viewport.classList.toggle("hide-basic-dimensions", !event.target.checked);
});
document.querySelector("#toggleFaces").addEventListener("change", (event) => {
  el.viewport.classList.toggle("show-face-names", event.target.checked);
});
el.download.addEventListener("click", downloadSvg);
el.print.addEventListener("click", () => window.print());
el.lead.addEventListener("click", () => showToast("Demo：正式版将在这里保存尺寸并提交询盘"));
el.reset.addEventListener("click", () => {
  document.querySelector("#lengthInput").value = 500;
  document.querySelector("#widthInput").value = 380;
  document.querySelector("#heightInput").value = 400;
  document.querySelector("#glueInput").value = 60;
  document.querySelector("#flapAdjustmentInput").value = 26.6;
  document.querySelector('input[name="boxType"][value="0201"]').checked = true;
  document.querySelector('input[name="dimensionType"][value="inside"]').checked = true;
  document.body.dataset.boxType = "0201";
  state.material = "BC";
  state.artworks = [];
  renderMaterials();
  renderArtworkList();
  update();
});

el.canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  const next = Math.min(2.5, Math.max(.6, state.transform.scale * (event.deltaY > 0 ? .9 : 1.1)));
  state.transform.scale = next;
  applyTransform();
}, { passive: false });

el.canvas.addEventListener("pointerdown", (event) => {
  if (event.target.closest?.(".display-settings")) return;
  state.dragging = true;
  state.pointer = { x: event.clientX - state.transform.x, y: event.clientY - state.transform.y };
  el.canvas.setPointerCapture(event.pointerId);
});
el.canvas.addEventListener("pointermove", (event) => {
  if (!state.dragging) return;
  state.transform.x = event.clientX - state.pointer.x;
  state.transform.y = event.clientY - state.pointer.y;
  applyTransform();
});
el.canvas.addEventListener("pointerup", () => { state.dragging = false; });

function pointerToGeometry(event) {
  const matrix = el.viewport.getScreenCTM();
  if (!matrix) return null;
  const point = el.svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(matrix.inverse());
}

el.svg.addEventListener("pointerdown", (event) => {
  const imageNode = event.target.closest?.(".artwork-image");
  if (!imageNode) return;
  event.stopPropagation();
  const artwork = state.artworks.find((item) => item.id === imageNode.dataset.artworkId);
  const point = pointerToGeometry(event);
  if (!artwork || !point || !artwork.position) return;
  state.selectedArtworkId = artwork.id;
  state.artworkDrag = {
    id: artwork.id,
    offsetX: point.x - artwork.position.x,
    offsetY: point.y - artwork.position.y,
    node: imageNode
  };
  imageNode.classList.add("dragging");
  el.svg.setPointerCapture(event.pointerId);
  updateArtworkSelection(artwork);
});

function updateArtworkSelection(artwork) {
  el.viewport.querySelectorAll(".artwork-selection").forEach((node) => node.remove());
  if (!artwork?.position) return;
  el.viewport.append(svgNode("rect", {
    x: artwork.position.x - 3,
    y: artwork.position.y - 3,
    width: artwork.position.width + 6,
    height: artwork.position.height + 6,
    rx: 2,
    class: "artwork-selection editor-only",
    "data-selection-for": artwork.id
  }));
}

el.svg.addEventListener("pointermove", (event) => {
  if (!state.artworkDrag || !state.geometry) return;
  event.stopPropagation();
  const artwork = state.artworks.find((item) => item.id === state.artworkDrag.id);
  const point = pointerToGeometry(event);
  if (!artwork || !point) return;
  const { bounds } = state.geometry;
  artwork.position.x = Math.min(bounds.maxX - artwork.position.width, Math.max(bounds.minX, point.x - state.artworkDrag.offsetX));
  artwork.position.y = Math.min(bounds.maxY - artwork.position.height, Math.max(bounds.minY, point.y - state.artworkDrag.offsetY));
  state.artworkDrag.node.setAttribute("x", artwork.position.x);
  state.artworkDrag.node.setAttribute("y", artwork.position.y);
  updateArtworkSelection(artwork);
});

function finishArtworkDrag(event) {
  if (!state.artworkDrag) return;
  state.artworkDrag.node.classList.remove("dragging");
  state.artworkDrag = null;
  if (el.svg.hasPointerCapture?.(event.pointerId)) el.svg.releasePointerCapture(event.pointerId);
}

el.svg.addEventListener("pointerup", finishArtworkDrag);
el.svg.addEventListener("pointercancel", finishArtworkDrag);

function setFontSize(size) {
  const allowed = ["small", "standard", "large"];
  const selected = allowed.includes(size) ? size : "standard";
  document.body.dataset.fontSize = selected;
  document.querySelectorAll("[data-font-size]").forEach((button) => {
    button.classList.toggle("active", button.dataset.fontSize === selected);
    button.setAttribute("aria-pressed", button.dataset.fontSize === selected ? "true" : "false");
  });
  try { localStorage.setItem("zwpack-font-size", selected); } catch (_) { /* file mode may block storage */ }
  updateReadableAnnotations();
}

document.querySelectorAll("[data-font-size]").forEach((button) => {
  button.addEventListener("click", () => setFontSize(button.dataset.fontSize));
});

renderMaterials();
document.body.dataset.boxType = document.querySelector('input[name="boxType"]:checked').value;
let savedFontSize = "standard";
try { savedFontSize = localStorage.getItem("zwpack-font-size") || "standard"; } catch (_) { /* use default */ }
setFontSize(savedFontSize);
update();
window.addEventListener("resize", updateReadableAnnotations);
