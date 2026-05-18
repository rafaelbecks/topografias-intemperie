import * as THREE from "three";
import { getEnvPath, params } from "./config.js";
import { createSceneSystem } from "./scene.js";
import { createModelLoader } from "./modelLoader.js";
import { createInputSystem } from "./input.js";
import { createUI } from "./ui.js";

const sceneSystem = createSceneSystem();
const { scene, camera, renderer, controls, light, ambient, loadEnvironment, clearEnvironment } =
  sceneSystem;

const modelLoader = createModelLoader({ scene, camera, controls });
const input = createInputSystem(camera, controls);

createUI({
  loadModel: modelLoader.loadModel,
  loadEnvironment,
  clearEnvironment,
  scene,
  renderer,
  light,
  ambient,
  controls,
  modelLoader,
  input,
});

const posEl = document.getElementById("position");
posEl.style.display = "none";

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  input.applyWalkMovement(clock.getDelta());
  modelLoader.updateIntro();
  controls.update();
  renderer.render(scene, camera);

  const p = camera.position;
  const t = controls.target;
  posEl.innerHTML =
    `cam &nbsp; x: ${p.x.toFixed(2)} &nbsp; y: ${p.y.toFixed(2)} &nbsp; z: ${p.z.toFixed(2)}<br>` +
    `target x: ${t.x.toFixed(2)} &nbsp; y: ${t.y.toFixed(2)} &nbsp; z: ${t.z.toFixed(2)}`;
}

modelLoader.loadModel("cart2");
loadEnvironment(getEnvPath(params.environment));
animate();
