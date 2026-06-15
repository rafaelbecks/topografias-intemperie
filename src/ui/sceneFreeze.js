/**
 * Holds the last rendered frame on screen while a new scene loads.
 */
export function createSceneFreeze(renderer, { canCapture = () => true } = {}) {
  let overlay = null;

  function capture() {
    if (!canCapture() || overlay) return;

    const source = renderer.domElement;
    if (!source.width || !source.height) return;

    overlay = document.createElement("canvas");
    overlay.className = "scene-freeze";
    overlay.width = source.width;
    overlay.height = source.height;
    overlay.getContext("2d").drawImage(source, 0, 0);
    document.body.appendChild(overlay);
  }

  function release() {
    if (!overlay) return Promise.resolve();

    return new Promise((resolve) => {
      // Wait for a couple of frames plus a short delay so the new scene
      // has time to render fully before revealing it. This hides the
      // single-frame blink of an incomplete scene.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            overlay?.remove();
            overlay = null;
            resolve();
          }, 120);
        });
      });
    });
  }

  return {
    capture,
    release,
    isActive: () => !!overlay,
  };
}
