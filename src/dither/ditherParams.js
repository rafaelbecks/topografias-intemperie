/** Ordered dither overlay — Tweakpane-bound (same controls as glow). */
export const ditherParams = {
  enabled: false,
  saturate: 1,
  tableValuesR: 0,
  tableValuesG: 0,
  tableValuesB: 0,
  cycleEnabled: false,
  cycleIntervalSec: 1,
  cycleSmooth: true,
};

export const DITHER_PARAM_KEYS = [
  "enabled",
  "saturate",
  "tableValuesR",
  "tableValuesG",
  "tableValuesB",
  "cycleEnabled",
  "cycleIntervalSec",
  "cycleSmooth",
];

export function clampDitherParams() {
  ditherParams.cycleIntervalSec = Math.max(0.25, ditherParams.cycleIntervalSec);
}
