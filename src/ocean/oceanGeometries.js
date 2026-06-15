import * as THREE from "three";

export const OCEAN_SHAPES = ["plane", "circle", "oval", "noise", "sphere", "torus", "torusknot"];

export const FLAT_SHAPES = new Set(["plane", "circle", "oval", "noise"]);
export const ENVELOPE_SHAPES = new Set(["sphere", "torus", "torusknot"]);

function createPerlin2D(seed = 0) {
  const perm = new Uint8Array(512);
  const src = new Uint8Array(256);
  for (let i = 0; i < 256; i++) src[i] = i;

  let s = Math.abs(Math.floor(seed)) || 1;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    const tmp = src[i];
    src[i] = src[j];
    src[j] = tmp;
  }

  for (let i = 0; i < 512; i++) perm[i] = src[i & 255];

  function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function grad(hash, x, y) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  return function noise(x, y) {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const aa = perm[xi] + yi;
    const ab = perm[xi] + yi + 1;
    const ba = perm[xi + 1] + yi;
    const bb = perm[xi + 1] + yi + 1;
    const x1 = THREE.MathUtils.lerp(grad(perm[aa], xf, yf), grad(perm[ba], xf - 1, yf), u);
    const x2 = THREE.MathUtils.lerp(grad(perm[ab], xf, yf - 1), grad(perm[bb], xf - 1, yf - 1), u);
    return THREE.MathUtils.lerp(x1, x2, v);
  };
}

function sampleEdgeNoise(noise2d, angle, noiseScale, octaves) {
  const dirX = Math.cos(angle) * noiseScale;
  const dirY = Math.sin(angle) * noiseScale;
  let value = 0;
  let amp = 1;
  let freq = 1;
  let totalAmp = 0;

  for (let o = 0; o < octaves; o++) {
    value += noise2d(dirX * freq, dirY * freq) * amp;
    totalAmp += amp;
    amp *= 0.5;
    freq *= 2;
  }

  return value / totalAmp;
}

function createNoiseDiscGeometry(radius, segments, { noiseScale, noiseAmplitude, noiseSeed }) {
  const noise2d = createPerlin2D(noiseSeed);
  const shape = new THREE.Shape();
  const points = [];

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const n = sampleEdgeNoise(noise2d, angle, noiseScale, 3);
    const r = radius * (1 + n * noiseAmplitude);
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    points.push(new THREE.Vector2(x, y));
  }

  shape.setFromPoints(points);
  return new THREE.ShapeGeometry(shape, segments);
}

/**
 * @param {string} shape
 * @param {number} extent — diameter / span for flat shapes; reference size for envelopes
 * @param {object} params — oceanParams subset
 */
export function createOceanGeometry(shape, extent, params) {
  const segments = Math.max(16, Math.floor(params.shapeSegments));
  const radius = extent * 0.5;

  switch (shape) {
    case "circle":
      return new THREE.CircleGeometry(radius, segments);

    case "oval": {
      const rx = radius * params.ovalRatio;
      const rz = radius / params.ovalRatio;
      const geo = new THREE.CircleGeometry(1, segments);
      geo.scale(rx, rz, 1);
      return geo;
    }

    case "noise":
      return createNoiseDiscGeometry(radius, segments, params);

    case "sphere": {
      const r = extent * params.envelopeRadius * 0.5;
      return new THREE.SphereGeometry(r, segments, Math.max(8, Math.floor(segments * 0.75)));
    }

    case "torus": {
      const major = extent * params.envelopeRadius * 0.5;
      const tube = major * params.torusTube;
      return new THREE.TorusGeometry(
        major,
        tube,
        Math.max(8, Math.floor(segments * 0.5)),
        segments
      );
    }

    case "torusknot": {
      const scale = extent * params.envelopeRadius * 0.5;
      return new THREE.TorusKnotGeometry(
        scale * params.torusKnotRadius,
        scale * params.torusKnotTube,
        Math.max(3, Math.floor(params.torusKnotTubularSegments)),
        Math.max(3, Math.floor(params.torusKnotRadialSegments)),
        Math.max(1, Math.floor(params.torusKnotP)),
        Math.max(1, Math.floor(params.torusKnotQ))
      );
    }

    case "plane":
    default:
      return new THREE.PlaneGeometry(extent, extent, 1, 1);
  }
}

export function getOceanExtent(bounds, sizeScale) {
  if (!bounds) return 500 * sizeScale;
  const span = Math.max(bounds.size.x, bounds.size.z);
  return Math.max(span * sizeScale, 50);
}

export function getEnvelopeBoundsRadius(bounds) {
  if (!bounds) return 250;
  return bounds.size.length() * 0.5;
}
