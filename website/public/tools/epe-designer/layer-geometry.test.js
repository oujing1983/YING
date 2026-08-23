const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let geometry;
try {
  geometry = require('./layer-geometry.js');
} catch {
  geometry = null;
}

test('normalizes a layer size within the finished product and centers it', () => {
  assert.ok(geometry, 'layer geometry module should exist');

  const layer = geometry.normalizeLayer(
    { name: '开孔层', l: 500, w: 0, h: 10, x: 999, y: -20 },
    { L: 390, W: 250 },
  );

  assert.deepEqual(layer, { name: '开孔层', l: 390, w: 1, h: 10, x: 0, y: 0 });
  assert.deepEqual(
    geometry.centeredLayerRect({ l: 300, w: 200 }, { L: 390, W: 250 }),
    { x: 45, y: 25, l: 300, w: 200 },
  );
});

test('moves a layer while keeping it inside the finished product', () => {
  assert.ok(geometry, 'layer geometry module should exist');

  assert.deepEqual(
    geometry.moveLayer(
      { name: '开孔层', l: 200, w: 100, h: 10, x: 20, y: 30 },
      { x: 250, y: -50 },
      { L: 390, W: 250 },
    ),
    { name: '开孔层', l: 200, w: 100, h: 10, x: 190, y: 0 },
  );
});

test('the designer loads layer geometry and exposes length and width controls', () => {
  const directory = __dirname;
  const html = fs.readFileSync(path.join(directory, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(directory, 'app.js'), 'utf8');

  assert.match(html, /<script src="layer-geometry\.js"><\/script>\s*<script src="app\.js"><\/script>/);
  assert.match(app, /data-layer-field="l"/);
  assert.match(app, /data-layer-field="w"/);
  assert.match(app, /data-layer-field="x"/);
  assert.match(app, /data-layer-field="y"/);
  assert.match(app, /startLayerMove/);
  assert.match(app, /startLayerMove\(e,selectedLayer\)/);
});
