export const ANIMATION_MODES = ["twister", "flip", "orbit"];

/** Defaults tuned from three-text demo (wireframe flip, Maniera, LTR). */
export const DEFAULT_TEXT_PARAMS = {
  enabled: false,
  lineId: "ventanas",
  content: "",
  fontSize: 105,
  letterSpacing: 0.17,
  depth: 15,
  scale: 0.35,
  upright: false,
  direction: "rtl",
  align: "justify",
  lineWidth: 3000,
  lineHeight: 1.25,
  animationMode: "twister",
  orbitSpeed: 0.08,
  wireframe: true,
  twisterSpeed: 0.4,
  twisterHeight: 300,
  twisterRadius: 300,
  flipSpeed: 0.3,
  flipPauseDuration: 0.3,
};

export const textParams = { ...DEFAULT_TEXT_PARAMS };

export const TEXT_PARAM_KEYS = [
  "enabled",
  "lineId",
  "content",
  "fontSize",
  "letterSpacing",
  "depth",
  "scale",
  "upright",
  "direction",
  "align",
  "lineWidth",
  "lineHeight",
  "animationMode",
  "orbitSpeed",
  "wireframe",
  "twisterSpeed",
  "twisterHeight",
  "twisterRadius",
  "flipSpeed",
  "flipPauseDuration",
];
