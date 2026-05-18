/** Change this to switch the environment loaded on startup. */
export const DEFAULT_ENV = "industrial_sunset";

export const ENVIRONMENTS = {
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

export const ENV_OPTIONS = Object.fromEntries(
  Object.entries(ENVIRONMENTS).map(([id, { label }]) => [label, id])
);

export function getEnvPath(envId) {
  const env = ENVIRONMENTS[envId];
  return env?.file ? `./env/${env.file}` : null;
}

export const params = {
  lightIntensity: 2.8,
  ambient: 1.52,
  exposure: 1,
  roughness: 0.5,
  environment: DEFAULT_ENV,
  bgBlur: 0,
  moveSpeed: 5,
  fpMove: true,
  autoRotate: false,
  rotateSpeed: 0.6,
  debug: false,
  wireframe: false,
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
];
