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
    if (fromIndex < 1 || toIndex < 1 || fromIndex >= layers.length || toIndex >= layers.length) return layers.slice()
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

  return { buildLayerStack, cutSpanInLayer, cutSpanFromLayerTop, reorderOpeningLayer, nearestSnap, composeMaterial, polygonsOverlap, geometryArea, supportHeight }
})
