const SpeechRecognitionCtor =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

/**
 * Thin wrapper around the Web Speech API for continuous recognition with interim results.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
 */
export function createSpeechRecognition(options = {}) {
  if (!SpeechRecognitionCtor) {
    return {
      supported: false,
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

  let listening = false;
  let shouldRestart = false;

  const callbacks = {
    onResult: options.onResult ?? (() => {}),
    onStatus: options.onStatus ?? (() => {}),
    onError: options.onError ?? (() => {}),
  };

  function emitStatus(status, detail) {
    callbacks.onStatus({ listening, status, detail });
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
        recognition.start();
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

    setLang(lang) {
      recognition.lang = lang;
    },

    start() {
      if (listening) return Promise.resolve();
      shouldRestart = true;

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
          recognition.start();
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
      recognition.stop();
      emitStatus("idle");
    },

    destroy() {
      shouldRestart = false;
      listening = false;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.onstart = null;
      recognition.stop();
    },
  };
}
