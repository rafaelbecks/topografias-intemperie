/** Default animation & layer-selection parameters (Tweakpane-bound). */
export const animationParams = {
  playing: false,
  motionType: "sine",
  amplitude: 0.12,
  amplitudeModEnabled: false,
  amplitudeModRate: 0.25,
  frequency: 0.35,
  speed: 0.45,
  phaseSpread: 0.55,
  randomness: 0.25,
  axisX: 0.35,
  axisY: 1,
  axisZ: 0.25,

  selectionMode: "all",
  percentage: 50,
  seed: 42,
  nthStep: 3,
  invertSelection: false,

  phaseMode: "index",
  radialBias: 1,
  heightBias: 0.6,

  showSelectedLayers: false,
};

export const MOTION_TYPES = [
  "sine",
  "harmonic",
  "verticalDrift",
  "tectonic",
  "dissolve",
  "noiseOscillation",
];

export const SELECTION_MODES = [
  "all",
  "percentage",
  "random",
  "outsideToInside",
  "insideToOutside",
  "everyNth",
];

export const PHASE_MODES = ["index", "random", "radial", "height"];

/** Keys persisted in scene state JSON. */
export const ANIMATION_PARAM_KEYS = [
  "playing",
  "motionType",
  "amplitude",
  "amplitudeModEnabled",
  "amplitudeModRate",
  "frequency",
  "speed",
  "phaseSpread",
  "randomness",
  "axisX",
  "axisY",
  "axisZ",
  "selectionMode",
  "percentage",
  "seed",
  "nthStep",
  "invertSelection",
  "phaseMode",
  "radialBias",
  "heightBias",
  "showSelectedLayers",
];
