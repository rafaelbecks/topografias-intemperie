import * as THREE from "three";
import { createSceneSystem } from "./scene.js";
import { createModelLoader } from "./modelLoader.js";
import { createInputSystem } from "./input.js";
import { createUI } from "./ui.js";
import { createTerrainAnimation } from "./terrain/terrainAnimation.js";
import { createGrainOverlay } from "./grain/grainOverlay.js";
import { createDitherOverlay } from "./dither/ditherOverlay.js";
import { createDitherCycle } from "./dither/ditherCycle.js";
import { createLoading } from "./ui/loading.js";
import { createSceneFreeze } from "./ui/sceneFreeze.js";
import { createSensorClient } from "./sensor/sensorClient.js";
import { createSensorController } from "./sensor/sensorController.js";
import { sensorParams } from "./sensor/sensorConfig.js";
import { setupNfcInput } from "./nfc/nfcInput.js";
import { SCENE_ORDER } from "./scenes.js";
import { createTextOverlay } from "./text/textOverlay.js";
import { createAudioSystem } from "./audio/audioSystem.js";
import { createOceanSystem } from "./ocean/oceanSystem.js";
import { createParticleSystem } from "./particles/particleSystem.js";
import { createStereoEffects } from "./stereo/stereoEffects.js";
import { createPostProcessing } from "./postprocessing/createPostProcessing.js";

export async function bootSceneViewer(sceneName) {
  document.body.classList.add("scene-viewer");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#111111");

  document.getElementById("panel-toggle")?.removeAttribute("hidden");

  const loading = createLoading();

  const sceneSystem = createSceneSystem({ loading });

  const {
    scene,
    camera,
    renderer,
    controls,
    light,
    ambient,
    loadEnvironment,
    clearEnvironment,
    startWebcamEnvironment,
    stopWebcamEnvironment,
    setWebcamAsBackground,
    updateWebcamEnvironment,
    setViewportSize,
  } = sceneSystem;

  const postProcessing = createPostProcessing(renderer, scene, camera);
  const stereoEffects = createStereoEffects(renderer, { postProcessing });
  setViewportSize(stereoEffects.setSize);

  let hasRendered = false;
  const sceneFreeze = createSceneFreeze(renderer, { canCapture: () => hasRendered });

  const terrainAnimation = createTerrainAnimation();
  const particleSystem = createParticleSystem();
  const grainOverlay = createGrainOverlay();
  const ditherOverlay = createDitherOverlay(renderer);
  const ditherCycle = createDitherCycle(ditherOverlay);
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
      particleSystem.bindModel(model);
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
    startWebcamEnvironment,
    stopWebcamEnvironment,
    setWebcamAsBackground,
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
    ditherCycle,
    loading,
    sensorClient,
    sensorController,
    textOverlay,
    audioSystem,
    oceanSystem,
    particleSystem,
    stereoEffects,
    postProcessing,
    sceneFreeze,
  });

  setupNfcInput(sensorClient, {
    sceneOrder: SCENE_ORDER,
    onSceneSelect: (name) => ui.scenesUI.loadScene(name),
  });
  sensorClient.connect(sensorParams.url);

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
    updateWebcamEnvironment(performance.now());
    stereoEffects.render(scene, camera);
    hasRendered = true;
    ditherOverlay.update();
    ditherCycle.update(delta);

    const p = camera.position;
    const t = controls.target;
    posEl.innerHTML =
      `cam &nbsp; x: ${p.x.toFixed(2)} &nbsp; y: ${p.y.toFixed(2)} &nbsp; z: ${p.z.toFixed(2)}<br>` +
      `target x: ${t.x.toFixed(2)} &nbsp; y: ${t.y.toFixed(2)} &nbsp; z: ${t.z.toFixed(2)}`;
  }

  await ui.scenesUI.loadScene(sceneName);
  animate();
}
