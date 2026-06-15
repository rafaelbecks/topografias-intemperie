import { EXR_ENVIRONMENTS } from "./exrEnvironments.generated.js";

export { EXR_ENVIRONMENTS };

/** Change these to switch the environment loaded on startup. */
export const DEFAULT_ENV_FORMAT = "hdr";
export const DEFAULT_ENV = "industrial_sunset";
export const DEFAULT_EXR_ENV = "img_8577";

export const HDR_ENVIRONMENTS = {
  industrial_sunset: {
    label: "Industrial Sunset",
    file: "industrial_sunset_02_puresky_1k.hdr",
  },
  aristea_wreck: {
    label: "Aristea Wreck",
    file: "aristea_wreck_puresky_1k.hdr",
  },
  rosendal_park: {
    label: "Rosendal Park Sunset",
    file: "rosendal_park_sunset_puresky_1k.hdr",
  },
  qwantani_sunset: {
    label: "Qwantani Sunset",
    file: "qwantani_sunset_puresky_1k.hdr",
  },
  qwantani_night: {
    label: "Qwantani Night",
    file: "qwantani_night_puresky_1k.hdr",
  },
};

export const ENV_FORMAT_OPTIONS = { HDR: "hdr", EXR: "exr" };

export function getEnvironments(format) {
  return format === "exr" ? EXR_ENVIRONMENTS : HDR_ENVIRONMENTS;
}

export function getEnvOptions(format) {
  return Object.fromEntries(
    Object.entries(getEnvironments(format)).map(([id, { label }]) => [label, id])
  );
}

export function getDefaultEnvId(format) {
  return format === "exr" ? DEFAULT_EXR_ENV : DEFAULT_ENV;
}

export function getEnvPath(envId, format = DEFAULT_ENV_FORMAT) {
  const env = getEnvironments(format)[envId];
  if (!env?.file) return null;
  const subdir = format === "exr" ? "exr/" : "";
  return `./env/${subdir}${env.file}`;
}

export const params = {
  lightIntensity: 2.8,
  ambient: 1.52,
  exposure: 1,
  roughness: 0.5,
  envFormat: DEFAULT_ENV_FORMAT,
  environment: DEFAULT_ENV,
  bgBlur: 0,
  moveSpeed: 5,
  fpMove: true,
  autoRotate: false,
  rotateSpeed: 0.6,
  debug: false,
  wireframe: false,
  model: "cart2",
};

/** Camera intro when a model loads. startY uses auto-framed height unless set. */
export const CAMERA_INTRO = {
  startY: null,
  endY: 1.3,
  startZ: 0,
  endZ: 1.6,
  delay: 0.7,
  duration: 2.5,
};

/** Amplitude ramp when a scene loads with animation enabled. */
export const ANIMATION_INTRO = {
  hold: 2,
  duration: 1.5,
};

export const MODEL_OPTIONS = [
  { text: "El valle de las tres cumbres", value: "cart2" },
  { text: "Terreno de curvaturas continuas", value: "cart4" },
  { text: "Picos refractados del delirio", value: "cart5" },
  { text: "Dunas de hierro dormido", value: "cart6" },
  { text: "Mesetas de hielo fracturado", value: "cart7" },
  { text: "Fragmentos de un relieve desprendido", value: "cart8" },
  { text: "Bosque de laderas cerradas", value: "cart10" },
  { text: "Macizo flotante de amatista", value: "cart11" },
  { text: "El río que arde entre dos cráteres", value: "cart13" },
  { text: "La quebrada de ocre profundo", value: "cart14" },
  { text: "Macizo del pez erosionado", value: "cart15" },
  { text: "Organic model", value: "organic_model" },
    { text: "Art gallery 1", value: "art_gallery" },
  { text: "Art gallery 2", value: "art_gallery1" },

];
