import {
  ENV_FORMAT_OPTIONS,
  getDefaultEnvId,
  getEnvOptions,
  getEnvPath,
  getEnvironments,
  MODEL_OPTIONS,
  params,
} from "../config.js";
import { exportContourShell } from "../model/shellExport.js";
import { isNoModel } from "../modelUtils.js";
import { setupOceanUI } from "../ocean/oceanUI.js";
import { setupParticleUI } from "../particles/particleUI.js";

const MODEL_BINDING_OPTIONS = Object.fromEntries([
  ["None (text only)", "none"],
  ...MODEL_OPTIONS.map(({ text, value }) => [text, value]),
]);

const DEFAULT_CAMERA_OPTION = { "System default": "" };
const cameraSupported = Boolean(
  navigator.mediaDevices?.getUserMedia && navigator.mediaDevices?.enumerateDevices
);

async function listVideoInputDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === "videoinput");
}

function formatCameraLabel(device, index) {
  const name = device.label?.trim();
  if (name) return name;
  return `Camera ${index + 1}`;
}

/**
 * Scene tab controls grouped into Tweakpane folders.
 * @returns {{ setupEnvironmentControl, refreshModelBlade }}
 */
export function setupSceneTabUI(page, ctx) {
  const {
    loadModel,
    loadEnvironment,
    startWebcamEnvironment,
    stopWebcamEnvironment,
    setWebcamAsBackground,
    scene,
    renderer,
    light,
    ambient,
    controls,
    modelLoader,
    input,
    terrainAnimation,
  } = ctx;

  let modelBinding;
  let envBinding;
  let webcamEnvBinding;
  let cameraDeviceBinding;
  let lastEnvFormat = params.envFormat;

  const cameraOptions = { ...DEFAULT_CAMERA_OPTION };
  const cameraPicker = { webcamDeviceId: params.webcamDeviceId };

  function reloadEnvironment() {
    const path = getEnvPath(params.environment, params.envFormat);
    if (path) loadEnvironment(path, params.envFormat);
    webcamEnvBinding?.refresh();
  }

  async function enableWebcamEnv() {
    try {
      await startWebcamEnvironment();
      cameraPicker.webcamDeviceId = params.webcamDeviceId;
      await refreshCameraDevices();
    } catch (err) {
      console.error(err);
      params.webcamEnv = false;
      webcamEnvBinding?.refresh();
      alert(`Webcam environment failed: ${err.message}`);
    }
  }

  function rebuildCameraDeviceBinding() {
    if (!cameraSupported) return;
    cameraDeviceBinding?.dispose();
    cameraDeviceBinding = envFolder
      .addBinding(cameraPicker, "webcamDeviceId", {
        label: "webcam device",
        options: cameraOptions,
      })
      .on("change", async (e) => {
        params.webcamDeviceId = e.value;
        if (!params.webcamEnv) return;
        await enableWebcamEnv();
      });

    // Keep the device picker next to the webcam toggles.
    const parent = envFolder.element.querySelector(".tp-fldv_c");
    if (parent && cameraDeviceBinding.element && webcamEnvBinding?.element) {
      parent.insertBefore(cameraDeviceBinding.element, webcamEnvBinding.element.nextSibling);
    }
  }

  async function refreshCameraDevices() {
    if (!cameraSupported) return;

    try {
      const devices = await listVideoInputDevices();
      for (const key of Object.keys(cameraOptions)) {
        delete cameraOptions[key];
      }
      Object.assign(cameraOptions, DEFAULT_CAMERA_OPTION);

      for (const [index, device] of devices.entries()) {
        if (!device.deviceId) continue;
        cameraOptions[formatCameraLabel(device, index)] = device.deviceId;
      }

      if (!Object.values(cameraOptions).includes(cameraPicker.webcamDeviceId)) {
        cameraPicker.webcamDeviceId = "";
        params.webcamDeviceId = "";
      } else {
        cameraPicker.webcamDeviceId = params.webcamDeviceId;
      }

      rebuildCameraDeviceBinding();
    } catch (err) {
      console.error(err);
    }
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

  modelFolder.addBinding(params, "hideModel", { label: "hide model" }).on("change", (e) => {
    modelLoader.setHidden(e.value);
  });

  modelFolder.addBinding(params, "roughness", { min: 0, max: 1 }).on("change", (e) => {
    modelLoader.setRoughness(e.value);
  });

  modelFolder.addBinding(params, "wireframe", { label: "wireframe" }).on("change", (e) => {
    modelLoader.setWireframe(e.value);
  });

  modelFolder.addButton({ title: "Export shell (.glb)" }).on("click", async () => {
    try {
      const result = await exportContourShell({
        model: modelLoader.getCurrentModel(),
        modelName: params.model,
        terrainAnimation,
      });
      if (!result.ok) alert(result.reason);
    } catch (err) {
      console.error(err);
      alert(`Shell export failed: ${err.message}`);
    }
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

  webcamEnvBinding = envFolder
    .addBinding(params, "webcamEnv", { label: "webcam env" })
    .on("change", async (e) => {
      if (e.value) {
        await enableWebcamEnv();
        return;
      }
      stopWebcamEnvironment({ resetParam: true });
      reloadEnvironment();
    });

  if (cameraSupported) {
    rebuildCameraDeviceBinding();
    refreshCameraDevices().catch(console.error);
    navigator.mediaDevices.addEventListener("devicechange", () => {
      refreshCameraDevices().catch(console.error);
    });
  }

  envFolder
    .addBinding(params, "webcamAsBackground", { label: "webcam as bg" })
    .on("change", (e) => {
      setWebcamAsBackground(e.value);
    });

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
