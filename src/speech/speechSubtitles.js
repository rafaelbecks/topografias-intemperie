const OVERLAY_ID = "speech-subtitles";

export function createSpeechSubtitles() {
  let overlay = null;
  let finalText = "";
  let interimText = "";

  function ensureOverlay() {
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.setAttribute("aria-live", "polite");
    overlay.setAttribute("aria-atomic", "true");
    overlay.hidden = true;
    document.body.appendChild(overlay);
    return overlay;
  }

  function render() {
    const el = ensureOverlay();
    const hasText = finalText || interimText;

    el.hidden = !hasText;
    el.innerHTML = "";

    if (finalText) {
      const finalEl = document.createElement("span");
      finalEl.className = "speech-subtitles__final";
      finalEl.textContent = finalText;
      el.appendChild(finalEl);
    }

    if (interimText) {
      const interimEl = document.createElement("span");
      interimEl.className = "speech-subtitles__interim";
      interimEl.textContent = interimText;
      el.appendChild(interimEl);
    }
  }

  return {
    setInterim(text) {
      interimText = text;
      render();
    },

    appendFinal(text) {
      if (!text.trim()) return;
      finalText = `${finalText}${text}`.trimStart();
      if (finalText && !finalText.endsWith(" ")) finalText += " ";
      interimText = "";
      render();
    },

    clear() {
      finalText = "";
      interimText = "";
      render();
    },

    destroy() {
      overlay?.remove();
      overlay = null;
      finalText = "";
      interimText = "";
    },
  };
}
