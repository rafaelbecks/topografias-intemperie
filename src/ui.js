import { Pane } from "tweakpane";
import { ENV_OPTIONS, getEnvPath, MODEL_OPTIONS, params } from "./config.js";

export function createUI({
  loadModel,
  loadEnvironment,
  clearEnvironment,
  scene,
  renderer,
  light,
  ambient,
  controls,
  modelLoader,
  input,
}) {
  const pane = new Pane({ title: "Scene Controls" });

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  if (isMobile) pane.expanded = false;

  pane
    .addBlade({
      view: "list",
      label: "model",
      options: MODEL_OPTIONS,
      value: "cart2",
    })
    .on("change", (e) => loadModel(e.value));

  pane
    .addBinding(params, "lightIntensity", { min: 0, max: 5 })
    .on("change", (e) => {
      light.intensity = e.value;
    });

  pane.addBinding(params, "ambient", { min: 0, max: 2 }).on("change", (e) => {
    ambient.intensity = e.value;
  });

  pane.addBinding(params, "exposure", { min: 0.1, max: 3 }).on("change", (e) => {
    renderer.toneMappingExposure = e.value;
  });

  pane.addBinding(params, "roughness", { min: 0, max: 1 }).on("change", (e) => {
    modelLoader.setRoughness(e.value);
  });

  function reloadEnvironment() {
    const path = getEnvPath(params.environment);
    if (path) loadEnvironment(path);
  }

  pane.addBinding(params, "environment", { options: ENV_OPTIONS }).on("change", reloadEnvironment);

  pane
    .addBinding(params, "bgBlur", { min: 0, max: 1, step: 0.01 })
    .on("change", (e) => {
      scene.backgroundBlurriness = e.value;
    });

  pane.addBinding(params, "wireframe", { label: "Wireframe" }).on("change", (e) => {
    modelLoader.setWireframe(e.value);
  });

  pane.addBinding(params, "fpMove", { label: "First person" }).on("change", (e) => {
    if (!e.value) input.resetMoveState();
  });

  pane.addBinding(params, "moveSpeed", {
    label: "move speed",
    min: 1,
    max: 100,
    step: 1,
  });

  pane.addBinding(params, "autoRotate").on("change", (e) => {
    controls.autoRotate = e.value;
  });

  pane
    .addBinding(params, "rotateSpeed", { min: 0, max: 5, step: 0.1 })
    .on("change", (e) => {
      controls.autoRotateSpeed = e.value;
    });

  pane.addBinding(params, "debug", { label: "Show position" }).on("change", (e) => {
    document.getElementById("position").style.display = e.value ? "block" : "none";
  });

  return pane;
}
