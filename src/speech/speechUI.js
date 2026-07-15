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

function createActivityLed(folder) {
  const row = document.createElement("div");
  row.className = "audio-input-activity";
  row.innerHTML = `
    <span class="audio-input-activity__label">activity</span>
    <span class="audio-input-activity__value">
      <span class="audio-input-activity__led" aria-hidden="true"></span>
    </span>
  `;

  const container = () => folder.element.querySelector(".tp-fldv_c") ?? folder.element;
  const led = row.querySelector(".audio-input-activity__led");

  return {
    /** Keep the LED row directly under a Tweakpane binding (device picker). */
    mountAfter(binding) {
      const parent = container();
      const anchor = binding?.element;
      if (anchor?.parentElement === parent) {
        anchor.after(row);
      } else {
        parent.appendChild(row);
      }
    },
    setLevel(level) {
      const clamped = Math.max(0, Math.min(1, level));
      // Square curve so quiet noise stays dim; speech lights it clearly.
      const brightness = clamped * clamped;
      led.style.setProperty("--activity", brightness.toFixed(3));
      led.classList.toggle("is-live", brightness > 0.02);
      led.classList.toggle("is-hot", brightness > 0.35);
    },
    setActive(active) {
      row.classList.toggle("is-active", active);
      if (!active) {
        led.style.setProperty("--activity", "0");
        led.classList.remove("is-live", "is-hot");
      }
    },
    dispose() {
      row.remove();
    },
  };
}

export function setupSpeechUI(
  page,
  {
    refresh,
    toggleWireframe,
    toggleParticles,
    enableDelirioDither,
    toggleDither,
    setOceanManglar,
    setOceanCienaga,
    setOceanHumedal,
    loadLionzaModel,
  } = {}
) {
  const folder = page.addFolder({ title: "Voice (PoC)", expanded: true });
  const inputSupported = isAudioInputSupported();
  const audioInput = createAudioInputManager();

  const state = {
    supported: false,
    trackInput: false,
    listening: false,
    status: "idle",
    lang: "es-ES",
    error: "",
    activeTrack: "—",
  };

  const deviceOptions = { ...DEFAULT_DEVICE_OPTION };
  const devicePicker = { inputDeviceId: speechParams.inputDeviceId };

  const subtitles = createSpeechSubtitles();
  const commands = createSpeechCommandHandler(
    {
      toggleWireframe,
      toggleParticles,
      enableDelirioDither,
      toggleDither,
      setOceanManglar,
      setOceanCienaga,
      setOceanHumedal,
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
  state.trackInput = recognition.trackInputSupported;

  folder.addBinding(state, "supported", { label: "supported", readonly: true });
  folder.addBinding(state, "trackInput", {
    label: "track → ASR",
    readonly: true,
  });
  folder.addBinding(state, "status", { label: "status", readonly: true });

  const inputFolder = folder.addFolder({ title: "Input", expanded: true });
  let deviceBinding = null;
  let activityLed = null;
  let activityRaf = 0;

  function syncActiveTrackLabel() {
    const label = audioInput.getActiveTrackLabel();
    state.activeTrack = label || "—";
  }

  function stopActivityLoop() {
    if (activityRaf) {
      cancelAnimationFrame(activityRaf);
      activityRaf = 0;
    }
    activityLed?.setLevel(0);
    activityLed?.setActive(false);
  }

  function startActivityLoop() {
    stopActivityLoop();
    activityLed?.setActive(true);
    syncActiveTrackLabel();
    refresh?.();

    const tick = () => {
      activityLed?.setLevel(audioInput.getLevel());
      activityRaf = requestAnimationFrame(tick);
    };
    activityRaf = requestAnimationFrame(tick);
  }

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

    // addBinding always appends; keep the picker at the top of the folder.
    const parent = inputFolder.element.querySelector(".tp-fldv_c");
    if (parent && deviceBinding.element) {
      parent.prepend(deviceBinding.element);
    }
    activityLed?.mountAfter(deviceBinding);
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

  function getInputAudioTrack() {
    return audioInput.getStream()?.getAudioTracks()?.[0] ?? null;
  }

  async function openInputMonitor() {
    await audioInput.acquire(speechParams.inputDeviceId || undefined);
    syncActiveTrackLabel();
    startActivityLoop();
  }

  function closeInputMonitor() {
    stopActivityLoop();
    audioInput.release();
    state.activeTrack = "—";
  }

  async function startRecognitionOnCurrentTrack() {
    recognition.setLang(state.lang);
    await recognition.start(getInputAudioTrack());
  }

  async function onInputDeviceChange() {
    // Swap the managed MediaStream, then restart ASR on the new track when possible.
    const wasListening = state.listening;

    try {
      if (wasListening) recognition.stop();
      await openInputMonitor();
      if (wasListening) {
        await startRecognitionOnCurrentTrack();
      }
      refresh?.();
    } catch (err) {
      closeInputMonitor();
      state.error = err.message;
      refresh?.();
      console.error(err);
    }
  }

  async function startListening() {
    try {
      if (inputSupported) {
        await openInputMonitor();
        await refreshInputDevices();
      }
      await startRecognitionOnCurrentTrack();
    } catch (err) {
      closeInputMonitor();
      state.error = err.message;
      refresh?.();
      console.error(err);
    }
  }

  function stopListening() {
    recognition.stop();
    closeInputMonitor();
    refresh?.();
  }

  if (inputSupported) {
    activityLed = createActivityLed(inputFolder);
    rebuildDeviceBinding();

    inputFolder.addBinding(state, "activeTrack", {
      label: "active track",
      readonly: true,
    });

    inputFolder.addButton({ title: "Refresh devices" }).on("click", () => {
      refreshInputDevices().catch(console.error);
    });

    // Open the selected mic for level metering without starting recognition.
    inputFolder.addButton({ title: "Preview input" }).on("click", () => {
      openInputMonitor().catch((err) => {
        closeInputMonitor();
        state.error = err.message;
        refresh?.();
        console.error(err);
      });
    });

    refreshInputDevices().catch(console.error);
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

  folder.addBinding(speechParams, "delirioDitherDurationMs", {
    label: "delirio dither (ms)",
    min: 1000,
    max: 30000,
    step: 500,
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
  } else if (!recognition.trackInputSupported) {
    folder.addBlade({
      view: "text",
      label: "note",
      value: "This browser cannot bind ASR to a chosen mic (needs Chromium 133+). Recognition uses the system default.",
      parse: (v) => String(v),
    });
  }

  return {
    destroy() {
      if (inputSupported) {
        navigator.mediaDevices.removeEventListener("devicechange", refreshInputDevices);
      }
      stopActivityLoop();
      activityLed?.dispose();
      deviceBinding?.dispose();
      audioInput.destroy();
      recognition.destroy();
      subtitles.destroy();
    },
  };
}
