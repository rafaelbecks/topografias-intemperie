import { Pane } from "tweakpane";
import { getEnvPath, params } from "./config.js";
import { captureState, downloadState, loadStateFromFile } from "./state.js";
import { setupAnimationUI } from "./terrain/animationUI.js";
import { setupGrainUI } from "./grain/grainUI.js";
import { setupDitherUI } from "./dither/ditherUI.js";
import { setupOrderedDitherUI } from "./postprocessing/orderedDitherUI.js";
import { setupStereoUI } from "./stereo/stereoUI.js";
import { setupSceneTabUI } from "./ui/sceneTabUI.js";
import { setupPaneToggle } from "./ui/paneToggle.js";
import { setupScenesUI } from "./ui/scenesUI.js";
import { createSidePanel } from "./ui/sidePanel.js";
import { setupSensorUI } from "./ui/sensorUI.js";
import { setupKeyboardShortcuts } from "./ui/keyboardShortcuts.js";
import { setupTextUI } from "./text/textUI.js";
import { setupAudioUI } from "./audio/audioUI.js";
import { setupSpeechUI } from "./speech/speechUI.js";
import { ditherParams } from "./dither/ditherParams.js";
import {
  activateOrderedDitherVoice,
  deactivateOrderedDitherVoice,
} from "./postprocessing/orderedDitherParams.js";
import { particleParams } from "./particles/particleParams.js";
import {
  applyOceanFlatNoise,
  applyOceanCueva,
  applyOceanSphere,
  applyOceanTorusNoise,
} from "./ocean/oceanShapeCycle.js";
import { speechParams } from "./speech/speechParams.js";
import { FRONT_SCENE, SCENE_ORDER } from "./scenes.js";

