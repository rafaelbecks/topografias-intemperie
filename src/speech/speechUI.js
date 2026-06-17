import { createSpeechRecognition } from "./speechRecognition.js";
import { createSpeechCommandHandler } from "./speechCommands.js";
import { speechParams } from "./speechParams.js";
import { createSpeechSubtitles } from "./speechSubtitles.js";

const LANG_OPTIONS = {
  "Español (ES)": "es-ES",
  "Español (MX)": "es-MX",
  "English (US)": "en-US",
};

export function setupSpeechUI(
  pane,
  { toggleWireframe, toggleParticles, toggleDither, cycleOceanShape } = {}
) {
  const folder = pane.addFolder({ title: "Voice (PoC)", expanded: true });

  const state = {
    supported: false,
    listening: false,
    status: "idle",
    lang: "es-ES",
    error: "",
  };

  const subtitles = createSpeechSubtitles();
  const commands = createSpeechCommandHandler(
    {
      toggleWireframe,
      toggleParticles,
      toggleDither,
      cycleOceanShape,
    },
    { getCooldownMs: () => speechParams.commandCooldownMs }
  );

  const recognition = createSpeechRecognition({
    lang: state.lang,
    onResult({ interim, final }) {
      if (final) {
        commands.handleFinalText(final);
        if (speechParams.showSubtitles) subtitles.appendFinal(final);
      } else if (interim) {
        commands.handleInterimText(interim);
      }
      if (speechParams.showSubtitles) subtitles.setInterim(interim);
    },
    onStatus({ listening, status, detail }) {
      state.listening = listening;
      state.status = status;
      state.error = detail ?? "";
      pane.refresh();
    },
    onError(error) {
      state.error = error;
      pane.refresh();
    },
  });

  state.supported = recognition.supported;

  folder.addBinding(state, "supported", { label: "supported", readonly: true });
  folder.addBinding(state, "status", { label: "status", readonly: true });

  folder.addBinding(state, "lang", {
    label: "language",
    options: LANG_OPTIONS,
  });

  folder.addBinding(speechParams, "showSubtitles", { label: "subtitles" }).on("change", (e) => {
    if (!e.value) subtitles.clear();
  });

  folder.addBinding(speechParams, "commandCooldownMs", {
    label: "command cooldown (ms)",
    min: 800,
    max: 8000,
    step: 100,
  });

  folder.addButton({ title: "Start listening" }).on("click", () => {
    recognition.setLang(state.lang);
    recognition.start().catch((err) => {
      state.error = err.message;
      pane.refresh();
      console.error(err);
    });
  });

  folder.addButton({ title: "Stop" }).on("click", () => {
    recognition.stop();
  });

  folder.addButton({ title: "Clear subtitles" }).on("click", () => {
    subtitles.clear();
  });

  if (!recognition.supported) {
    folder.addBlade({
      view: "text",
      label: "note",
      value: "SpeechRecognition is not available. Try Chrome, Edge, or Safari.",
      parse: (v) => String(v),
    });
  }

  return {
    destroy() {
      recognition.destroy();
      subtitles.destroy();
    },
  };
}
