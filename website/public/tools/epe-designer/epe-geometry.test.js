const assert = require('node:assert/strict')
const polygonClipping = require('./polygon-clipping.min.js')
const { buildLayerStack, cutSpanInLayer, cutSpanFromLayerTop, reorderOpeningLayer, nearestSnap, composeMaterial, polygonsOverlap, supportHeight, materialLayers, layerDrawingSpecs, addedShapeLayerId } = require('./epe-geometry.js')

const stack = buildLayerStack([
  { name: '底板', h: 15 },
  { name: '开孔层 A', h: 10 },
  { name: '开孔层 B', h: 15 },
])

assert.deepEqual(stack, [
  { name: '底板', h: 15, bottom: 0, top: 15 },
  { name: '开孔层 A', h: 10, bottom: 15, top: 25 },
  { name: '开孔层 B', h: 15, bottom: 25, top: 40 },
])

for (let i = 1; i < stack.length; i += 1) {
  assert.equal(stack[i].bottom, stack[i - 1].top, '相邻层之间不能出现空气间隙')
}

console.log('epe geometry stacking test passed')

assert.equal(cutSpanInLayer(stack[0], 40, 15), null, '15mm 浅孔不能切到底板')
assert.equal(cutSpanInLayer(stack[1], 40, 15), null, '15mm 浅孔不能切到中间层')
assert.deepEqual(cutSpanInLayer(stack[2], 40, 15), { bottom: 25, top: 40 })

assert.equal(cutSpanInLayer(stack[0], 40, 20), null)
assert.deepEqual(cutSpanInLayer(stack[1], 40, 20), { bottom: 20, top: 25 })
assert.deepEqual(cutSpanInLayer(stack[2], 40, 20), { bottom: 25, top: 40 })

assert.deepEqual(cutSpanInLayer(stack[0], 40, 40), { bottom: 0, top: 15 })
assert.deepEqual(cutSpanInLayer(stack[1], 40, 40), { bottom: 15, top: 25 })
assert.deepEqual(cutSpanInLayer(stack[2], 40, 40), { bottom: 25, top: 40 })

console.log('epe cut depth test passed')

assert.equal(cutSpanFromLayerTop(stack[2], 25, 12), null, '下层开孔不能切到上层')
assert.deepEqual(cutSpanFromLayerTop(stack[1], 25, 12), { bottom: 15, top: 25 })
assert.deepEqual(cutSpanFromLayerTop(stack[0], 25, 12), { bottom: 13, top: 15 })

const ordered = reorderOpeningLayer([{ id: 'a' }, { id: 'b' }], 1, 0)
assert.deepEqual(ordered.map(x => x.id), ['b', 'a'])

assert.deepEqual(nearestSnap([98, 150], [0, 100, 200], 5), { value: 100, target: 100 })
assert.equal(nearestSnap([92], [100], 5), null)

console.log('epe per-layer and snapping tests passed')

const outer = [[[[0, 0], [100, 0], [100, 80], [0, 80], [0, 0]]]]
const hole = [[[[20, 20], [40, 20], [40, 40], [20, 40], [20, 20]]]]
const material = composeMaterial(outer, hole, polygonClipping)
assert.equal(material.length, 1)
assert.equal(material[0].length, 2, '减向图形应成为实体内孔')
assert.equal(polygonsOverlap(outer, hole, polygonClipping), true)
assert.equal(polygonsOverlap(outer, [[[[120, 0], [130, 0], [130, 10], [120, 10], [120, 0]]]], polygonClipping), false)

console.log('epe boolean material tests passed')

assert.equal(supportHeight(hole, [{ geometry: outer, top: 15 }], polygonClipping), 15, '相交的独立贴块应落在最高支撑面')
assert.equal(supportHeight([[[[120, 0], [130, 0], [130, 10], [120, 10], [120, 0]]]], [{ geometry: outer, top: 15 }], polygonClipping), 0, '没有支撑时应落到底座高度')
const fullPlate = [[[[0, 0], [100, 0], [100, 80], [0, 80], [0, 0]]]]
const narrowHighSupport = [[[[0, 0], [10, 0], [10, 80], [0, 80], [0, 0]]]]
assert.equal(supportHeight(fullPlate, [{ geometry: outer, top: 15 }, { geometry: narrowHighSupport, top: 30 }], polygonClipping), 15, '窄小支撑不能把整张板托在高处')
console.log('epe independent block support tests passed')

const layersWithoutBase = [
  { id: 'a', name: '开孔层 A', h: 20 },
  { id: 'b', name: '材料层 2', h: 69 },
]
assert.deepEqual(materialLayers([{ id: 'base', base: true }, ...layersWithoutBase]), layersWithoutBase, '结构图和层列表不应显示底板')
assert.equal(addedShapeLayerId('b'), 'b', '连续增加材料必须留在当前层')
assert.deepEqual(reorderOpeningLayer(layersWithoutBase, 1, 0).map(x => x.id), ['b', 'a'], '没有底板后首层也必须可参与排序')

const specs = layerDrawingSpecs(layersWithoutBase, [
  { layerId: 'a', points: [[0, 0], [390, 0], [390, 250], [0, 250]] },
  { layerId: 'b', points: [[20, 30], [79.1, 30], [79.1, 187.2], [20, 187.2]] },
])
assert.deepEqual(specs.map(x => ({ id: x.id, l: x.l, w: x.w, h: x.h })), [
  { id: 'a', l: 390, w: 250, h: 20 },
  { id: 'b', l: 59.1, w: 157.2, h: 69 },
])
console.log('epe visible layer and drawing sheet tests passed')
