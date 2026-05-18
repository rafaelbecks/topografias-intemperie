import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { params } from "./config.js";

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
  let currentEnvMap = null;

  function loadEnvironment(path) {
    rgbeLoader.load(path, (hdr) => {
      const envMap = pmrem.fromEquirectangular(hdr).texture;

      scene.environment = envMap;
      scene.background = envMap;
      scene.backgroundBlurriness = params.bgBlur;
      scene.backgroundIntensity = 1;

      if (currentEnvMap) currentEnvMap.dispose();
      currentEnvMap = envMap;
      light.intensity = 0;
      ambient.intensity = 0;
      hdr.dispose();
    });
  }

  function clearEnvironment() {
    scene.environment = null;
    scene.background = new THREE.Color(0x111111);
    light.intensity = params.lightIntensity;
    ambient.intensity = params.ambient;
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
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
  };
}