export function createUI(ctx) {
  const { loadModel, loadEnvironment, scene, camera, controls, terrainAnimation, grainOverlay } =
    ctx;

  function reloadEnvironment(opts) {
    const path = getEnvPath(params.environment, params.envFormat);
    if (path) return loadEnvironment(path, params.envFormat, opts);
    return Promise.resolve();
  }

  const { panel, scroll, toggleBtn } = createSidePanel();
  const pane = new Pane({ title: "Controls", container: scroll });
  const paneToggle = setupPaneToggle({ panel, toggleBtn });

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  if (isMobile) pane.expanded = false;

  const stateFolder = pane.addFolder({ title: "State", expanded: false });

  stateFolder.addButton({ title: "Export JSON" }).on("click", () => {
    downloadState(captureState({ scene, camera, controls }));
  });

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "application/json,.json";
  fileInput.hidden = true;
  document.body.appendChild(fileInput);

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    fileInput.value = "";
    if (!file) return;
    try {
      await loadStateFromFile(file, {
        ...ctx,
        ui: { refresh },
        reloadEnvironment,
        loadModel,
      });
    } catch (err) {
      console.error(err);
      alert(`Failed to load memory: ${err.message}`);
    }
  });

  stateFolder.addButton({ title: "Load JSON" }).on("click", () => {
    fileInput.click();
  });

  const scenesUI = setupScenesUI(stateFolder, {
    ...ctx,
    ui: { refresh: () => refresh() },
    reloadEnvironment,
    loadModel,
  });

  const tab = pane.addTab({
    pages: [
      { title: "Scene" },
      { title: "Animation" },
      { title: "Text" },
      { title: "Audio" },
    ],
  });

  const scenePage = tab.pages[0];
  const animationPage = tab.pages[1];
  const textPage = tab.pages[2];
  const audioPage = tab.pages[3];

  const sceneTab = setupSceneTabUI(scenePage, ctx);

  function refresh() {
    sceneTab.setupEnvironmentControl();
    sceneTab.refreshModelBlade();
    pane.refresh();
    grainOverlay.sync();
    ctx.ditherOverlay?.sync();
    ctx.oceanSystem?.sync();
    ctx.particleSystem?.sync();
    ctx.stereoEffects?.sync();
    ctx.postProcessing?.sync();
    ctx.orderedDitherUI?.refresh();
  }

  setupAnimationUI(animationPage, terrainAnimation, pane);
  setupGrainUI(pane, grainOverlay);
  if (ctx.ditherOverlay) {
    setupDitherUI(pane, ctx.ditherOverlay, ctx.ditherCycle);
  }

  let orderedDitherUI;
  if (ctx.postProcessing) {
    orderedDitherUI = setupOrderedDitherUI(pane, ctx.postProcessing, ctx.stereoEffects);
    ctx.orderedDitherUI = orderedDitherUI;
  }

  if (ctx.stereoEffects) {
    setupStereoUI(pane, ctx.stereoEffects, () => orderedDitherUI?.refresh());
  }

  if (ctx.textOverlay) {
    setupTextUI(textPage, ctx.textOverlay);
  }

  if (ctx.audioSystem) {
    setupAudioUI(audioPage, ctx.audioSystem);
  }

  function toggleWireframe() {
    params.wireframe = !params.wireframe;
    ctx.modelLoader.setWireframe(params.wireframe);
    refresh();
  }

  function toggleParticles() {
    particleParams.enabled = !particleParams.enabled;
    ctx.particleSystem?.sync();
    refresh();
  }

  function toggleDither() {
    if (ditherParams.enabled && ditherParams.cycleEnabled) {
      ctx.ditherCycle?.deactivate();
      deactivateOrderedDitherVoice();
    } else {
      ctx.ditherCycle?.activate();
      activateOrderedDitherVoice();
    }
    ctx.ditherOverlay?.sync();
    ctx.postProcessing?.sync();
    refresh();
  }

  let delirioDitherTimer = null;

  function enableDelirioDither() {
    if (delirioDitherTimer) clearTimeout(delirioDitherTimer);

    if (!ditherParams.enabled || !ditherParams.cycleEnabled) {
      ctx.ditherCycle?.activate();
      ctx.ditherOverlay?.sync();
      refresh();
    }

    delirioDitherTimer = setTimeout(() => {
      delirioDitherTimer = null;
      if (!ditherParams.enabled) return;
      ctx.ditherCycle?.deactivate();
      ctx.ditherOverlay?.sync();
      refresh();
    }, speechParams.delirioDitherDurationMs);
  }

  function setOceanManglar() {
    if (!ctx.oceanSystem) return;
    applyOceanTorusNoise(ctx.oceanSystem);
    refresh();
  }

  function setOceanCienaga() {
    if (!ctx.oceanSystem) return;
    applyOceanSphere(ctx.oceanSystem);
    refresh();
  }

  function setOceanHumedal() {
    if (!ctx.oceanSystem) return;
    applyOceanFlatNoise(ctx.oceanSystem);
    refresh();
  }

  function setOceanCueva() {
    if (!ctx.oceanSystem) return;
    applyOceanCueva(ctx.oceanSystem);
    refresh();
  }

  function loadLionzaModel() {
    params.model = "lionza";
    loadModel("lionza");
    refresh();
  }

  setupSpeechUI(audioPage, {
    refresh: () => refresh(),
    toggleWireframe,
    toggleParticles,
    enableDelirioDither,
    toggleDither,
    setOceanManglar,
    setOceanCienaga,
    setOceanHumedal,
    setOceanCueva,
    loadLionzaModel,
  });

  const sensorUI = setupSensorUI(pane, {
    sensorClient: ctx.sensorClient,
    sensorController: ctx.sensorController,
    modelLoader: ctx.modelLoader,
  });

  if (ctx.sensorClient) {
    ctx.sensorClient.onStatus = sensorUI.onStatus;
  }

  setupKeyboardShortcuts({
    toggleSensorActive: sensorUI.toggleActive,
    toggleWireframe,
    toggleParticles,
    frontScene: FRONT_SCENE,
    sceneOrder: SCENE_ORDER,
    onSceneSelect: (name) => scenesUI.loadScene(name),
  });

  return { pane, refresh, reloadEnvironment, sensorUI, paneToggle, scenesUI };
}
