import { getDefaultEnvId, getEnvironments, params } from "./config.js";
import { AUDIO_PARAM_KEYS, audioParams } from "./audio/audioParams.js";
import {
  DEFAULT_ENV_SOUND,
  DEFAULT_OBJECT_SOUND,
  ENV_SOUNDS,
  OBJECT_SOUNDS,
} from "./audio/audioSources.js";
import { GRAIN_PARAM_KEYS, grainParams } from "./grain/grainParams.js";
import { DITHER_PARAM_KEYS, ditherParams } from "./dither/ditherParams.js";
import { DEFAULT_PAGE_TITLE, syncPageTitle, TEXT_LINES } from "./text/textLines.js";
import { TEXT_PARAM_KEYS, textParams } from "./text/textParams.js";
import {
  ANIMATION_PARAM_KEYS,
  MOTION_TYPES,
  PHASE_MODES,
  SELECTION_MODES,
  animationParams,
} from "./terrain/animationParams.js";
import { clampOceanParams, OCEAN_PARAM_KEYS, oceanParams } from "./ocean/oceanParams.js";

export const STATE_VERSION = 5;
const SUPPORTED_VERSIONS = [1, 2, 3, 4, 5];

const PARAM_KEYS = [
  "lightIntensity",
  "ambient",
  "exposure",
  "roughness",
  "envFormat",
  "environment",
  "bgBlur",
  "moveSpeed",
  "fpMove",
  "autoRotate",
  "rotateSpeed",
  "debug",
  "wireframe",
  "model",
];

function pickParams(source, keys) {
  const out = {};
  for (const key of keys) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
}

function pickAnimationParams(source = {}) {
  return pickParams(source, ANIMATION_PARAM_KEYS);
}

function pickGrainParams(source = {}) {
  return pickParams(source, GRAIN_PARAM_KEYS);
}

function pickDitherParams(source = {}) {
  return pickParams(source, DITHER_PARAM_KEYS);
}

function pickTextParams(source = {}) {
  return pickParams(source, TEXT_PARAM_KEYS);
}

function pickAudioParams(source = {}) {
  return pickParams(source, AUDIO_PARAM_KEYS);
}

function pickOceanParams(source = {}) {
  return pickParams(source, OCEAN_PARAM_KEYS);
}

function clampAudioParams() {
  if (!ENV_SOUNDS[audioParams.envSound]) {
    audioParams.envSound = DEFAULT_ENV_SOUND;
  }
  if (!OBJECT_SOUNDS[audioParams.objectSound]) {
    audioParams.objectSound = DEFAULT_OBJECT_SOUND;
  }
}

function clampTextParams() {
  const validIds = TEXT_LINES.map((line) => line.id);
  if (!validIds.includes(textParams.lineId)) {
    textParams.lineId = validIds[0];
  }
}

function clampAnimationParams() {
  if (!MOTION_TYPES.includes(animationParams.motionType)) {
    animationParams.motionType = MOTION_TYPES[0];
  }
  if (!SELECTION_MODES.includes(animationParams.selectionMode)) {
    animationParams.selectionMode = SELECTION_MODES[0];
  }
  if (!PHASE_MODES.includes(animationParams.phaseMode)) {
    animationParams.phaseMode = PHASE_MODES[0];
  }
}

function applyAnimationState(anim) {
  if (!anim) return;

  for (const key of ANIMATION_PARAM_KEYS) {
    if (anim[key] !== undefined) animationParams[key] = anim[key];
  }
  clampAnimationParams();
}

function applyGrainState(grain) {
  if (!grain) return;
  for (const key of GRAIN_PARAM_KEYS) {
    if (grain[key] !== undefined) grainParams[key] = grain[key];
  }
}

function applyDitherState(dither) {
  if (!dither) return;
  for (const key of DITHER_PARAM_KEYS) {
    if (dither[key] !== undefined) ditherParams[key] = dither[key];
  }
}

function applyTextState(text) {
  if (!text) return;
  for (const key of TEXT_PARAM_KEYS) {
    if (text[key] !== undefined) textParams[key] = text[key];
  }
  clampTextParams();
}

function applyAudioState(audio) {
  if (!audio) return;
  for (const key of AUDIO_PARAM_KEYS) {
    if (audio[key] !== undefined) audioParams[key] = audio[key];
  }
  clampAudioParams();
}

function applyOceanState(ocean) {
  if (!ocean) return;
  for (const key of OCEAN_PARAM_KEYS) {
    if (ocean[key] !== undefined) oceanParams[key] = ocean[key];
  }
  clampOceanParams();
}

