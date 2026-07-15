const SpeechRecognitionCtor =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

/** Chromium 133+ ships SpeechRecognition.start(MediaStreamTrack). */
function supportsTrackInput() {
  if (!SpeechRecognitionCtor) return false;
  const match = navigator.userAgent.match(/(?:Chrome|Chromium|Edg)\/(\d+)/);
  if (!match) return false;
  return Number(match[1]) >= 133;
}

/**
 * Thin wrapper around the Web Speech API for continuous recognition with interim results.
 * Passes a MediaStreamTrack into start() when the browser supports it so recognition
 * follows the selected input device instead of only the system default mic.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/start
 */
export function createSpeechRecognition(options = {}) {
  if (!SpeechRecognitionCtor) {
    return {
      supported: false,
      trackInputSupported: false,
      start() {
        return Promise.reject(new Error("Speech recognition is not supported in this browser"));
      },
      stop() {},
      destroy() {},
    };
  }

  const recognition = new SpeechRecognitionCtor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = options.lang ?? "es-ES";

  const trackInputSupported = supportsTrackInput();
  let listening = false;
  let shouldRestart = false;
  /** @type {MediaStreamTrack | null} */
  let audioTrack = null;

  const callbacks = {
    onResult: options.onResult ?? (() => {}),
    onStatus: options.onStatus ?? (() => {}),
    onError: options.onError ?? (() => {}),
  };

  function emitStatus(status, detail) {
    callbacks.onStatus({ listening, status, detail });
  }

  function beginRecognition() {
    if (audioTrack && audioTrack.readyState === "live") {
      // Prefer the selected getUserMedia track when the browser understands it.
      // Older engines ignore the extra argument and keep using the default mic.
      recognition.start(audioTrack);
      return;
    }
    recognition.start();
  }

  recognition.onresult = (event) => {
    let interim = "";
    let final = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0]?.transcript ?? "";
      if (result.isFinal) {
        final += text;
      } else {
        interim += text;
      }
    }

    callbacks.onResult({ interim, final });
  };

  recognition.onerror = (event) => {
    callbacks.onError(event.error);

    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      shouldRestart = false;
      listening = false;
      emitStatus("permission-denied", event.error);
      return;
    }

    if (event.error === "no-speech" || event.error === "aborted") {
      return;
    }

    emitStatus("error", event.error);
  };

  recognition.onend = () => {
    listening = false;
    if (shouldRestart) {
      try {
        beginRecognition();
        listening = true;
        emitStatus("listening");
      } catch {
        emitStatus("idle");
      }
      return;
    }
    emitStatus("idle");
  };

  recognition.onstart = () => {
    listening = true;
    emitStatus("listening");
  };

  return {
    supported: true,
    trackInputSupported,

    setLang(lang) {
      recognition.lang = lang;
    },

    /**
     * @param {MediaStreamTrack | null | undefined} track
     *   Optional audio track from getUserMedia. Used when the browser supports
     *   SpeechRecognition.start(MediaStreamTrack).
     */
    start(track) {
      if (listening) return Promise.resolve();
      shouldRestart = true;
      audioTrack = track?.kind === "audio" ? track : null;

      return new Promise((resolve, reject) => {
        const onStart = () => {
          recognition.removeEventListener("start", onStart);
          recognition.removeEventListener("error", onError);
          resolve();
        };
        const onError = (event) => {
          recognition.removeEventListener("start", onStart);
          recognition.removeEventListener("error", onError);
          shouldRestart = false;
          reject(new Error(event.error ?? "Speech recognition failed to start"));
        };

        recognition.addEventListener("start", onStart);
        recognition.addEventListener("error", onError);

        try {
          beginRecognition();
        } catch (err) {
          recognition.removeEventListener("start", onStart);
          recognition.removeEventListener("error", onError);
          shouldRestart = false;
          reject(err);
        }
      });
    },

    stop() {
      shouldRestart = false;
      listening = false;
      audioTrack = null;
      recognition.stop();
      emitStatus("idle");
    },

    destroy() {
      shouldRestart = false;
      listening = false;
      audioTrack = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.onstart = null;
      recognition.stop();
    },
  };
}
