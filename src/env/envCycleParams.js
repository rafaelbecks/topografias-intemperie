export const ENV_CYCLE_PARAM_KEYS = ["enabled", "intervalSec", "lookahead"];

export const envCycleParams = {
  enabled: false,
  /** Seconds each environment is shown before switching to the next. */
  intervalSec: 5,
  /** How many upcoming environments to keep preloaded in the background. */
  lookahead: 3,
};

export function clampEnvCycleParams() {
  envCycleParams.intervalSec = Math.max(1, envCycleParams.intervalSec);
  envCycleParams.lookahead = Math.max(1, Math.min(6, Math.round(envCycleParams.lookahead)));
}
