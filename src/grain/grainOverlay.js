import { grainParams } from "./grainParams.js";

const OVERLAY_ID = "grain-overlay";

/**
 * Full-screen film grain via [grained.js](https://github.com/sarathsaleem/grained).
 * Overlay sits above the canvas; pointer-events stay off the scene.
 */
export function createGrainOverlay() {
  let el = null;

  function ensureElement() {
    if (el) return el;
    el = document.createElement("div");
    el.id = OVERLAY_ID;
    el.setAttribute("aria-hidden", "true");
    el.style.cssText =
      `position: absolute;
    inset: 0px;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    display: block;
    overflow: hidden;`;
    document.body.appendChild(el);
    return el;
  }

  function sync() {
    const host = ensureElement();

    if (!grainParams.enabled) {
      host.style.display = "none";
      return;
    }

    if (typeof window.grained !== "function") {
      console.warn("[grain] grained.js not loaded — add lib/grained.js to index.html");
      host.style.display = "none";
      return;
    }

    host.style.display = "block";

    window.grained(host, {
      animate: grainParams.animate,
      patternWidth: grainParams.patternWidth,
      patternHeight: grainParams.patternHeight,
      grainOpacity: grainParams.grainOpacity,
      grainDensity: grainParams.grainDensity,
      grainWidth: grainParams.grainWidth,
      grainHeight: grainParams.grainHeight,
      grainChaos: grainParams.grainChaos,
      grainSpeed: grainParams.grainSpeed,
    });
  }

  return { sync };
}
