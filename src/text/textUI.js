import { TEXT_LINE_OPTIONS } from "./textLines.js";
import { ANIMATION_MODES, textParams } from "./textParams.js";

const DIRECTION_OPTIONS = { LTR: "ltr", RTL: "rtl" };
const ALIGN_OPTIONS = {
  left: "left",
  center: "center",
  right: "right",
  justify: "justify",
};
const ANIMATION_OPTIONS = Object.fromEntries(ANIMATION_MODES.map((mode) => [mode, mode]));

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
    .addBinding(textParams, "content", { label: "content", multiline: true })
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
    .addBinding(textParams, "scale", { label: "size", min: 0.001, max: 2, step: 0.001 })
    .on("change", () => textOverlay.syncTransform());

  folder.addBinding(textParams, "upright", { label: "upright" }).on("change", () => {
    textOverlay.render();
  });

  folder.addBinding(textParams, "wireframe", { label: "wireframe" }).on("change", () => {
    textOverlay.updateMaterialUniforms();
  });

  const layout = folder.addFolder({ title: "Layout", expanded: false });
  layout
    .addBinding(textParams, "direction", { label: "direction", options: DIRECTION_OPTIONS })
    .on("change", () => textOverlay.render());
  layout
    .addBinding(textParams, "align", { label: "alignment", options: ALIGN_OPTIONS })
    .on("change", () => textOverlay.render());
  layout
    .addBinding(textParams, "lineWidth", { label: "line width", min: 500, max: 3000, step: 10 })
    .on("change", () => textOverlay.render());
  layout
    .addBinding(textParams, "lineHeight", { label: "line height", min: 0.8, max: 2, step: 0.05 })
    .on("change", () => textOverlay.render());

  const animation = folder.addFolder({ title: "Animation", expanded: true });
  animation
    .addBinding(textParams, "animationMode", {
      label: "mode",
      options: ANIMATION_OPTIONS,
    })
    .on("change", () => textOverlay.render());

  const twister = animation.addFolder({ title: "Twister", expanded: false });
  twister
    .addBinding(textParams, "twisterSpeed", { label: "speed", min: 0.05, max: 3, step: 0.05 })
    .on("change", () => textOverlay.updateMaterialUniforms());
  twister
    .addBinding(textParams, "twisterHeight", { label: "height", min: 0, max: 500, step: 10 })
    .on("change", () => textOverlay.updateMaterialUniforms());
  twister
    .addBinding(textParams, "twisterRadius", { label: "radius", min: 50, max: 600, step: 10 })
    .on("change", () => textOverlay.updateMaterialUniforms());

  const flip = animation.addFolder({ title: "Flip", expanded: false });
  flip
    .addBinding(textParams, "flipSpeed", { label: "speed", min: 0.05, max: 3, step: 0.05 })
    .on("change", () => textOverlay.updateMaterialUniforms());
  flip
    .addBinding(textParams, "flipPauseDuration", {
      label: "pause",
      min: 0,
      max: 2,
      step: 0.05,
    })
    .on("change", () => textOverlay.updateMaterialUniforms());

  const orbit = animation.addFolder({ title: "Orbit", expanded: false });
  orbit
    .addBinding(textParams, "orbitSpeed", { label: "speed", min: 0, max: 0.5, step: 0.01 })
    .on("change", () => {});
}
