import { Pane } from "tweakpane";
import { getEnvPath, params } from "./config.js";
import { captureState, downloadState, loadStateFromFile } from "./state.js";
import { setupAnimationUI } from "./terrain/animationUI.js";
import { setupGrainUI } from "./grain/grainUI.js";
import { setupDitherUI } from "./dither/ditherUI.js";
import { setupSceneTabUI } from "./ui/sceneTabUI.js";
import { setupPaneToggle } from "./ui/paneToggle.js";
import { setupScenesUI } from "./ui/scenesUI.js";
import { createSidePanel } from "./ui/sidePanel.js";
import { setupSensorUI } from "./ui/sensorUI.js";
import { setupKeyboardShortcuts } from "./ui/keyboardShortcuts.js";
import { setupTextUI } from "./text/textUI.js";
import { setupAudioUI } from "./audio/audioUI.js";

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
    pane.refresh();
    sceneTab.refreshModelBlade();
    sceneTab.setupEnvironmentControl();
    grainOverlay.sync();
    ctx.ditherOverlay?.sync();
    ctx.oceanSystem?.sync();
  }

  setupAnimationUI(animationPage, terrainAnimation, pane);
  setupGrainUI(pane, grainOverlay);
  if (ctx.ditherOverlay) {
    setupDitherUI(pane, ctx.ditherOverlay);
  }

  if (ctx.textOverlay) {
    setupTextUI(textPage, ctx.textOverlay);
  }

  if (ctx.audioSystem) {
    setupAudioUI(audioPage, ctx.audioSystem);
  }

  const sensorUI = setupSensorUI(pane, {
    sensorClient: ctx.sensorClient,
    sensorController: ctx.sensorController,
    modelLoader: ctx.modelLoader,
  });

  if (ctx.sensorClient) {
    ctx.sensorClient.onStatus = sensorUI.onStatus;
  }

  setupKeyboardShortcuts({
    audioSystem: ctx.audioSystem,
    toggleSensorActive: sensorUI.toggleActive,
  });

  return { pane, refresh, reloadEnvironment, sensorUI, paneToggle, scenesUI };
}