export function captureState({ scene, camera, controls }) {
  return {
    version: STATE_VERSION,
    params: Object.fromEntries(PARAM_KEYS.map((key) => [key, params[key]])),
    animation: pickAnimationParams(animationParams),
    grain: pickGrainParams(grainParams),
    dither: pickDitherParams(ditherParams),
    text: pickTextParams(textParams),
    audio: pickAudioParams(audioParams),
    ocean: pickOceanParams(oceanParams),
    scene: {
      environmentIntensity: scene.environmentIntensity,
      environmentRotationY: scene.environmentRotation.y,
    },
    camera: {
      position: camera.position.toArray(),
      target: controls.target.toArray(),
    },
  };
}

export async function applyState(state, ctx, { silent = false } = {}) {
  if (!state || !SUPPORTED_VERSIONS.includes(state.version)) {
    throw new Error(
      `Unsupported state version (expected ${SUPPORTED_VERSIONS.join(" or ")})`
    );
  }

  const p = state.params ?? {};
  for (const key of PARAM_KEYS) {
    if (p[key] !== undefined) params[key] = p[key];
  }

  const environments = getEnvironments(params.envFormat);
  if (!environments[params.environment]) {
    params.environment = getDefaultEnvId(params.envFormat);
  }

  if (state.scene) {
    if (state.scene.environmentIntensity !== undefined) {
      ctx.scene.environmentIntensity = state.scene.environmentIntensity;
    }
    if (state.scene.environmentRotationY !== undefined) {
      ctx.scene.environmentRotation.y = state.scene.environmentRotationY;
    }
  }

  ctx.renderer.toneMappingExposure = params.exposure;
  ctx.controls.autoRotate = params.autoRotate;
  ctx.controls.autoRotateSpeed = params.rotateSpeed;
  ctx.scene.backgroundBlurriness = params.bgBlur;

  ctx.modelLoader.setRoughness(params.roughness);
  ctx.modelLoader.setWireframe(params.wireframe);
  ctx.input.resetMoveState();

  if (state.camera?.position) {
    ctx.camera.position.fromArray(state.camera.position);
  }
  if (state.camera?.target) {
    ctx.controls.target.fromArray(state.camera.target);
    ctx.controls.update();
  }

  if (state.version >= 2) {
    applyAnimationState(state.animation);
  }
  if (state.grain) {
    applyGrainState(state.grain);
  }
  if (state.dither) {
    applyDitherState(state.dither);
  }
  if (state.version >= 3 && state.text) {
    applyTextState(state.text);
    syncPageTitle(textParams.lineId);
  } else {
    textParams.enabled = false;
    document.title = DEFAULT_PAGE_TITLE;
  }
  if (state.version >= 4 && state.audio) {
    applyAudioState(state.audio);
  } else {
    audioParams.playing = false;
  }
  if (state.version >= 5 && state.ocean) {
    applyOceanState(state.ocean);
  } else {
    oceanParams.enabled = false;
  }

  ctx.ui.refresh();
  ctx.grainOverlay?.sync();
  ctx.ditherOverlay?.sync();
  ctx.oceanSystem?.sync();
  ctx.audioSystem?.stop({ preserveIntent: true });

  const loadOpts = { silent };
  await Promise.all([
    ctx.loadModel(params.model, loadOpts),
    ctx.reloadEnvironment(loadOpts),
  ]);

  if (ctx.textOverlay) {
    if (textParams.enabled) {
      await ctx.textOverlay.render();
      ctx.textOverlay.syncTransform();
      ctx.textOverlay.updateMaterialUniforms();
    } else {
      ctx.textOverlay.setEnabled(false);
    }
  }

  if (ctx.audioSystem) {
    await ctx.audioSystem.sync({ resumeFadeIn: false });
  }

  document.getElementById("position").style.display = params.debug ? "block" : "none";
}

export function downloadState(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `memory-${memoryTimestamp()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function loadStatePayload(text, ctx) {
  const state = JSON.parse(text);
  await applyState(state, ctx, { silent: true });
}

export async function loadStateFromFile(file, ctx) {
  const loading = ctx.loading;

  await loading?.run("memory", async ({ setProgress }) => {
    setProgress(0.1);
    const text = await file.text();
    setProgress(0.45);
    await loadStatePayload(text, ctx);
    setProgress(1);
  });
}

export async function loadStateFromUrl(url, ctx) {
  const loading = ctx.loading;

  await loading?.run("memory", async ({ setProgress }) => {
    setProgress(0.1);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`);
    const text = await res.text();
    setProgress(0.45);
    await loadStatePayload(text, ctx);
    setProgress(1);
  });
}

function memoryTimestamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
}
