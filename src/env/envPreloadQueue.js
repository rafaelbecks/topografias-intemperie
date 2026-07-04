/**
 * Silent background cache for upcoming environment maps.
 * Keeps equirect textures + PMREM cubemaps ready so cycle transitions never hit the loader UI.
 */
import { deferDispose } from "./deferredDispose.js";

export function createEnvPreloadQueue({
  prepareEnvironmentFromPath,
  getEnvIds,
  getEnvPath,
  getFormat,
}) {
  /** @type {Map<string, { equirect: import("three").Texture, envMap: import("three").Texture }>} */
  const ready = new Map();
  /** @type {Map<string, Promise<{ equirect: import("three").Texture, envMap: import("three").Texture } | null>>} */
  const loading = new Map();
  let generation = 0;

  function disposeEntry(envId) {
    const entry = ready.get(envId);
    if (!entry) return;
    deferDispose(entry.envMap, entry.equirect);
    ready.delete(envId);
  }

  function cancelAll() {
    generation++;
    for (const envId of [...ready.keys()]) disposeEntry(envId);
    loading.clear();
  }

  function idsAhead(fromIndex, count) {
    const ids = getEnvIds();
    if (ids.length === 0) return [];

    const out = [];
    for (let i = 1; i <= count; i++) {
      out.push(ids[(fromIndex + i) % ids.length]);
    }
    return out;
  }

  function trimTo(keepIds) {
    const keep = new Set(keepIds);
    for (const envId of ready.keys()) {
      if (!keep.has(envId)) disposeEntry(envId);
    }
  }

  function ensureLoaded(envId, gen = generation) {
    if (ready.has(envId)) return Promise.resolve(ready.get(envId));
    if (loading.has(envId)) return loading.get(envId);

    const path = getEnvPath(envId, getFormat());
    if (!path) return Promise.resolve(null);

    const promise = prepareEnvironmentFromPath(path, getFormat())
      .then((entry) => {
        loading.delete(envId);
        if (gen !== generation) {
          deferDispose(entry?.envMap, entry?.equirect);
          return null;
        }
        if (!entry) return null;
        ready.set(envId, entry);
        return entry;
      })
      .catch((err) => {
        loading.delete(envId);
        console.error(`Env preload failed (${envId}):`, err);
        return null;
      });

    loading.set(envId, promise);
    return promise;
  }

  /**
   * Keep the next `lookahead` environments cached; drop anything outside the window.
   */
  function maintainQueue(currentIndex, lookahead) {
    const ids = getEnvIds();
    if (ids.length < 2 || lookahead < 1) return;

    const ahead = idsAhead(currentIndex, lookahead);
    const keep = [ids[currentIndex], ...ahead];
    trimTo(keep);

    for (const envId of ahead) {
      if (ready.has(envId) || loading.has(envId)) continue;
      ensureLoaded(envId);
    }
  }

  function getReady(envId) {
    return ready.get(envId) ?? null;
  }

  /** Remove from cache without disposing — caller owns the assets. */
  function take(envId) {
    const entry = ready.get(envId);
    if (!entry) return null;
    ready.delete(envId);
    return entry;
  }

  return { maintainQueue, getReady, take, ensureLoaded, cancelAll };
}
