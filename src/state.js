import { getDefaultEnvId, getEnvironments, params } from "./config.js";
import { isNoModel } from "./modelUtils.js";
import { AUDIO_PARAM_KEYS, audioParams } from "./audio/audioParams.js";
import {
  DEFAULT_ENV_SOUND,
  DEFAULT_OBJECT_SOUND,
  ENV_SOUNDS,
  OBJECT_SOUNDS,
} from "./audio/audioSources.js";
import { GRAIN_PARAM_KEYS, grainParams } from "./grain/grainParams.js";
import { DITHER_PARAM_KEYS, clampDitherParams, ditherParams } from "./dither/ditherParams.js";
import {
  ORDERED_DITHER_PARAM_KEYS,
  clampOrderedDitherParams,
  orderedDitherParams,
} from "./postprocessing/orderedDitherParams.js";
import { STEREO_PARAM_KEYS, stereoParams } from "./stereo/stereoParams.js";
import { DEFAULT_PAGE_TITLE, syncPageTitle, TEXT_LINES } from "./text/textLines.js";
import { DEFAULT_TEXT_PARAMS, TEXT_PARAM_KEYS, textParams, ANIMATION_MODES } from "./text/textParams.js";
import {
  ANIMATION_PARAM_KEYS,
  MOTION_TYPES,
  PHASE_MODES,
  SELECTION_MODES,
  animationParams,
} from "./terrain/animationParams.js";
import { clampOceanParams, OCEAN_PARAM_KEYS, oceanParams } from "./ocean/oceanParams.js";
import { resetOceanShapeCycle } from "./ocean/oceanShapeCycle.js";
import {
  clampParticleParams,
  PARTICLE_PARAM_KEYS,
  particleParams,
} from "./particles/particleParams.js";

export const STATE_VERSION = 8;
const SUPPORTED_VERSIONS = [1, 2, 3, 4, 5, 6, 7, 8];

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
  "hideModel",
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

function pickOrderedDitherParams(source = {}) {
  return pickParams(source, ORDERED_DITHER_PARAM_KEYS);
}

function pickStereoParams(source = {}) {
  return pickParams(source, STEREO_PARAM_KEYS);
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

function pickParticleParams(source = {}) {
  return pickParams(source, PARTICLE_PARAM_KEYS);
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
  if (!ANIMATION_MODES.includes(textParams.animationMode)) {
    textParams.animationMode = ANIMATION_MODES[0];
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
  clampDitherParams();
}

function applyOrderedDitherState(orderedDither) {
  if (!orderedDither) return;
  for (const key of ORDERED_DITHER_PARAM_KEYS) {
    if (orderedDither[key] !== undefined) orderedDitherParams[key] = orderedDither[key];
  }
  clampOrderedDitherParams();
}

function applyStereoState(stereo) {
  if (!stereo) return;
  for (const key of STEREO_PARAM_KEYS) {
    if (stereo[key] !== undefined) stereoParams[key] = stereo[key];
  }
  if (stereoParams.anaglyphEnabled && stereoParams.parallaxBarrierEnabled) {
    stereoParams.parallaxBarrierEnabled = false;
  }
}

function applyTextState(text) {
  Object.assign(textParams, DEFAULT_TEXT_PARAMS);
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
  resetOceanShapeCycle();
  if (!ocean) return;
  for (const key of OCEAN_PARAM_KEYS) {
    if (ocean[key] !== undefined) oceanParams[key] = ocean[key];
  }
  clampOceanParams();
}

function applyParticleState(particles) {
  if (!particles) return;
  for (const key of PARTICLE_PARAM_KEYS) {
    if (particles[key] !== undefined) particleParams[key] = particles[key];
  }
  clampParticleParams();
}

let storedInitialCamera = null;

function pickCameraState(source) {
  if (!source?.position || !source?.target) return null;
  return {
    position: [...source.position],
    target: [...source.target],
  };
}

function applyCameraState(cameraState, ctx) {
  if (!cameraState) return;
  ctx.camera.position.fromArray(cameraState.position);
  ctx.controls.target.fromArray(cameraState.target);
  ctx.controls.update();
}

export function captureState({ scene, camera, controls }) {
  const state = {
    version: STATE_VERSION,
    params: Object.fromEntries(
      PARAM_KEYS.map((key) => [
        key,
        key === "model" && isNoModel(params.model) ? null : params[key],
      ])
    ),
    animation: pickAnimationParams(animationParams),
    grain: pickGrainParams(grainParams),
    dither: pickDitherParams(ditherParams),
    orderedDither: pickOrderedDitherParams(orderedDitherParams),
    stereo: pickStereoParams(stereoParams),
    text: pickTextParams(textParams),
    audio: pickAudioParams(audioParams),
    ocean: pickOceanParams(oceanParams),
    particles: pickParticleParams(particleParams),
    scene: {
      environmentIntensity: scene.environmentIntensity,
      environmentRotationY: scene.environmentRotation.y,
    },
    camera: {
      position: camera.position.toArray(),
      target: controls.target.toArray(),
    },
  };

  if (storedInitialCamera) {
    state.initialCamera = storedInitialCamera;
  }

  return state;
}

export async function applyState(state, ctx, { silent = false } = {}) {
  if (!state || !SUPPORTED_VERSIONS.includes(state.version)) {
    throw new Error(
      `Unsupported state version (expected ${SUPPORTED_VERSIONS.join(" or ")})`
    );
  }

  ctx.sceneFreeze?.capture();

  try {
    return await applyStateInner(state, ctx, { silent });
  } finally {
    await ctx.sceneFreeze?.release();
  }
}

async function applyStateInner(state, ctx, { silent = false } = {}) {
  const p = state.params ?? {};
  for (const key of PARAM_KEYS) {
    if (p[key] !== undefined) {
      params[key] = key === "model" && isNoModel(p[key]) ? "none" : p[key];
    }
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

  storedInitialCamera = pickCameraState(state.initialCamera);

  if (state.version >= 2) {
    applyAnimationState(state.animation);
  }
  if (state.grain) {
    applyGrainState(state.grain);
  }
  if (state.dither) {
    applyDitherState(state.dither);
  }
  if (state.version >= 8 && state.orderedDither) {
    applyOrderedDitherState(state.orderedDither);
  } else {
    orderedDitherParams.enabled = false;
  }
  if (state.stereo) {
    applyStereoState(state.stereo);
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
  if (state.version >= 6 && state.particles) {
    applyParticleState(state.particles);
  } else {
    particleParams.enabled = false;
  }

  ctx.grainOverlay?.sync();
  ctx.ditherOverlay?.sync();
  ctx.stereoEffects?.sync();
  ctx.postProcessing?.sync();
  ctx.audioSystem?.stop({ preserveIntent: true });

  const loadOpts = { silent, skipIntro: !!storedInitialCamera };
  const loadTasks = [ctx.reloadEnvironment(loadOpts)];
  if (!isNoModel(params.model)) {
    loadTasks.push(ctx.loadModel(params.model, loadOpts));
  } else {
    loadTasks.push(ctx.loadModel("none", loadOpts));
  }
  await Promise.all(loadTasks);

  if (storedInitialCamera) {
    applyCameraState(storedInitialCamera, ctx);
    ctx.modelLoader.cancelIntro?.();
  }

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

  if (animationParams.playing) {
    ctx.terrainAnimation?.startAmplitudeIntro();
  }

  ctx.oceanSystem?.sync();
  ctx.particleSystem?.sync();
  ctx.ui.refresh();

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
