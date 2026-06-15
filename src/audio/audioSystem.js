import * as THREE from "three";
import { Howl, Howler } from "howler";
import { audioParams } from "./audioParams.js";
import {
  DEFAULT_ENV_SOUND,
  DEFAULT_OBJECT_SOUND,
  ENV_SOUNDS,
  OBJECT_SOUNDS,
  getEnvPath,
  getObjectPath,
} from "./audioSources.js";
import { unlockAudioFromUserGesture } from "./audioUnlock.js";

const BASE_REF_DISTANCE = 1;
const BASE_ROLLOFF = 1.5;
const LISTENER_FORWARD = new THREE.Vector3();

function clampSoundId(registry, id, fallback) {
  return registry[id] ? id : fallback;
}

function sensitivityToPanner(sensitivity) {
  const s = Math.max(0.1, sensitivity);
  return {
    panningModel: "HRTF",
    refDistance: BASE_REF_DISTANCE / s,
    rolloffFactor: BASE_ROLLOFF * s,
    distanceModel: "inverse",
  };
}

/**
 * Object sound with manual loop + crossfade at each repetition.
 */
function createFadeLoopPlayer({ src, volume, fadeMs, pannerAttr, onReady }) {
  let soundId = null;
  let playing = false;
  let targetVolume = volume;
  let fadeDuration = fadeMs;
  let panner = pannerAttr;

  const howl = new Howl({
    src: [src],
    preload: true,
    loop: false,
    volume: 1,
    onload: () => onReady?.(),
    onloaderror: (_id, err) => console.error("Object audio load error:", err),
    onplayerror: () => {
      howl.once("unlock", () => {
        if (playing) startPlayback();
      });
    },
    onend: () => {
      if (playing) startPlayback();
    },
  });

  function applyPanner(id) {
    if (panner) howl.pannerAttr(panner, id);
  }

  let pendingPos = [0, 0, 0];
  let fadeIn = true;

  function startPlayback() {
    soundId = howl.play();
    howl.pos(pendingPos[0], pendingPos[1], pendingPos[2], soundId);
    applyPanner(soundId);
    if (fadeIn) {
      howl.volume(0, soundId);
      howl.fade(0, targetVolume, fadeDuration, soundId);
    } else {
      howl.volume(targetVolume, soundId);
    }
    fadeIn = true;
  }

  function isActive() {
    return soundId != null && howl.playing(soundId);
  }

  return {
    howl,
    play({ fadeIn: useFadeIn = true } = {}) {
      if (isActive()) return;
      playing = true;
      fadeIn = useFadeIn;
      if (howl.state() === "loaded") startPlayback();
      else howl.once("load", startPlayback);
    },
    stop() {
      playing = false;
      howl.stop();
      soundId = null;
    },
    setVolume(v) {
      targetVolume = v;
      if (soundId != null) howl.volume(v, soundId);
    },
    isActive,
    setFadeMs(ms) {
      fadeDuration = ms;
    },
    setPannerAttr(attrs) {
      panner = attrs;
      if (soundId != null) applyPanner(soundId);
    },
    setPosition(x, y, z) {
      pendingPos = [x, y, z];
      if (soundId != null) howl.pos(x, y, z, soundId);
    },
    isPlaying: () => playing,
    unload() {
      playing = false;
      howl.unload();
    },
  };
}

