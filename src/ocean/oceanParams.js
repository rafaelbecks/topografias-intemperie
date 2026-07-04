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
  ellipsoidRadiusX: 1,
  ellipsoidRadiusY: 0.65,
  ellipsoidRadiusZ: 1,
  cuboidWidth: 1,
  cuboidHeight: 0.6,
  cuboidDepth: 1.2,
  torusTube: 0.35,
  torusKnotRadius: 1,
  torusKnotTube: 0.4,
  torusKnotTubularSegments: 128,
  torusKnotRadialSegments: 16,
  torusKnotP: 2,
  torusKnotQ: 3,
  torusNoiseEnabled: false,
  torusNoiseAmplitude: 0.25,
  torusNoiseScale: 1.5,
  torusNoiseScaleModEnabled: false,
  torusNoiseScaleModRate: 0.25,
  torusNoiseScaleModAmount: 0.5,
  torusNoiseSeed: 42,
  torusNoiseOctaves: 3,
  torusNoiseMorphSpeed: 3,
  envelopeRotationX: 0,
  envelopeRotationY: 0,
  envelopeRotationZ: 0,
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
  "ellipsoidRadiusX",
  "ellipsoidRadiusY",
  "ellipsoidRadiusZ",
  "cuboidWidth",
  "cuboidHeight",
  "cuboidDepth",
  "torusTube",
  "torusKnotRadius",
  "torusKnotTube",
  "torusKnotTubularSegments",
  "torusKnotRadialSegments",
  "torusKnotP",
  "torusKnotQ",
  "torusNoiseEnabled",
  "torusNoiseAmplitude",
  "torusNoiseScale",
  "torusNoiseScaleModEnabled",
  "torusNoiseScaleModRate",
  "torusNoiseScaleModAmount",
  "torusNoiseSeed",
  "torusNoiseOctaves",
  "torusNoiseMorphSpeed",
  "envelopeRotationX",
  "envelopeRotationY",
  "envelopeRotationZ",
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
  oceanParams.torusNoiseOctaves = Math.max(
    1,
    Math.min(5, Math.round(oceanParams.torusNoiseOctaves))
  );
  oceanParams.torusNoiseScaleModAmount = Math.max(0, oceanParams.torusNoiseScaleModAmount);
  oceanParams.torusNoiseScaleModRate = Math.max(0.01, oceanParams.torusNoiseScaleModRate);
}
