import { frontPageConfig } from "./frontPageConfig.js";
import { sineLfo } from "./lfo.js";
import { SCENE_ORDER } from "../scenes.js";

export function createFrontPage({ onSceneSelect }) {
  const { typography, lfo, rotationLfo, background, subtitle } = frontPageConfig;

  document.body.classList.add("front-page");
  applyBackground(document.body, background);

  const root = document.createElement("main");
  root.id = "front-page";

  const heading = document.createElement("div");
  heading.className = "front-heading";

  const title = document.createElement("div");
  title.className = "front-title";
  title.setAttribute("aria-label", typography.lines.join(""));

  title.style.setProperty("--front-font-size", `${typography.fontSize}px`);
  title.style.setProperty("--front-letter-spacing", `${typography.letterSpacing}em`);
  title.style.setProperty("--front-stroke-width", `${typography.strokeWidth}px`);
  title.style.setProperty("--front-stroke-color", typography.strokeColor);

  for (const line of typography.lines) {
    const span = document.createElement("span");
    span.className = "front-title__line";
    span.textContent = line;
    span.setAttribute("aria-hidden", "true");
    title.appendChild(span);
  }

  heading.appendChild(title);
  root.appendChild(heading);
  document.body.appendChild(root);

  const start = performance.now();
  let rafId;

  function tick(now) {
    const elapsed = (now - start) / 1000;
    const lineHeight = sineLfo(elapsed, lfo.rate, lfo.min, lfo.max);
    title.style.lineHeight = `${lineHeight}px`;
    // const rotateX = sineLfo(elapsed, rotationLfo.rate, rotationLfo.min, rotationLfo.max);
    heading.style.transform = `scale(0.45) rotateY(0deg)`;
    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  function onKeyDown(e) {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;

    const index = Number.parseInt(e.key, 10);
    if (!Number.isFinite(index) || index < 1 || index > SCENE_ORDER.length) return;

    onSceneSelect(SCENE_ORDER[index - 1]);
  }

  window.addEventListener("keydown", onKeyDown);

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
      clearBackground(document.body);
      document.body.classList.remove("front-page");
      root.remove();
    },
  };
}

function applyBackground(el, background) {
  if (!background?.image) return;
  el.style.backgroundImage = `url("${background.image}")`;
  el.style.backgroundSize = background.size ?? "cover";
  el.style.backgroundPosition = background.position ?? "center";
  el.style.backgroundRepeat = background.repeat ?? "no-repeat";
}

function clearBackground(el) {
  el.style.backgroundImage = "";
  el.style.backgroundSize = "";
  el.style.backgroundPosition = "";
  el.style.backgroundRepeat = "";
}
