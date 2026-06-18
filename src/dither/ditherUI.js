import { ditherParams } from "./ditherParams.js";

export function setupDitherUI(pane, ditherOverlay, ditherCycle) {
  const folder = pane.addFolder({ title: "Dither overlay", expanded: false });

  folder.addBinding(ditherParams, "enabled", { label: "enabled" }).on("change", (e) => {
    if (!e.value) ditherCycle?.deactivate();
    refresh();
  });

  const cycleFolder = folder.addFolder({ title: "Voice cycle", expanded: true });

  cycleFolder.addBinding(ditherParams, "cycleEnabled", { label: "auto cycle" }).on("change", (e) => {
    if (!e.value) {
      ditherParams.cycleEnabled = false;
      ditherOverlay.sync();
    } else if (ditherParams.enabled) {
      ditherCycle?.resumeCycle();
    }
    refresh();
  });

  cycleFolder.addBinding(ditherParams, "cycleIntervalSec", {
    label: "interval (s)",
    min: 0.5,
    max: 10,
    step: 0.1,
  });

  cycleFolder.addBinding(ditherParams, "cycleSmooth", { label: "smooth transition" });

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
    cycleFolder.hidden = !ditherParams.enabled;
    ditherOverlay.sync();
  }

  folder.on("change", refresh);
  cycleFolder.on("change", () => ditherOverlay.sync());
  settingsFolder.on("change", () => ditherOverlay.sync());
  refresh();
}
