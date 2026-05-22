import { TEXT_LINE_OPTIONS } from "./textLines.js";
import { textParams } from "./textParams.js";

export function setupTextUI(page, textOverlay) {
  const folder = page.addFolder({ title: "Poem text", expanded: true });

  folder.addBinding(textParams, "enabled", { label: "enabled" }).on("change", (ev) => {
    textOverlay.setEnabled(ev.value);
  });

  folder
    .addBinding(textParams, "lineId", {
      label: "line",
      options: TEXT_LINE_OPTIONS,
    })
    .on("change", () => textOverlay.render());

  folder
    .addBinding(textParams, "fontSize", { label: "font size", min: 24, max: 200, step: 1 })
    .on("change", () => textOverlay.render());

  folder
    .addBinding(textParams, "letterSpacing", {
      label: "letter spacing",
      min: -0.1,
      max: 0.5,
      step: 0.01,
    })
    .on("change", () => textOverlay.render());

  folder
    .addBinding(textParams, "depth", { min: 0, max: 40, step: 1 })
    .on("change", () => textOverlay.render());

  folder
    .addBinding(textParams, "scale", { label: "size", min: 0.05, max: 2, step: 0.05 })
    .on("change", () => textOverlay.syncTransform());

  folder.addBinding(textParams, "wireframe", { label: "wireframe" }).on("change", () => {
    textOverlay.updateMaterialUniforms();
  });

  const twister = folder.addFolder({ title: "Twister", expanded: true });

  twister
    .addBinding(textParams, "twisterSpeed", { label: "speed", min: 0.05, max: 3, step: 0.05 })
    .on("change", () => textOverlay.updateMaterialUniforms());

  twister
    .addBinding(textParams, "twisterHeight", { label: "height", min: 0, max: 500, step: 10 })
    .on("change", () => textOverlay.updateMaterialUniforms());

  twister
    .addBinding(textParams, "twisterRadius", { label: "radius", min: 50, max: 600, step: 10 })
    .on("change", () => textOverlay.updateMaterialUniforms());

  const orbit = folder.addFolder({ title: "Orbit", expanded: false });
  orbit
    .addBinding(textParams, "orbitSpeed", { label: "speed", min: 0, max: 0.5, step: 0.01 })
    .on("change", () => {});
}