export function createAudioSystem({ camera, loading }) {
  let model = null;
  let envHowl = null;
  let envSoundId = null;
  let objectPlayer = null;
  let loadedEnvId = null;
  let loadedObjectId = null;

  const modelPos = new THREE.Vector3();

  function updateListener() {
    const p = camera.position;
    Howler.pos(p.x, p.y, p.z);

    camera.getWorldDirection(LISTENER_FORWARD);
    Howler.orientation(
      LISTENER_FORWARD.x,
      LISTENER_FORWARD.y,
      LISTENER_FORWARD.z,
      camera.up.x,
      camera.up.y,
      camera.up.z
    );
  }

  function updateObjectPosition() {
    if (!objectPlayer) return;
    if (model) {
      model.getWorldPosition(modelPos);
      objectPlayer.setPosition(modelPos.x, modelPos.y, modelPos.z);
    } else {
      objectPlayer.setPosition(0, 0, 0);
    }
  }

  function disposeEnv() {
    if (envHowl) {
      envHowl.unload();
      envHowl = null;
      envSoundId = null;
      loadedEnvId = null;
    }
  }

  function disposeObject() {
    if (objectPlayer) {
      objectPlayer.unload();
      objectPlayer = null;
      loadedObjectId = null;
    }
  }

  function ensureEnvLoaded() {
    const id = clampSoundId(ENV_SOUNDS, audioParams.envSound, DEFAULT_ENV_SOUND);
    audioParams.envSound = id;
    if (loadedEnvId === id && envHowl) return Promise.resolve();

    disposeEnv();
    const src = getEnvPath(id);
    if (!src) return Promise.resolve();

    return new Promise((resolve) => {
      envHowl = new Howl({
        src: [src],
        loop: true,
        preload: true,
        html5: true,
        volume: 1,
        onload: () => resolve(),
        onloaderror: (_id, err) => {
          console.error("Env audio load error:", err);
          resolve();
        },
        onplayerror: () => {
          envHowl.once("unlock", () => {
            if (audioParams.playing) playEnv();
          });
        },
      });
      loadedEnvId = id;
    });
  }

  function ensureObjectLoaded() {
    const id = clampSoundId(OBJECT_SOUNDS, audioParams.objectSound, DEFAULT_OBJECT_SOUND);
    audioParams.objectSound = id;
    if (loadedObjectId === id && objectPlayer) return Promise.resolve();

    disposeObject();

    const src = getObjectPath(id);
    if (!src) return Promise.resolve();

    return new Promise((resolve) => {
      objectPlayer = createFadeLoopPlayer({
        src,
        volume: audioParams.objectVolume,
        fadeMs: audioParams.loopFadeMs,
        pannerAttr: sensitivityToPanner(audioParams.sensitivity),
        onReady: resolve,
      });
      loadedObjectId = id;
      updateObjectPosition();
    });
  }

  function applyEnvVolume() {
    if (!envHowl) return;
    // Env uses group volume only — avoids stacking with per-sound volume on load.
    envHowl.volume(audioParams.envVolume);
  }

  function playEnv() {
    if (!envHowl || !audioParams.playing) return;
    if (envHowl.state() !== "loaded") {
      envHowl.once("load", playEnv);
      return;
    }
    if (envHowl.playing()) {
      applyEnvVolume();
      return;
    }

    envSoundId = envHowl.play();
    applyEnvVolume();

    if (!envHowl.playing(envSoundId)) {
      envHowl.once("unlock", playEnv);
    }
  }

  function stopEnv() {
    envHowl?.stop();
    envSoundId = null;
  }

  async function loadSounds() {
    await loading?.run("audio", async () => {
      await Promise.all([ensureEnvLoaded(), ensureObjectLoaded()]);
    });
  }

  function applyObjectSettings() {
    objectPlayer?.setVolume(audioParams.objectVolume);
    objectPlayer?.setFadeMs(audioParams.loopFadeMs);
    objectPlayer?.setPannerAttr(sensitivityToPanner(audioParams.sensitivity));
    updateObjectPosition();
  }

  function isPlaybackActive() {
    const envActive = envHowl?.playing() ?? false;
    const objActive = objectPlayer?.isActive() ?? false;
    return envActive || objActive;
  }

  let gestureRetryBound = false;

  function bindPlaybackGestureRetry() {
    if (gestureRetryBound || !audioParams.playing || isPlaybackActive()) return;
    gestureRetryBound = true;

    const retry = () => {
      gestureRetryBound = false;
      if (!audioParams.playing || isPlaybackActive()) return;
      unlockAudioFromUserGesture();
      resumePlayback({ fadeIn: false });
    };

    document.addEventListener("pointerdown", retry, { once: true, capture: true });
    document.addEventListener("keydown", retry, { once: true, capture: true });
  }

  function resumePlayback({ fadeIn = false } = {}) {
    if (!audioParams.playing) return;
    updateListener();
    updateObjectPosition();
    playEnv();
    if (!objectPlayer?.isActive()) {
      objectPlayer?.play({ fadeIn });
    } else {
      applyObjectSettings();
    }

    if (!isPlaybackActive()) {
      bindPlaybackGestureRetry();
    }
  }

  return {
    bindModel(nextModel) {
      model = nextModel;
      updateObjectPosition();
    },

    async play({ fadeIn = true } = {}) {
      unlockAudioFromUserGesture();
      audioParams.playing = true;
      await loadSounds();
      resumePlayback({ fadeIn });
    },

    stop({ preserveIntent = false } = {}) {
      if (!preserveIntent) audioParams.playing = false;
      stopEnv();
      objectPlayer?.stop();
    },

    async sync({ resumeFadeIn = false } = {}) {
      const envId = clampSoundId(ENV_SOUNDS, audioParams.envSound, DEFAULT_ENV_SOUND);
      const objectId = clampSoundId(
        OBJECT_SOUNDS,
        audioParams.objectSound,
        DEFAULT_OBJECT_SOUND
      );
      audioParams.envSound = envId;
      audioParams.objectSound = objectId;

      const envChanged = loadedEnvId !== envId;
      const objectChanged = loadedObjectId !== objectId;
      if (envChanged || objectChanged) {
        this.stop({ preserveIntent: true });
        if (envChanged) disposeEnv();
        if (objectChanged) disposeObject();
        await loadSounds();
      } else if (audioParams.playing) {
        // Mirror play(): ensure buffers exist before resuming saved playback intent.
        await loadSounds();
      }

      applyEnvVolume();
      applyObjectSettings();

      if (audioParams.playing) {
        resumePlayback({ fadeIn: resumeFadeIn });
      }
    },

    update() {
      updateListener();
      updateObjectPosition();
    },

    dispose() {
      this.stop();
      disposeEnv();
      disposeObject();
      model = null;
    },

    isPlaying: () => audioParams.playing,
  };
}
