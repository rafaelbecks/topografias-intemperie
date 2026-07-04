import { getEnvPath, getEnvironments, params } from "../config.js";
import { createEnvPreloadQueue } from "./envPreloadQueue.js";
import { clampEnvCycleParams, envCycleParams } from "./envCycleParams.js";

export function createEnvCycle({
  prepareEnvironmentFromPath,
  applyPreparedEnvironment,
  onEnvironmentChange,
}) {
  let isFrontScene = false;
  let elapsed = 0;
  let currentIndex = 0;

  const queue = createEnvPreloadQueue({
    prepareEnvironmentFromPath,
    getEnvIds: () => Object.keys(getEnvironments(params.envFormat)),
    getEnvPath,
    getFormat: () => params.envFormat,
  });

  function envIds() {
    return Object.keys(getEnvironments(params.envFormat));
  }

  function syncIndexFromParams() {
    const ids = envIds();
    const idx = ids.indexOf(params.environment);
    currentIndex = idx >= 0 ? idx : 0;
  }

  function peekNextEnvId() {
    const ids = envIds();
    if (ids.length === 0) return null;
    return ids[(currentIndex + 1) % ids.length];
  }

  function advanceIndex() {
    const ids = envIds();
    currentIndex = (currentIndex + 1) % ids.length;
    return ids[currentIndex];
  }

  function fillQueue() {
    queue.maintainQueue(currentIndex, envCycleParams.lookahead);
  }

  function setFrontScene(front) {
    isFrontScene = front;
    if (!front) {
      stop();
      return;
    }
    if (envCycleParams.enabled) resume();
  }

  function resume() {
    if (!isFrontScene || !envCycleParams.enabled) return;
    clampEnvCycleParams();
    syncIndexFromParams();
    elapsed = 0;
    fillQueue();
  }

  function stop() {
    elapsed = 0;
    queue.cancelAll();
  }

  function swapToNext() {
    const nextId = peekNextEnvId();
    if (!nextId) return false;

    const entry = queue.take(nextId);
    if (!entry) return false;

    applyPreparedEnvironment(entry);
    advanceIndex();
    params.environment = nextId;
    onEnvironmentChange?.(nextId);
    elapsed = 0;
    requestAnimationFrame(() => fillQueue());
    return true;
  }

  function update(delta) {
    if (!isFrontScene || !envCycleParams.enabled) return;

    clampEnvCycleParams();
    const ids = envIds();
    if (ids.length < 2) return;

    fillQueue();

    elapsed += delta;

    if (elapsed >= envCycleParams.intervalSec) {
      if (swapToNext()) return;

      const nextId = peekNextEnvId();
      queue.ensureLoaded(nextId).then((entry) => {
        if (entry && elapsed >= envCycleParams.intervalSec) swapToNext();
      });
    }
  }

  return { setFrontScene, resume, stop, update, fillQueue };
}
