import { getDefaultEnvId, getEnvironments, params } from "./config.js";
import { GRAIN_PARAM_KEYS, grainParams } from "./grain/grainParams.js";
import {
  ANIMATION_PARAM_KEYS,
  MOTION_TYPES,
  PHASE_MODES,
  SELECTION_MODES,
  animationParams,
} from "./terrain/animationParams.js";

export const STATE_VERSION = 2;
const SUPPORTED_VERSIONS = [1, 2];

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

export function captureState({ scene, camera, controls }) {
  return {
    version: STATE_VERSION,
    params: Object.fromEntries(PARAM_KEYS.map((key) => [key, params[key]])),
    animation: pickAnimationParams(animationParams),
    grain: pickGrainParams(grainParams),
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

  ctx.ui.refresh();
  ctx.grainOverlay?.sync();

  const loadOpts = { silent };
  await Promise.all([
    ctx.loadModel(params.model, loadOpts),
    ctx.reloadEnvironment(loadOpts),
  ]);

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

export async function loadStateFromFile(file, ctx) {
  const loading = ctx.loading;

  await loading?.run("memory", async ({ setProgress }) => {
    setProgress(0.1);
    const text = await file.text();
    setProgress(0.45);
    const state = JSON.parse(text);
    setProgress(0.55);
    await applyState(state, ctx, { silent: true });
    setProgress(1);
  });
}

function memoryTimestamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
}
