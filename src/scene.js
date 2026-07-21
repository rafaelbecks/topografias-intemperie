import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { params } from "./config.js";

const FALLBACK_BG = 0x111111;
/** Rebuild PMREM from the live webcam at this rate (palette lighting, not sharp sky). */
const WEBCAM_PMREM_INTERVAL_MS = 1000 / 12;

export function createSceneSystem({ loading } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(FALLBACK_BG);

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 240, 120);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.physicallyCorrectLights = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = params.exposure;
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = params.autoRotate;
  controls.autoRotateSpeed = params.rotateSpeed;

  controls.addEventListener("start", () => {
    controls.autoRotate = false;
  });

  controls.addEventListener("end", () => {
    if (params.autoRotate) controls.autoRotate = true;
  });

  const light = new THREE.DirectionalLight(0xffffff, 0);
  light.position.set(50, 100, 50);
  scene.add(light);

  const ambient = new THREE.AmbientLight(0xffffff, 0);
  scene.add(ambient);

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const rgbeLoader = new RGBELoader();
  const exrLoader = new EXRLoader();
  let currentEnvMap = null;

  let webcamStream = null;
  let videoEl = null;
  let videoTexture = null;
  let webcamActive = false;
  let lastWebcamPmremMs = 0;
  let webcamStartId = 0;

  function disposeCurrentEnvMap() {
    if (currentEnvMap) {
      currentEnvMap.dispose();
      currentEnvMap = null;
    }
  }

  function applyEnvMap(envMap, { asBackground }) {
    const prev = currentEnvMap;
    scene.environment = envMap;
    if (asBackground) {
      scene.background = envMap;
      scene.backgroundBlurriness = params.bgBlur;
      scene.backgroundIntensity = 1;
    } else if (scene.background === prev) {
      scene.background = new THREE.Color(FALLBACK_BG);
      scene.backgroundBlurriness = 0;
    }
    if (prev && prev !== envMap) prev.dispose();
    currentEnvMap = envMap;
    light.intensity = 0;
    ambient.intensity = 0;
  }

  function applyEnvironmentTexture(texture) {
    const envMap = pmrem.fromEquirectangular(texture).texture;
    applyEnvMap(envMap, { asBackground: true });
    texture.dispose();
  }

  let envLoadId = 0;

  function loadEnvironment(path, format = "hdr", { silent = false } = {}) {
    if (!path) return Promise.resolve();

    stopWebcamEnvironment({ resetParam: true });

    const id = ++envLoadId;
    const loader = format === "exr" ? exrLoader : rgbeLoader;

    return new Promise((resolve, reject) => {
      if (!silent) loading?.begin("environment");

      loader.load(
        path,
        (texture) => {
          if (id !== envLoadId) {
            if (!silent) loading?.end("environment");
            resolve(null);
            return;
          }
          applyEnvironmentTexture(texture);
          if (!silent) loading?.end("environment");
          resolve(texture);
        },
        (xhr) => {
          if (!silent && xhr.total) {
            loading?.setProgress(xhr.loaded / xhr.total);
          }
        },
        (err) => {
          if (id === envLoadId && !silent) loading?.end("environment");
          console.error(err);
          reject(err);
        }
      );
    });
  }

  function clearEnvironment() {
    stopWebcamEnvironment({ resetParam: true });
    disposeCurrentEnvMap();
    scene.environment = null;
    scene.background = new THREE.Color(FALLBACK_BG);
    light.intensity = params.lightIntensity;
    ambient.intensity = params.ambient;
  }

  function bakeWebcamEnvironment() {
    if (!webcamActive || !videoTexture || !videoEl) return false;
    if (videoEl.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return false;

    // PMREM uses texture.image.width; <video>.width is often 0 unless set explicitly.
    const w = videoEl.videoWidth;
    const h = videoEl.videoHeight;
    if (!w || !h) return false;
    videoEl.width = w;
    videoEl.height = h;

    const envMap = pmrem.fromEquirectangular(videoTexture).texture;
    applyEnvMap(envMap, { asBackground: params.webcamAsBackground });
    return true;
  }

  function setWebcamAsBackground(enabled) {
    params.webcamAsBackground = enabled;
    if (!webcamActive || !currentEnvMap) return;

    if (enabled) {
      scene.background = currentEnvMap;
      scene.backgroundBlurriness = params.bgBlur;
      scene.backgroundIntensity = 1;
    } else {
      scene.background = new THREE.Color(FALLBACK_BG);
      scene.backgroundBlurriness = 0;
    }
  }

  function releaseWebcamMedia() {
    if (webcamStream) {
      for (const track of webcamStream.getTracks()) track.stop();
      webcamStream = null;
    }
    if (videoTexture) {
      videoTexture.dispose();
      videoTexture = null;
    }
    if (videoEl) {
      videoEl.pause();
      videoEl.srcObject = null;
      videoEl = null;
    }
  }

  function stopWebcamEnvironment({ resetParam = false } = {}) {
    webcamStartId += 1;
    webcamActive = false;
    lastWebcamPmremMs = 0;
    releaseWebcamMedia();
    if (resetParam) params.webcamEnv = false;
  }

  async function startWebcamEnvironment() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera access is not available in this browser.");
    }

    // Invalidate in-flight file loads and any previous webcam start.
    envLoadId += 1;
    stopWebcamEnvironment({ resetParam: false });
    const id = ++webcamStartId;
    params.webcamEnv = true;

    const videoConstraint = params.webcamDeviceId
      ? { deviceId: { exact: params.webcamDeviceId } }
      : true;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraint,
      audio: false,
    });

    if (id !== webcamStartId) {
      for (const track of stream.getTracks()) track.stop();
      return;
    }

    const activeTrack = stream.getVideoTracks()[0];
    const actualDeviceId = activeTrack?.getSettings?.().deviceId ?? "";
    if (actualDeviceId) params.webcamDeviceId = actualDeviceId;

    const video = document.createElement("video");
    video.playsInline = true;
    video.muted = true;
    video.autoplay = true;
    video.srcObject = stream;

    try {
      await video.play();
    } catch (err) {
      for (const track of stream.getTracks()) track.stop();
      params.webcamEnv = false;
      throw err;
    }

    if (id !== webcamStartId) {
      for (const track of stream.getTracks()) track.stop();
      video.srcObject = null;
      return;
    }

    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    webcamStream = stream;
    videoEl = video;
    videoTexture = texture;
    webcamActive = true;
    lastWebcamPmremMs = 0;
    try {
      bakeWebcamEnvironment();
    } catch (err) {
      stopWebcamEnvironment({ resetParam: true });
      throw err;
    }
  }

  function updateWebcamEnvironment(elapsedMs) {
    if (!webcamActive) return;
    if (elapsedMs - lastWebcamPmremMs < WEBCAM_PMREM_INTERVAL_MS) return;
    lastWebcamPmremMs = elapsedMs;
    try {
      bakeWebcamEnvironment();
    } catch (err) {
      console.error("Webcam PMREM bake failed:", err);
    }
  }

  function isWebcamEnvironmentActive() {
    return webcamActive;
  }

  let setViewportSize = (width, height) => renderer.setSize(width, height);

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    setViewportSize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener("resize", onResize);

  return {
    scene,
    camera,
    renderer,
    controls,
    light,
    ambient,
    loadEnvironment,
    clearEnvironment,
    startWebcamEnvironment,
    stopWebcamEnvironment,
    setWebcamAsBackground,
    updateWebcamEnvironment,
    isWebcamEnvironmentActive,
    setViewportSize(fn) {
      setViewportSize = fn;
    },
  };
}
