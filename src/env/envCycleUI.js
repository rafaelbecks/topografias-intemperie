import { envCycleParams } from "./envCycleParams.js";

export function setupEnvCycleUI(page, envCycle, { isFrontScene }) {
  const folder = page.addFolder({ title: "Env cycle (front only)", expanded: false });

  folder.addBinding(envCycleParams, "enabled", { label: "auto cycle" }).on("change", (e) => {
    if (e.value) envCycle.resume();
    else envCycle.stop();
    refreshVisibility();
  });

  folder.addBinding(envCycleParams, "intervalSec", {
    label: "interval (s)",
    min: 2,
    max: 120,
    step: 0.5,
  });

  folder.addBinding(envCycleParams, "lookahead", {
    label: "preload ahead",
    min: 1,
    max: 6,
    step: 1,
  }).on("change", () => envCycle.resume());

  function refreshVisibility() {
    folder.hidden = !isFrontScene();
  }

  refreshVisibility();

  return { refreshVisibility };
}
