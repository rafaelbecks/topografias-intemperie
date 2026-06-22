import {
  createAudioInputManager,
  formatDeviceLabel,
  isAudioInputSupported,
  listAudioInputDevices,
} from "../audio/audioInput.js";
import { createSpeechRecognition } from "./speechRecognition.js";
import { createSpeechCommandHandler } from "./speechCommands.js";
import { speechParams } from "./speechParams.js";
import { createSpeechSubtitles } from "./speechSubtitles.js";

const LANG_OPTIONS = {
  "Español (ES)": "es-ES",
  "Español (MX)": "es-MX",
  "English (US)": "en-US",
};

const DEFAULT_DEVICE_OPTION = { Default: "" };

export function setupSpeechUI(
  page,
  { refresh, toggleWireframe, toggleParticles, toggleDither, cycleOceanShape, loadLionzaModel } = {}
) {
  const folder = page.addFolder({ title: "Voice (PoC)", expanded: true });
  const inputSupported = isAudioInputSupported();
  const audioInput = createAudioInputManager();

  const state = {
    supported: false,
    listening: false,
    status: "idle",
    lang: "es-ES",
    error: "",
  };

  const deviceOptions = { ...DEFAULT_DEVICE_OPTION };
  const devicePicker = { inputDeviceId: speechParams.inputDeviceId };

  const subtitles = createSpeechSubtitles();
  const commands = createSpeechCommandHandler(
    {
      toggleWireframe,
      toggleParticles,
      toggleDither,
      cycleOceanShape,
      loadLionzaModel,
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
      refresh?.();
    },
    onError(error) {
      state.error = error;
      refresh?.();
    },
  });

  state.supported = recognition.supported;

  folder.addBinding(state, "supported", { label: "supported", readonly: true });
  folder.addBinding(state, "status", { label: "status", readonly: true });

  const inputFolder = folder.addFolder({ title: "Input", expanded: true });
  let deviceBinding = null;

  function rebuildDeviceBinding() {
    deviceBinding?.dispose();
    deviceBinding = inputFolder
      .addBinding(devicePicker, "inputDeviceId", {
        label: "input device",
        options: deviceOptions,
      })
      .on("change", (e) => {
        speechParams.inputDeviceId = e.value;
        onInputDeviceChange();
      });
  }

  async function refreshInputDevices() {
    if (!inputSupported) return;

    try {
      const devices = await listAudioInputDevices();
      for (const key of Object.keys(deviceOptions)) {
        delete deviceOptions[key];
      }
      Object.assign(deviceOptions, DEFAULT_DEVICE_OPTION);

      for (const [index, device] of devices.entries()) {
        if (!device.deviceId) continue;
        deviceOptions[formatDeviceLabel(device, index)] = device.deviceId;
      }

      if (!Object.values(deviceOptions).includes(devicePicker.inputDeviceId)) {
        devicePicker.inputDeviceId = "";
        speechParams.inputDeviceId = "";
      }

      rebuildDeviceBinding();
    } catch (err) {
      console.error(err);
    }
  }

  async function onInputDeviceChange() {
    if (!state.listening) return;

    try {
      recognition.stop();
      await audioInput.acquire(speechParams.inputDeviceId || undefined);
      recognition.setLang(state.lang);
      await recognition.start();
    } catch (err) {
      audioInput.release();
      state.error = err.message;
      refresh?.();
      console.error(err);
    }
  }

  async function startListening() {
    try {
      if (inputSupported) {
        await audioInput.acquire(speechParams.inputDeviceId || undefined);
        await refreshInputDevices();
      }
      recognition.setLang(state.lang);
      await recognition.start();
    } catch (err) {
      audioInput.release();
      state.error = err.message;
      refresh?.();
      console.error(err);
    }
  }

  function stopListening() {
    recognition.stop();
    audioInput.release();
  }

  if (inputSupported) {
    refreshInputDevices().catch(console.error);

    inputFolder.addButton({ title: "Refresh devices" }).on("click", () => {
      refreshInputDevices().catch(console.error);
    });

    navigator.mediaDevices.addEventListener("devicechange", refreshInputDevices);
  } else {
    inputFolder.addBlade({
      view: "text",
      label: "note",
      value: "Microphone device selection is not supported in this browser.",
      parse: (v) => String(v),
    });
  }

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
    startListening();
  });

  folder.addButton({ title: "Stop" }).on("click", () => {
    stopListening();
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
      if (inputSupported) {
        navigator.mediaDevices.removeEventListener("devicechange", refreshInputDevices);
      }
      deviceBinding?.dispose();
      audioInput.release();
      recognition.destroy();
      subtitles.destroy();
    },
  };
}
