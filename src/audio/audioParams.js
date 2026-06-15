import { DEFAULT_ENV_SOUND, DEFAULT_OBJECT_SOUND } from "./audioSources.js";

/** Spatial audio mixer — Tweakpane-bound and serialized in scene JSON. */
export const audioParams = {
  playing: false,
  envSound: DEFAULT_ENV_SOUND,
  envVolume: 0.35,
  objectSound: DEFAULT_OBJECT_SOUND,
  objectVolume: 1,
  /** Higher = object sound falls off faster as you move away. */
  sensitivity: 1,
  loopFadeMs: 800,
};

export const AUDIO_PARAM_KEYS = [
  "playing",
  "envSound",
  "envVolume",
  "objectSound",
  "objectVolume",
  "sensitivity",
  "loopFadeMs",
];
