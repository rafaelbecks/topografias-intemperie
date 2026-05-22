import * as THREE from "three";
import { getEnvPath, params } from "./config.js";
import { createSceneSystem } from "./scene.js";
import { createModelLoader } from "./modelLoader.js";
import { createInputSystem } from "./input.js";
import { createUI } from "./ui.js";
import { createTerrainAnimation } from "./terrain/terrainAnimation.js";
import { createGrainOverlay } from "./grain/grainOverlay.js";
import { createLoading } from "./ui/loading.js";
import { createSensorClient } from "./sensor/sensorClient.js";
import { createSensorController } from "./sensor/sensorController.js";
import { sensorParams } from "./sensor/sensorConfig.js";
import { createTextOverlay } from "./text/textOverlay.js";
import { textParams } from "./text/textParams.js";

const loading = createLoading();

const sceneSystem = createSceneSystem({ loading });

const { scene, camera, renderer, controls, light, ambient, loadEnvironment, clearEnvironment } =
  sceneSystem;

const terrainAnimation = createTerrainAnimation();
const grainOverlay = createGrainOverlay();
const input = createInputSystem(camera, controls);

const sensorClient = createSensorClient({
  onState: (state) => sensorController.handleState(state),
});

let sensorController;
const modelLoader = createModelLoader({
  scene,
  camera,
  controls,
  loading,
  onModelLoaded: (model) => {
    terrainAnimation.bindModel(model);
    textOverlay.syncTransform();
    if (sensorParams.enabled) {
      sensorController.calibrate(sensorClient.getState());
    }
  },
});

sensorController = createSensorController({
  getModel: () => modelLoader.getCurrentModel(),
  controls,
  input,
});

const textOverlay = createTextOverlay({
  scene,
  loading,
  getModelBounds: () => modelLoader.getModelBounds(),
});

const ui = createUI({
  loadModel: modelLoader.loadModel,
  loadEnvironment,
  clearEnvironment,
  scene,
  camera,
  renderer,
  light,
  ambient,
  controls,
  modelLoader,
  input,
  terrainAnimation,
  grainOverlay,
  loading,
  sensorClient,
  sensorController,
  textOverlay,
});

const posEl = document.getElementById("position");
posEl.style.display = "none";

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  input.applyWalkMovement(delta);
  sensorController.update(delta);
  terrainAnimation.update(clock.getElapsedTime());
  textOverlay.update(delta);
  modelLoader.updateIntro();
  controls.update();
  renderer.render(scene, camera);

  const p = camera.position;
  const t = controls.target;
  posEl.innerHTML =
    `cam &nbsp; x: ${p.x.toFixed(2)} &nbsp; y: ${p.y.toFixed(2)} &nbsp; z: ${p.z.toFixed(2)}<br>` +
    `target x: ${t.x.toFixed(2)} &nbsp; y: ${t.y.toFixed(2)} &nbsp; z: ${t.z.toFixed(2)}`;
}

const startup = [
  modelLoader.loadModel(params.model),
  ui.reloadEnvironment(),
];
if (textParams.enabled) {
  startup.push(textOverlay.init());
}

Promise.all(startup).catch(console.error);

animate();
