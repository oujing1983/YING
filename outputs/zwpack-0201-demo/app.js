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

function generateMortiseFlip({ L, W, H, dimensionType }) {
  if (![L, W, H].every(Number.isFinite) || [L, W, H].some((n) => n < 30)) {
    throw new Error("榫锁翻盖盒的 L、W、H 需为不小于 30 mm 的有效数值。");
  }

  // Candidate demo ratios inferred from the supplied reference screenshot.
  // They must remain configurable and require a factory sample before production use.
  const ear = H * 0.4;
  const lockDepth = H * 0.4;
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
  const corner = Math.min(12, lockDepth * 0.55);
  const hook = Math.min(ear * 0.72, H * 0.34);
  const neck = Math.min(ear * 0.35, H * 0.18);

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
    { id: "WING_FRONT_L", d: wingPath("left", false) },
    { id: "WING_FRONT_R", d: wingPath("right", false) }
  ];

  const cuts = [
    { x1: centerX, y1, x2: centerX + 10, y2: y1 },
    { x1: rightX - 10, y1, x2: rightX, y2: y1 },
    { x1: centerX, y1: y1, x2: centerX, y2: y2 },
    { x1: rightX, y1: y1, x2: rightX, y2: y2 },
    { x1: centerX - H, y1: y3, x2: centerX - H, y2: y4 },
    { x1: rightX + H, y1: y3, x2: rightX + H, y2: y4 },
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
    boxType: "mortise-flip",
    layout: "mortise-flip",
    units: "mm",
    input: { L, W, H, G: 0, flapAdjustment: 0, dimensionType, material: state.material },
    assumptions: ["side lock ear = 0.4H", "top lock depth = 0.4H", "theoretical demo geometry"],
    bounds: { minX: 0, minY: 0, maxX: outerRight, maxY: y5 },
    faces,
    facePaths,
    creases,
    cuts,
    cutPaths: [
      { id: "cut-TOP_LOCK", d: topLockCutPath },
      { id: "cut-WING_BACK_L", d: wingPath("left", true, false) },
      { id: "cut-WING_BACK_R", d: wingPath("right", true, false) },
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

function generateGeometry(input) {
  return input.boxType === "mortise-flip" ? generateMortiseFlip(input) : generate0201(input);
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
    d: path.d, class: "cut-line shape-cut", "data-cut-id": path.id
  })));

  geometry.creases.forEach((line) => el.viewport.append(svgNode("line", {
    x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2, class: "crease-line"
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
    : `${geometry.input.L} × ${geometry.input.W} × ${geometry.input.H} mm · 榫锁翻盖盒`;
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
    el.boxTypeStatus.textContent = "榫锁翻盖盒 · 理论预览";
    el.boxTypeEyebrow.textContent = "MORTISE FLIP";
    el.ruleTitle.textContent = "当前榫锁规则";
    el.ruleFormula.textContent = "LockEar = 0.4H · LockDepth = 0.4H";
    el.ruleNote.textContent = "根据参考截图建立的理论候选比例，需打样确认后再用于生产。";
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
  if (event.target.name === "boxType") {
    const isMortise = event.target.value === "mortise-flip";
    document.body.dataset.boxType = event.target.value;
    if (isMortise) {
      document.querySelector("#lengthInput").value = 158;
      document.querySelector("#widthInput").value = 102;
      document.querySelector("#heightInput").value = 52;
    } else {
      document.querySelector("#lengthInput").value = 500;
      document.querySelector("#widthInput").value = 380;
      document.querySelector("#heightInput").value = 400;
    }
    state.artworks.forEach((artwork) => { artwork.position = null; });
  }
  update();
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
