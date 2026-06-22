import {
  animationParams,
  MOTION_TYPES,
  PHASE_MODES,
  SELECTION_MODES,
} from "./animationParams.js";
import { ANIMATION_PRESETS, applyPreset } from "./presets.js";

function toOptions(items, labels = {}) {
  return Object.fromEntries(
    items.map((id) => [labels[id] ?? id, id])
  );
}

const MOTION_LABELS = {
  sine: "Sine",
  harmonic: "Harmonic",
  verticalDrift: "Vertical drift",
  tectonic: "Tectonic",
  dissolve: "Dissolve",
  noiseOscillation: "Noise oscillation",
};

const SELECTION_LABELS = {
  all: "All",
  percentage: "Percentage",
  random: "Random",
  outsideToInside: "Outside → inside",
  insideToOutside: "Inside → outside",
  everyNth: "Every Nth",
};

const PHASE_LABELS = {
  index: "By index",
  random: "Random",
  radial: "Radial",
  height: "By height",
};

const PRESET_OPTIONS = {
  Breathing: "breathing",
  Tectonic: "tectonic",
  Collapse: "collapse",
  "Floating ink": "floatingInk",
  "Harmonic resonance": "harmonicResonance",
};

export function setupAnimationUI(page, terrainAnimation, pane) {
  let presetValue = "breathing";

  const motionFolder = page.addFolder({ title: "Terrain Motion", expanded: true });
  motionFolder.addBinding(animationParams, "motionType", {
    options: toOptions(MOTION_TYPES, MOTION_LABELS),
  });
  motionFolder.addBinding(animationParams, "amplitude", { min: 0, max: 0.5, step: 0.005 });
  motionFolder.addBinding(animationParams, "amplitudeModEnabled", { label: "amplitude mod" });
  motionFolder.addBinding(animationParams, "amplitudeModRate", {
    label: "mod rate",
    min: 0.05,
    max: 2,
    step: 0.01,
  });
  motionFolder.addBinding(animationParams, "frequency", { min: 0.05, max: 2, step: 0.01 });
  motionFolder.addBinding(animationParams, "speed", { min: 0.05, max: 2, step: 0.01 });
  motionFolder.addBinding(animationParams, "phaseSpread", { min: 0, max: 2, step: 0.01 });
  motionFolder.addBinding(animationParams, "randomness", { min: 0, max: 1, step: 0.01 });

  const axisFolder = motionFolder.addFolder({ title: "Axis influence", expanded: false });
  axisFolder.addBinding(animationParams, "axisX", { label: "X", min: 0, max: 1, step: 0.01 });
  axisFolder.addBinding(animationParams, "axisY", { label: "Y", min: 0, max: 1, step: 0.01 });
  axisFolder.addBinding(animationParams, "axisZ", { label: "Z", min: 0, max: 1, step: 0.01 });

  const selectionFolder = page.addFolder({ title: "Layer Selection", expanded: true });
  selectionFolder.addBinding(animationParams, "selectionMode", {
    options: toOptions(SELECTION_MODES, SELECTION_LABELS),
  });
  selectionFolder.addBinding(animationParams, "percentage", {
    min: 0,
    max: 100,
    step: 1,
  });
  selectionFolder.addBinding(animationParams, "nthStep", {
    min: 2,
    max: 20,
    step: 1,
  });
  selectionFolder.addBinding(animationParams, "seed", { min: 0, max: 99999, step: 1 });
  selectionFolder.addBinding(animationParams, "invertSelection");

  const presetsFolder = page.addFolder({ title: "Presets", expanded: true });
  presetsFolder
    .addBlade({
      view: "list",
      label: "preset",
      options: PRESET_OPTIONS,
      value: presetValue,
    })
    .on("change", (e) => {
      presetValue = e.value;
      applyPreset(e.value);
      pane.refresh();
      terrainAnimation.refreshSelectionAndPhases();
    });

  presetsFolder.addButton({ title: "Apply preset" }).on("click", () => {
    applyPreset(presetValue);
    pane.refresh();
    terrainAnimation.refreshSelectionAndPhases();
  });

  const transportFolder = page.addFolder({ title: "Transport", expanded: true });
  transportFolder.addBinding(animationParams, "playing", { label: "Animate" });

  transportFolder.addButton({ title: "Play" }).on("click", () => {
    animationParams.playing = true;
    pane.refresh();
  });

  transportFolder.addButton({ title: "Stop" }).on("click", () => {
    animationParams.playing = false;
    terrainAnimation.resetLayers();
    pane.refresh();
  });

  const debugFolder = page.addFolder({ title: "Debug", expanded: false });
  debugFolder.addBinding(animationParams, "showSelectedLayers", {
    label: "highlight selected",
  });
  debugFolder.addButton({ title: "Randomize selection" }).on("click", () => {
    terrainAnimation.randomizeSelectionSeed();
    pane.refresh();
  });
  debugFolder.addButton({ title: "Reset terrain" }).on("click", () => {
    animationParams.playing = false;
    terrainAnimation.resetLayers();
    pane.refresh();
  });

  const refreshMotion = () => terrainAnimation.refreshSelectionAndPhases();

  for (const folder of [motionFolder, selectionFolder, presetsFolder, debugFolder]) {
    folder.on("change", refreshMotion);
  }
  transportFolder.on("change", () => {
    if (!animationParams.playing) terrainAnimation.resetLayers();
  });
}
