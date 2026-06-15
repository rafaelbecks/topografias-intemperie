function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function setupKeyboardShortcuts({ audioSystem, toggleSensorActive } = {}) {
  function onKeyDown(e) {
    if (e.repeat || isTypingTarget(e.target)) return;

    if (e.code === "Space") {
      if (!audioSystem) return;
      e.preventDefault();
      if (audioSystem.isPlaying()) {
        audioSystem.stop();
      } else {
        audioSystem.play().catch(console.error);
      }
      return;
    }

    if (e.code === "KeyS" && e.shiftKey) {
      if (!toggleSensorActive) return;
      e.preventDefault();
      toggleSensorActive();
    }
  }

  window.addEventListener("keydown", onKeyDown);

  return () => window.removeEventListener("keydown", onKeyDown);
}
