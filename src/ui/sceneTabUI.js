import {
  ENV_FORMAT_OPTIONS,
  getDefaultEnvId,
  getEnvOptions,
  getEnvPath,
  getEnvironments,
  MODEL_OPTIONS,
  params,
} from "../config.js";
import { isNoModel } from "../modelUtils.js";
import { setupOceanUI } from "../ocean/oceanUI.js";
import { setupParticleUI } from "../particles/particleUI.js";

const MODEL_BINDING_OPTIONS = Object.fromEntries([
  ["None (text only)", "none"],
  ...MODEL_OPTIONS.map(({ text, value }) => [text, value]),
]);

/**
 * Scene tab controls grouped into Tweakpane folders.
 * @returns {{ setupEnvironmentControl, refreshModelBlade }}
 */
export function setupSceneTabUI(page, ctx) {
  const {
    loadModel,
    loadEnvironment,
    scene,
    renderer,
    light,
    ambient,
    controls,
    modelLoader,
    input,
  } = ctx;

  let modelBinding;
  let envBinding;
  let lastEnvFormat = params.envFormat;

  function reloadEnvironment() {
    const path = getEnvPath(params.environment, params.envFormat);
    if (path) loadEnvironment(path, params.envFormat);
  }

  function setupEnvironmentControl() {
    const environments = getEnvironments(params.envFormat);
    if (!environments[params.environment]) {
      params.environment = getDefaultEnvId(params.envFormat);
    }
    if (params.envFormat !== lastEnvFormat || !envBinding) {
      if (envBinding) envBinding.dispose();
      envBinding = envFolder
        .addBinding(params, "environment", { options: getEnvOptions(params.envFormat) })
        .on("change", reloadEnvironment);
      lastEnvFormat = params.envFormat;
    }
  }

  // — Model —
  const modelFolder = page.addFolder({ title: "Model", expanded: true });

  modelBinding = modelFolder
    .addBinding(params, "model", {
      label: "terrain",
      options: MODEL_BINDING_OPTIONS,
    })
    .on("change", (e) => {
      loadModel(e.value);
    });

  modelFolder.addBinding(params, "roughness", { min: 0, max: 1 }).on("change", (e) => {
    modelLoader.setRoughness(e.value);
  });

  modelFolder.addBinding(params, "wireframe", { label: "wireframe" }).on("change", (e) => {
    modelLoader.setWireframe(e.value);
  });

  if (ctx.particleSystem) {
    setupParticleUI(modelFolder, ctx.particleSystem);
  }

  // — Environment —
  const envFolder = page.addFolder({ title: "Environment", expanded: true });

  envFolder
    .addBinding(params, "envFormat", { label: "type", options: ENV_FORMAT_OPTIONS })
    .on("change", () => {
      setupEnvironmentControl();
      reloadEnvironment();
    });

  setupEnvironmentControl();

  envFolder.addBinding(scene, "environmentIntensity", {
    label: "intensity",
    min: 0,
    max: 5,
    step: 0.01,
  });

  envFolder.addBinding(scene.environmentRotation, "y", {
    label: "rotation Y",
    min: -Math.PI,
    max: Math.PI,
    step: 0.01,
  });

  envFolder.addBinding(params, "bgBlur", { label: "bg blur", min: 0, max: 1, step: 0.01 }).on(
    "change",
    (e) => {
      scene.backgroundBlurriness = e.value;
    }
  );

  // — Lighting (fallback when no env map) —
  const lightingFolder = page.addFolder({ title: "Lighting", expanded: false });

  lightingFolder.addBinding(params, "lightIntensity", { label: "directional", min: 0, max: 5 }).on(
    "change",
    (e) => {
      light.intensity = e.value;
    }
  );

  lightingFolder.addBinding(params, "ambient", { min: 0, max: 2 }).on("change", (e) => {
    ambient.intensity = e.value;
  });

  lightingFolder.addBinding(params, "exposure", { min: 0.1, max: 3 }).on("change", (e) => {
    renderer.toneMappingExposure = e.value;
  });

  // — Camera & navigation —
  const navFolder = page.addFolder({ title: "Camera", expanded: false });

  navFolder.addBinding(params, "fpMove", { label: "first person" }).on("change", (e) => {
    if (!e.value) input.resetMoveState();
  });

  navFolder.addBinding(params, "moveSpeed", {
    label: "move speed",
    min: 1,
    max: 100,
    step: 1,
  });

  navFolder.addBinding(params, "autoRotate", { label: "auto rotate" }).on("change", (e) => {
    controls.autoRotate = e.value;
  });

  navFolder
    .addBinding(params, "rotateSpeed", { label: "rotate speed", min: 0, max: 5, step: 0.1 })
    .on("change", (e) => {
      controls.autoRotateSpeed = e.value;
    });

  // — Debug —
  const debugFolder = page.addFolder({ title: "Debug", expanded: false });

  debugFolder.addBinding(params, "debug", { label: "show position" }).on("change", (e) => {
    document.getElementById("position").style.display = e.value ? "block" : "none";
  });

  if (ctx.oceanSystem) {
    setupOceanUI(page, ctx.oceanSystem);
  }

  return {
    setupEnvironmentControl,
    refreshModelBlade() {
      if (isNoModel(params.model)) {
        params.model = "none";
      }
      modelBinding?.refresh();
    },
  };
}
