import { ditherParams } from "./ditherParams.js";
import { sliderToTableValues } from "./ditherTableValues.js";

const OVERLAY_ID = "dither-overlay";

/**
 * Full-screen ordered dither via SVG filter (same approach as glow).
 * Copies the WebGL canvas each frame; overlay sits above the scene.
 */
export function createDitherOverlay(renderer) {
  let overlay = null;
  let canvas = null;
  let ctx = null;

  function ensureElements() {
    if (overlay) return;

    overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);

    canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    overlay.appendChild(canvas);
    ctx = canvas.getContext("2d");

    resizeCanvas();
    updateDitherImageSize();
    window.addEventListener("resize", onResize);
  }

  function onResize() {
    resizeCanvas();
    updateDitherImageSize();
  }

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function updateDitherImageSize() {
    const ditherImages = document.querySelectorAll(".ditherImage");
    if (!ditherImages.length) return;

    const size = 8 / window.devicePixelRatio;
    for (const img of ditherImages) {
      img.setAttribute("width", size);
      img.setAttribute("height", size);
    }
  }

  function updateSaturate(value) {
    const filter = document.getElementById("ditherFilter");
    const colorMatrix = filter?.querySelector('feColorMatrix[type="saturate"]');
    colorMatrix?.setAttribute("values", value);
  }

  function updateTableValues(channel, sliderValue) {
    const filter = document.getElementById("ditherFilter");
    const componentTransfer = filter?.querySelector("feComponentTransfer");
    if (!componentTransfer) return;

    const tableValueString = sliderToTableValues(sliderValue);
    const selector =
      channel === "R" ? "feFuncR" : channel === "G" ? "feFuncG" : "feFuncB";
    componentTransfer.querySelector(selector)?.setAttribute("tableValues", tableValueString);
  }

  function syncFilter() {
    updateSaturate(ditherParams.saturate);
    updateTableValues("R", ditherParams.tableValuesR);
    updateTableValues("G", ditherParams.tableValuesG);
    updateTableValues("B", ditherParams.tableValuesB);
  }

  function sync() {
    ensureElements();
    overlay.style.display = ditherParams.enabled ? "block" : "none";
    if (ditherParams.enabled) {
      syncFilter();
    }
  }

  function update() {
    if (!ditherParams.enabled || !ctx || !renderer) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(renderer.domElement, 0, 0, canvas.width, canvas.height);
  }

  return { sync, update };
}
