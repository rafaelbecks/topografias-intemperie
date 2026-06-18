import * as THREE from "three";
import { clampDitherParams, ditherParams } from "./ditherParams.js";
import { maxDitherValues, randomDitherGeneration } from "./ditherTableValues.js";

function snapshotValues(source = ditherParams) {
  return {
    saturate: source.saturate,
    tableValuesR: source.tableValuesR,
    tableValuesG: source.tableValuesG,
    tableValuesB: source.tableValuesB,
  };
}

function applyValuesToParams(values) {
  ditherParams.saturate = values.saturate;
  ditherParams.tableValuesR = values.tableValuesR;
  ditherParams.tableValuesG = values.tableValuesG;
  ditherParams.tableValuesB = values.tableValuesB;
}

function lerpValues(from, to, t) {
  return {
    saturate: THREE.MathUtils.lerp(from.saturate, to.saturate, t),
    tableValuesR: THREE.MathUtils.lerp(from.tableValuesR, to.tableValuesR, t),
    tableValuesG: THREE.MathUtils.lerp(from.tableValuesG, to.tableValuesG, t),
    tableValuesB: THREE.MathUtils.lerp(from.tableValuesB, to.tableValuesB, t),
  };
}

/** Sine ease-in-out over [0, 1]. */
function sineEase(t) {
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
}

export function createDitherCycle(ditherOverlay) {
  let from = snapshotValues();
  let to = snapshotValues();
  let elapsed = 0;

  function beginTransition(target) {
    from = snapshotValues();
    to = target;
    elapsed = 0;
  }

  function resumeCycle() {
    if (!ditherParams.enabled) return;
    clampDitherParams();
    ditherParams.cycleEnabled = true;
    beginTransition(randomDitherGeneration());
  }

  function activate() {
    clampDitherParams();
    ditherParams.enabled = true;
    ditherParams.cycleEnabled = true;
    applyValuesToParams(maxDitherValues());
    ditherOverlay.sync();
    beginTransition(randomDitherGeneration());
  }

  function deactivate() {
    ditherParams.enabled = false;
    ditherParams.cycleEnabled = false;
    elapsed = 0;
    ditherOverlay.sync();
  }

  function update(delta) {
    if (!ditherParams.enabled || !ditherParams.cycleEnabled) return;

    clampDitherParams();
    const duration = ditherParams.cycleIntervalSec;
    if (duration <= 0) return;

    elapsed += delta;

    if (ditherParams.cycleSmooth) {
      const t = Math.min(1, elapsed / duration);
      const eased = sineEase(t);
      ditherOverlay.setFilterValues(lerpValues(from, to, eased));

      if (elapsed >= duration) {
        applyValuesToParams(to);
        beginTransition(randomDitherGeneration());
      }
      return;
    }

    if (elapsed >= duration) {
      const next = randomDitherGeneration();
      applyValuesToParams(next);
      ditherOverlay.sync();
      from = snapshotValues();
      to = next;
      elapsed = 0;
    }
  }

  return { activate, deactivate, resumeCycle, update };
}
