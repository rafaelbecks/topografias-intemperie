import { ditherParams } from "./ditherParams.js";

export function setupDitherUI(pane, ditherOverlay) {
  const folder = pane.addFolder({ title: "Dither overlay", expanded: false });

  folder.addBinding(ditherParams, "enabled", { label: "enabled" });

  const settingsFolder = folder.addFolder({ title: "Dither settings", expanded: true });

  settingsFolder.addBinding(ditherParams, "saturate", {
    label: "saturation",
    min: 0,
    max: 1,
    step: 0.1,
  });
  settingsFolder.addBinding(ditherParams, "tableValuesR", {
    label: "red table values",
    min: 0,
    max: 1,
    step: 0.1,
  });
  settingsFolder.addBinding(ditherParams, "tableValuesG", {
    label: "green table values",
    min: 0,
    max: 1,
    step: 0.1,
  });
  settingsFolder.addBinding(ditherParams, "tableValuesB", {
    label: "blue table values",
    min: 0,
    max: 1,
    step: 0.1,
  });

  function refresh() {
    settingsFolder.hidden = !ditherParams.enabled;
    ditherOverlay.sync();
  }

  folder.on("change", refresh);
  settingsFolder.on("change", () => ditherOverlay.sync());
  refresh();
}
