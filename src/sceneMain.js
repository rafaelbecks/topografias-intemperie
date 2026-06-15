import * as THREE from "three";
import { createSceneSystem } from "./scene.js";
import { createModelLoader } from "./modelLoader.js";
import { createInputSystem } from "./input.js";
import { createUI } from "./ui.js";
import { createTerrainAnimation } from "./terrain/terrainAnimation.js";
import { createGrainOverlay } from "./grain/grainOverlay.js";
import { createDitherOverlay } from "./dither/ditherOverlay.js";
import { createLoading } from "./ui/loading.js";
import { createSensorClient } from "./sensor/sensorClient.js";
import { createSensorController } from "./sensor/sensorController.js";
import { sensorParams } from "./sensor/sensorConfig.js";
import { createTextOverlay } from "./text/textOverlay.js";
import { createAudioSystem } from "./audio/audioSystem.js";
import { createOceanSystem } from "./ocean/oceanSystem.js";

export async function bootSceneViewer(sceneName) {
  document.body.classList.remove("front-page");
  document.body.classList.add("scene-viewer");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#111111");

  document.getElementById("panel-toggle")?.removeAttribute("hidden");

  const loading = createLoading();

  const sceneSystem = createSceneSystem({ loading });

  const { scene, camera, renderer, controls, light, ambient, loadEnvironment, clearEnvironment } =
    sceneSystem;

  const terrainAnimation = createTerrainAnimation();
  const grainOverlay = createGrainOverlay();
  const ditherOverlay = createDitherOverlay(renderer);
  const input = createInputSystem(camera, controls);
  const audioSystem = createAudioSystem({ camera, loading });

  const sensorClient = createSensorClient({
    onState: (state) => sensorController.handleState(state),
  });

  let sensorController;
  let oceanSystem;
  const modelLoader = createModelLoader({
    scene,
    camera,
    controls,
    loading,
    onModelLoaded: (model) => {
      terrainAnimation.bindModel(model);
      oceanSystem.bindModel();
      oceanSystem.sync();
      textOverlay.syncTransform();
      audioSystem.bindModel(model);
      if (sensorParams.enabled) {
        sensorController.calibrate(sensorClient.getState());
      }
    },
  });

  oceanSystem = createOceanSystem({
    scene,
    getModelBounds: () => modelLoader.getModelBounds(),
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
    ditherOverlay,
    loading,
    sensorClient,
    sensorController,
    textOverlay,
    audioSystem,
    oceanSystem,
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
    audioSystem.update();
    oceanSystem.update(delta);
    renderer.render(scene, camera);
    ditherOverlay.update();

    const p = camera.position;
    const t = controls.target;
    posEl.innerHTML =
      `cam &nbsp; x: ${p.x.toFixed(2)} &nbsp; y: ${p.y.toFixed(2)} &nbsp; z: ${p.z.toFixed(2)}<br>` +
      `target x: ${t.x.toFixed(2)} &nbsp; y: ${t.y.toFixed(2)} &nbsp; z: ${t.z.toFixed(2)}`;
  }

  await ui.scenesUI.loadScene(sceneName);
  animate();
}
