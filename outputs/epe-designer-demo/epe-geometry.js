(function (root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  root.EpeGeometry = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function buildLayerStack(layers) {
    let z = 0
    return layers.map((layer) => {
      const h = Math.max(0, Number(layer.h) || 0)
      const span = { ...layer, h, bottom: z, top: z + h }
      z = span.top
      return span
    })
  }

  function cutSpanInLayer(layer, totalHeight, depth) {
    const cutBottom = Math.max(0, totalHeight - Math.max(0, Number(depth) || 0))
    if (cutBottom >= layer.top) return null
    return { bottom: Math.max(layer.bottom, cutBottom), top: layer.top }
  }

  function cutSpanFromLayerTop(layer, cutTop, depth) {
    const top = Math.min(layer.top, Number(cutTop) || 0)
    const bottom = Math.max(layer.bottom, (Number(cutTop) || 0) - Math.max(0, Number(depth) || 0))
    return bottom < top ? { bottom, top } : null
  }

  function reorderOpeningLayer(layers, fromIndex, toIndex) {
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= layers.length || toIndex >= layers.length) return layers.slice()
    const next = layers.slice()
    const [layer] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, layer)
    return next
  }

  function nearestSnap(values, targets, threshold) {
    let best = null
    values.forEach((value) => targets.forEach((target) => {
      const distance = Math.abs(target - value)
      if (distance <= threshold && (!best || distance < best.distance)) best = { value: target, target, distance }
    }))
    return best && { value: best.value, target: best.target }
  }

  function composeMaterial(addPolygons, cutPolygons, clipper) {
    if (!addPolygons.length) return []
    const added = clipper.union(...addPolygons)
    if (!cutPolygons.length) return added
    const cut = clipper.union(...cutPolygons)
    return clipper.difference(added, cut)
  }

  function polygonsOverlap(a, b, clipper) {
    if (!a.length || !b.length) return false
    return clipper.intersection(a, b).length > 0
  }

  function geometryArea(geometry) {
    return geometry.reduce((total, polygon) => total + polygon.reduce((sum, ring, index) => {
      let area = 0
      for (let i = 0; i < ring.length - 1; i += 1) area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
      const absolute = Math.abs(area / 2)
      return sum + (index === 0 ? absolute : -absolute)
    }, 0), 0)
  }

  function supportHeight(targetGeometry, priorPlacements, clipper, minimumCoverage = 0.5) {
    const targetArea = geometryArea(targetGeometry)
    if (!targetArea) return 0
    const heights = [...new Set(priorPlacements.map(p => Number(p.top) || 0))].sort((a, b) => b - a)
    for (const height of heights) {
      const surfaces = priorPlacements.filter(p => (Number(p.top) || 0) === height && p.geometry.length).map(p => p.geometry)
      if (!surfaces.length) continue
      const surface = clipper.union(...surfaces)
      const overlap = clipper.intersection(targetGeometry, surface)
      if (geometryArea(overlap) / targetArea >= minimumCoverage) return height
    }
    return 0
  }

  function materialLayers(layers) {
    return layers.filter(layer => !layer.base)
  }

  function addedShapeLayerId(activeLayerId) {
    return activeLayerId
  }

  function layerDrawingSpecs(layers, geometryByLayer) {
    return materialLayers(layers).map(layer => {
      const points = (geometryByLayer[layer.id] || []).flat(2).filter(point => Array.isArray(point) && point.length >= 2)
      if (!points.length) return { ...layer, l: 0, w: 0 }
      const xs = points.map(point => Number(point[0]) || 0)
      const ys = points.map(point => Number(point[1]) || 0)
      const round = value => Math.round(value * 10) / 10
      return { ...layer, l: round(Math.max(...xs) - Math.min(...xs)), w: round(Math.max(...ys) - Math.min(...ys)) }
    })
  }

  function layerDrawingReport(layers, geometryByLayer, cuts = []) {
    const stack = buildLayerStack(materialLayers(layers))
    return layerDrawingSpecs(stack, geometryByLayer).map((layer, index) => {
      const geometry = geometryByLayer[layer.id] || []
      const depths = cuts.filter(cut => cut.layerId === layer.id).map(cut => Math.max(0, Number(cut.depth) || 0))
      return {
        ...layer,
        order: index + 1,
        openingCount: geometry.reduce((count, polygon) => count + Math.max(0, polygon.length - 1), 0),
        maxCutDepth: depths.length ? Math.max(...depths) : 0,
      }
    })
  }

  function edgeGeometryForSelection(selected, mergedGeometry) {
    if (!selected || selected.closed === false || !Array.isArray(selected.points) || selected.points.length < 2) return mergedGeometry
    const ring = selected.points.map(point => [point[0], point[1]])
    const first = ring[0]
    const last = ring[ring.length - 1]
    if (first[0] !== last[0] || first[1] !== last[1]) ring.push([first[0], first[1]])
    return [[ring]]
  }

  function pointInRing(point, ring) {
    let inside = false
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i]
      const b = ring[j]
      if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / ((b[1] - a[1]) || Number.EPSILON) + a[0]) inside = !inside
    }
    return inside
  }

  function edgeOffsetDirection(ring, a, b, isHole) {
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const length = Math.hypot(dx, dy) || 1
    const nx = -dy / length
    const ny = dx / length
    const probe = Math.max(0.5, Math.min(2, length * 0.02))
    const midpoint = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    const positiveSideIsInside = pointInRing([midpoint[0] + nx * probe, midpoint[1] + ny * probe], ring)
    return positiveSideIsInside === Boolean(isHole) ? 1 : -1
  }

  return { buildLayerStack, cutSpanInLayer, cutSpanFromLayerTop, reorderOpeningLayer, nearestSnap, composeMaterial, polygonsOverlap, geometryArea, supportHeight, materialLayers, layerDrawingSpecs, layerDrawingReport, addedShapeLayerId, edgeGeometryForSelection, edgeOffsetDirection }
})
