import { OCEAN_SHAPES } from "./oceanGeometries.js";

export const ENVELOPE_SIDE_OPTIONS = {
  outside: "outside",
  inside: "inside",
  double: "double",
};

/** Three.js Water addon — Tweakpane-bound and serialized in scene JSON. */
export const oceanParams = {
  enabled: false,
  shape: "plane",
  height: -20,
  sizeScale: 4,
  shapeSegments: 128,
  ovalRatio: 1.5,
  noiseAmplitude: 0.35,
  noiseScale: 1.2,
  noiseSeed: 42,
  envelopeRadius: 2.5,
  torusTube: 0.35,
  torusKnotRadius: 1,
  torusKnotTube: 0.4,
  torusKnotTubularSegments: 128,
  torusKnotRadialSegments: 16,
  torusKnotP: 2,
  torusKnotQ: 3,
  envelopeSide: ENVELOPE_SIDE_OPTIONS.double,
  waterColor: "#001e0f",
  sunColor: "#ffffff",
  sunElevation: 45,
  sunAzimuth: 180,
  distortionScale: 3.7,
  waveSize: 1,
  alpha: 1,
};

export const OCEAN_PARAM_KEYS = [
  "enabled",
  "shape",
  "height",
  "sizeScale",
  "shapeSegments",
  "ovalRatio",
  "noiseAmplitude",
  "noiseScale",
  "noiseSeed",
  "envelopeRadius",
  "torusTube",
  "torusKnotRadius",
  "torusKnotTube",
  "torusKnotTubularSegments",
  "torusKnotRadialSegments",
  "torusKnotP",
  "torusKnotQ",
  "envelopeSide",
  "waterColor",
  "sunColor",
  "sunElevation",
  "sunAzimuth",
  "distortionScale",
  "waveSize",
  "alpha",
];

export function clampOceanParams() {
  if (!OCEAN_SHAPES.includes(oceanParams.shape)) {
    oceanParams.shape = OCEAN_SHAPES[0];
  }
  if (!ENVELOPE_SIDE_OPTIONS[oceanParams.envelopeSide]) {
    oceanParams.envelopeSide = "outside";
  }
}
