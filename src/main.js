import * as THREE from "three";
import { getEnvPath, params } from "./config.js";
import { createSceneSystem } from "./scene.js";
import { createModelLoader } from "./modelLoader.js";
import { createInputSystem } from "./input.js";
import { createUI } from "./ui.js";
import { createTerrainAnimation } from "./terrain/terrainAnimation.js";
import { createGrainOverlay } from "./grain/grainOverlay.js";
import { createLoading } from "./ui/loading.js";

const loading = createLoading();

const sceneSystem = createSceneSystem({ loading });
const { scene, camera, renderer, controls, light, ambient, loadEnvironment, clearEnvironment } =
  sceneSystem;

const terrainAnimation = createTerrainAnimation();
const grainOverlay = createGrainOverlay();

const modelLoader = createModelLoader({
  scene,
  camera,
  controls,
  loading,
  onModelLoaded: (model) => terrainAnimation.bindModel(model),
});
const input = createInputSystem(camera, controls);

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
});

const posEl = document.getElementById("position");
posEl.style.display = "none";

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  input.applyWalkMovement(clock.getDelta());
  terrainAnimation.update(clock.getElapsedTime());
  modelLoader.updateIntro();
  controls.update();
  renderer.render(scene, camera);

  const p = camera.position;
  const t = controls.target;
  posEl.innerHTML =
    `cam &nbsp; x: ${p.x.toFixed(2)} &nbsp; y: ${p.y.toFixed(2)} &nbsp; z: ${p.z.toFixed(2)}<br>` +
    `target x: ${t.x.toFixed(2)} &nbsp; y: ${t.y.toFixed(2)} &nbsp; z: ${t.z.toFixed(2)}`;
}

Promise.all([
  modelLoader.loadModel(params.model),
  ui.reloadEnvironment(),
]).catch(console.error);

animate();
