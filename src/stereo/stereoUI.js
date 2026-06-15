import { stereoParams } from "./stereoParams.js";

function addStereoSettings(folder, stereoEffects) {
  folder.addBinding(stereoParams, "eyeSep", {
    label: "eye separation",
    min: 0,
    max: 0.2,
    step: 0.001,
  });
  folder.addBinding(stereoParams, "planeDistance", {
    label: "plane distance",
    min: 1,
    max: 1000,
    step: 1,
  });

  folder.on("change", () => stereoEffects.applyParams());
}

export function setupStereoUI(pane, stereoEffects) {
  const anaglyphFolder = pane.addFolder({ title: "Anaglyph", expanded: false });
  const anaglyphSettings = anaglyphFolder.addFolder({ title: "Anaglyph settings", expanded: true });

  anaglyphFolder.addBinding(stereoParams, "anaglyphEnabled", { label: "enabled" });

  const parallaxFolder = pane.addFolder({ title: "Parallax barrier", expanded: false });
  const parallaxSettings = parallaxFolder.addFolder({
    title: "Parallax barrier settings",
    expanded: true,
  });

  parallaxFolder.addBinding(stereoParams, "parallaxBarrierEnabled", { label: "enabled" });

  addStereoSettings(anaglyphSettings, stereoEffects);
  addStereoSettings(parallaxSettings, stereoEffects);

  function refresh() {
    anaglyphSettings.hidden = !stereoParams.anaglyphEnabled;
    parallaxSettings.hidden = !stereoParams.parallaxBarrierEnabled;
    stereoEffects.sync();
  }

  anaglyphFolder.on("change", () => {
    if (stereoParams.anaglyphEnabled) {
      stereoParams.parallaxBarrierEnabled = false;
    }
    refresh();
  });

  parallaxFolder.on("change", () => {
    if (stereoParams.parallaxBarrierEnabled) {
      stereoParams.anaglyphEnabled = false;
    }
    refresh();
  });

  refresh();
}
