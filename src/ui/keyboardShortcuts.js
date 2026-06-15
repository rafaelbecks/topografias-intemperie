function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function setupKeyboardShortcuts({
  toggleSensorActive,
  toggleWireframe,
  toggleParticles,
  onSceneSelect,
  sceneOrder = [],
  frontScene,
} = {}) {
  function onKeyDown(e) {
    if (e.repeat || isTypingTarget(e.target)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const index = Number.parseInt(e.key, 10);
    if (Number.isFinite(index)) {
      if (index === 0 && frontScene && onSceneSelect) {
        onSceneSelect(frontScene);
        return;
      }
      if (index >= 1 && index <= sceneOrder.length && onSceneSelect) {
        onSceneSelect(sceneOrder[index - 1]);
        return;
      }
    }

    if (e.code === "Space") {
      e.preventDefault();
      if (e.shiftKey) {
        toggleParticles?.();
      } else {
        toggleWireframe?.();
      }
      return;
    }

    if (e.code === "KeyX" && e.shiftKey) {
      if (!toggleSensorActive) return;
      e.preventDefault();
      toggleSensorActive();
    }
  }

  window.addEventListener("keydown", onKeyDown);

  return () => window.removeEventListener("keydown", onKeyDown);
}
