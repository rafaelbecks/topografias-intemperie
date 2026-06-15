import { audioParams } from "./audioParams.js";
import {
  DEFAULT_ENV_SOUND,
  DEFAULT_OBJECT_SOUND,
  ENV_SOUNDS,
  OBJECT_SOUNDS,
  getSoundOptions,
} from "./audioSources.js";

export function setupAudioUI(page, audioSystem) {
  const folder = page.addFolder({ title: "Spatial audio", expanded: true });

  folder.addButton({ title: "Play" }).on("click", () => {
    audioSystem.play().catch(console.error);
  });

  folder.addButton({ title: "Stop" }).on("click", () => {
    audioSystem.stop();
  });

  folder.addBinding(audioParams, "envSound", {
    label: "env sound",
    options: getSoundOptions(ENV_SOUNDS),
  });

  folder.addBinding(audioParams, "envVolume", {
    label: "env volume",
    min: 0,
    max: 1,
    step: 0.01,
  });

  folder.addBinding(audioParams, "objectSound", {
    label: "object sound",
    options: getSoundOptions(OBJECT_SOUNDS),
  });

  folder.addBinding(audioParams, "objectVolume", {
    label: "object volume",
    min: 0,
    max: 1,
    step: 0.01,
  });

  folder.addBinding(audioParams, "sensitivity", {
    label: "sensitivity",
    min: 0.2,
    max: 4,
    step: 0.05,
  });

  const advanced = folder.addFolder({ title: "Loop fade", expanded: false });
  advanced.addBinding(audioParams, "loopFadeMs", {
    label: "fade (ms)",
    min: 100,
    max: 3000,
    step: 50,
  });

  folder.on("change", () => audioSystem.sync().catch(console.error));
  advanced.on("change", () => audioSystem.sync().catch(console.error));

  return {
    clampSelections() {
      if (!ENV_SOUNDS[audioParams.envSound]) {
        audioParams.envSound = DEFAULT_ENV_SOUND;
      }
      if (!OBJECT_SOUNDS[audioParams.objectSound]) {
        audioParams.objectSound = DEFAULT_OBJECT_SOUND;
      }
    },
  };
}
