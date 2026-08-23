(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.LayerGeometry = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function numberOr(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeLayer(layer, product) {
    const l = clamp(numberOr(layer.l, product.L), 1, product.L);
    const w = clamp(numberOr(layer.w, product.W), 1, product.W);
    const defaultX = (product.L - l) / 2;
    const defaultY = (product.W - w) / 2;
    return {
      ...layer,
      l,
      w,
      h: Math.max(1, numberOr(layer.h, 1)),
      x: clamp(numberOr(layer.x, defaultX), 0, product.L - l),
      y: clamp(numberOr(layer.y, defaultY), 0, product.W - w),
    };
  }

  function centeredLayerRect(layer, product) {
    const normalized = normalizeLayer(layer, product);
    return {
      x: (product.L - normalized.l) / 2,
      y: (product.W - normalized.w) / 2,
      l: normalized.l,
      w: normalized.w,
    };
  }

  function positionedLayerRect(layer, product) {
    const normalized = normalizeLayer(layer, product);
    return { x: normalized.x, y: normalized.y, l: normalized.l, w: normalized.w };
  }

  function moveLayer(layer, delta, product) {
    return normalizeLayer({
      ...layer,
      x: numberOr(layer.x, 0) + numberOr(delta.x, 0),
      y: numberOr(layer.y, 0) + numberOr(delta.y, 0),
    }, product);
  }

  return { normalizeLayer, centeredLayerRect, positionedLayerRect, moveLayer };
});
