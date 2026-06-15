import { particleParams } from "./particleParams.js";

export function setupParticleUI(modelFolder, particleSystem) {
  const folder = modelFolder.addFolder({ title: "Particles", expanded: false });

  folder.addBinding(particleParams, "enabled", { label: "enabled" });
  folder.addBinding(particleParams, "useModelColors", { label: "model colors" });
  folder.addBinding(particleParams, "color", {
    label: "color",
    view: "color",
    alpha: false,
  });
  folder.addBinding(particleParams, "luminance", {
    label: "luminance",
    min: 0,
    max: 3,
    step: 0.05,
  });
  folder.addBinding(particleParams, "count", {
    label: "count",
    min: 1000,
    max: 300000,
    step: 1000,
  });
  folder.addBinding(particleParams, "size", { label: "size", min: 0.1, max: 10, step: 0.05 });
  folder.addBinding(particleParams, "opacity", { min: 0, max: 1, step: 0.01 });

  folder.on("change", () => particleSystem.sync());
}
