import { clampEnvCycleParams, ENV_CYCLE_PARAM_KEYS, envCycleParams } from "./envCycleParams.js";

function pickEnvCycleParams(source = {}) {
  const out = {};
  for (const key of ENV_CYCLE_PARAM_KEYS) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
}

export function applyEnvCycleState(envCycle) {
  if (!envCycle) return;
  for (const key of ENV_CYCLE_PARAM_KEYS) {
    if (envCycle[key] !== undefined) envCycleParams[key] = envCycle[key];
  }
  clampEnvCycleParams();
}

export function captureEnvCycleState() {
  return pickEnvCycleParams(envCycleParams);
}

export function resetEnvCycleParams() {
  envCycleParams.enabled = false;
  envCycleParams.intervalSec = 12;
  envCycleParams.lookahead = 3;
}
