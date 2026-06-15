import { AnaglyphEffect } from "./anaglyphEffect.js";
import { ParallaxBarrierEffect } from "./parallaxBarrierEffect.js";
import { stereoParams } from "./stereoParams.js";

/**
 * Routes scene rendering through Three.js stereo effects when enabled.
 */
export function createStereoEffects(renderer) {
  const width = window.innerWidth || 2;
  const height = window.innerHeight || 2;

  const anaglyph = new AnaglyphEffect(renderer, width, height);
  const parallaxBarrier = new ParallaxBarrierEffect(renderer);
  parallaxBarrier.setSize(width, height);

  function getActiveEffect() {
    if (stereoParams.anaglyphEnabled) return anaglyph;
    if (stereoParams.parallaxBarrierEnabled) return parallaxBarrier;
    return null;
  }

  function sync() {
    if (stereoParams.anaglyphEnabled && stereoParams.parallaxBarrierEnabled) {
      stereoParams.parallaxBarrierEnabled = false;
    }

    applyParams();
  }

  function applyParams() {
    for (const effect of [anaglyph, parallaxBarrier]) {
      effect.stereo.eyeSep = stereoParams.eyeSep;
    }
  }

  function setSize(nextWidth, nextHeight) {
    const active = getActiveEffect();
    if (active) {
      active.setSize(nextWidth, nextHeight);
      return;
    }
    renderer.setSize(nextWidth, nextHeight);
  }

  function render(scene, camera) {
    const savedFocus = camera.focus;
    camera.focus = stereoParams.planeDistance;

    const active = getActiveEffect();
    if (active) {
      active.render(scene, camera);
    } else {
      renderer.render(scene, camera);
    }

    camera.focus = savedFocus;
  }

  applyParams();

  return {
    anaglyph,
    parallaxBarrier,
    sync,
    setSize,
    render,
    applyParams,
    getActiveEffect,
    isActive: () => getActiveEffect() !== null,
  };
}
