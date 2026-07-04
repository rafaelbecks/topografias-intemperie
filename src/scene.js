import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { params } from "./config.js";
import { deferDispose } from "./env/deferredDispose.js";

export function createSceneSystem() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

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
  let currentEquirect = null;

  function buildEnvMapFromEquirect(texture) {
    return pmrem.fromEquirectangular(texture).texture;
  }

  const pmremJobs = [];
  let pmremFrameScheduled = false;

  function schedulePmremWork(fn) {
    return new Promise((resolve, reject) => {
      pmremJobs.push(() => {
        try {
          resolve(fn());
        } catch (err) {
          reject(err);
        }
      });
      if (!pmremFrameScheduled) {
        pmremFrameScheduled = true;
        requestAnimationFrame(runPmremJobs);
      }
    });
  }

  function runPmremJobs() {
    pmremFrameScheduled = false;
    const job = pmremJobs.shift();
    if (job) job();
    if (pmremJobs.length > 0) {
      pmremFrameScheduled = true;
      requestAnimationFrame(runPmremJobs);
    }
  }

  function applyEnvironmentMaps(envMap, equirect, { disposePrevious = true } = {}) {
    scene.environment = envMap;
    scene.background = envMap;
    scene.backgroundBlurriness = params.bgBlur;
    scene.backgroundIntensity = 1;

    if (disposePrevious) {
      if (currentEnvMap && currentEnvMap !== envMap) deferDispose(currentEnvMap);
      if (currentEquirect && currentEquirect !== equirect) deferDispose(currentEquirect);
    }

    currentEnvMap = envMap;
    currentEquirect = equirect;
    light.intensity = 0;
    ambient.intensity = 0;
  }

  function applyEnvironmentTexture(texture) {
    const envMap = buildEnvMapFromEquirect(texture);
    applyEnvironmentMaps(envMap, texture);
  }

  function applyPreparedEnvironment({ equirect, envMap }) {
    applyEnvironmentMaps(envMap, equirect);
  }

  function loadEnvironmentTexture(path, format = "hdr") {
    if (!path) return Promise.resolve(null);

    const loader = format === "exr" ? exrLoader : rgbeLoader;
    return new Promise((resolve, reject) => {
      loader.load(path, resolve, undefined, reject);
    });
  }

  function prepareEnvironmentFromPath(path, format = "hdr") {
    return loadEnvironmentTexture(path, format).then((equirect) => {
      if (!equirect) return null;
      return schedulePmremWork(() => ({
        equirect,
        envMap: buildEnvMapFromEquirect(equirect),
      }));
    });
  }

  let envLoadId = 0;

  function loadEnvironment(path, format = "hdr") {
    if (!path) return Promise.resolve();

    const id = ++envLoadId;

    return loadEnvironmentTexture(path, format)
      .then((texture) => {
        if (id !== envLoadId) return null;
        if (texture) applyEnvironmentTexture(texture);
        return texture;
      })
      .catch((err) => {
        console.error(err);
        throw err;
      });
  }

  function clearEnvironment() {
    scene.environment = null;
    scene.background = new THREE.Color(0x111111);
    if (currentEnvMap) {
      deferDispose(currentEnvMap);
      currentEnvMap = null;
    }
    if (currentEquirect) {
      deferDispose(currentEquirect);
      currentEquirect = null;
    }
    light.intensity = params.lightIntensity;
    ambient.intensity = params.ambient;
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
    loadEnvironmentTexture,
    prepareEnvironmentFromPath,
    applyPreparedEnvironment,
    clearEnvironment,
    setViewportSize(fn) {
      setViewportSize = fn;
    },
  };
}
