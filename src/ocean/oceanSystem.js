import * as THREE from "three";
import { Water } from "three/addons/objects/Water.js";
import { oceanParams } from "./oceanParams.js";
import {
  applyEnvelopeNoiseDeform,
  captureEnvelopeBaseGeometry,
} from "./envelopeNoiseDeform.js";
import { exportEnvelopeModel } from "./envelopeExport.js";
import {
  createOceanGeometry,
  DEFORMABLE_ENVELOPE_SHAPES,
  ENVELOPE_SHAPES,
  FLAT_SHAPES,
  getEnvelopeBoundsRadius,
  getOceanExtent,
} from "./oceanGeometries.js";

const WATER_NORMALS_URL = "./textures/waternormals.jpg";

function getWaterSide() {
  // Flat shapes like plane / noise should be visible from above and
  // below so that exploring from underneath still shows the surface.
  if (!ENVELOPE_SHAPES.has(oceanParams.shape)) {
    if (oceanParams.shape === "plane" || oceanParams.shape === "noise") {
      return THREE.DoubleSide;
    }
    return THREE.FrontSide;
  }
  switch (oceanParams.envelopeSide) {
    case "inside":
      return THREE.BackSide;
    case "double":
      return THREE.DoubleSide;
    default:
      return THREE.FrontSide;
  }
}

function geometryConfigKey(extent) {
  return [
    oceanParams.shape,
    extent.toFixed(2),
    oceanParams.shapeSegments,
    oceanParams.ovalRatio,
    oceanParams.noiseAmplitude,
    oceanParams.noiseScale,
    oceanParams.noiseSeed,
    oceanParams.envelopeRadius,
    oceanParams.torusTube,
    oceanParams.torusKnotRadius,
    oceanParams.torusKnotTube,
    oceanParams.torusKnotTubularSegments,
    oceanParams.torusKnotRadialSegments,
    oceanParams.torusKnotP,
    oceanParams.torusKnotQ,
    oceanParams.envelopeSide,
  ].join("|");
}

/**
 * Reflective animated water (Three.js Water addon) — flat surfaces or experimental envelopes.
 */
export function createOceanSystem({ scene, getModelBounds }) {
  let water = null;
  let waterNormals = null;
  let builtGeometryKey = null;
  let torusNoiseMix = 0;
  const sun = new THREE.Vector3();

  function loadWaterNormals() {
    if (waterNormals) return waterNormals;
    waterNormals = new THREE.TextureLoader().load(WATER_NORMALS_URL, (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    });
    return waterNormals;
  }

  function createWaterMesh(geometry) {
    return new Water(geometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: loadWaterNormals(),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: oceanParams.distortionScale,
      side: getWaterSide(),
      fog: false,
    });
  }

  function updateSunDirection() {
    if (!water) return;
    const phi = THREE.MathUtils.degToRad(90 - oceanParams.sunElevation);
    const theta = THREE.MathUtils.degToRad(oceanParams.sunAzimuth);
    sun.setFromSphericalCoords(1, phi, theta);
    water.material.uniforms.sunDirection.value.copy(sun).normalize();
  }

  function applyUniforms() {
    if (!water) return;
    const uniforms = water.material.uniforms;
    uniforms.waterColor.value.set(oceanParams.waterColor);
    uniforms.sunColor.value.set(oceanParams.sunColor);
    uniforms.distortionScale.value = oceanParams.distortionScale;
    uniforms.size.value = oceanParams.waveSize;
    uniforms.alpha.value = oceanParams.alpha;
    updateSunDirection();
  }

  function getLayoutExtent(bounds) {
    if (ENVELOPE_SHAPES.has(oceanParams.shape)) {
      return getEnvelopeBoundsRadius(bounds) * 2;
    }
    return getOceanExtent(bounds, oceanParams.sizeScale);
  }

  function updateTransform() {
    if (!water) return;

    const bounds = getModelBounds?.();
    const center = bounds?.center ?? new THREE.Vector3();

    if (FLAT_SHAPES.has(oceanParams.shape)) {
      water.rotation.set(-Math.PI / 2, 0, 0);
      water.position.set(center.x, oceanParams.height, center.z);
      water.scale.set(1, 1, 1);
    } else {
      water.rotation.set(
        oceanParams.envelopeRotationX,
        oceanParams.envelopeRotationY,
        oceanParams.envelopeRotationZ
      );
      water.position.copy(center);
      water.scale.set(1, 1, 1);
    }
  }

  function rebuildGeometry(force = false) {
    const bounds = getModelBounds?.();
    const extent = getLayoutExtent(bounds);
    const key = geometryConfigKey(extent);

    if (!force && water && builtGeometryKey === key) return;

    const geometry = createOceanGeometry(oceanParams.shape, extent, oceanParams);
    const side = getWaterSide();

    if (water) {
      water.geometry.dispose();
      water.geometry = geometry;
      water.material.side = side;
      water.material.needsUpdate = true;
    } else {
      water = createWaterMesh(geometry);
      water.renderOrder = -1;
      scene.add(water);
    }

    if (DEFORMABLE_ENVELOPE_SHAPES.has(oceanParams.shape)) {
      captureEnvelopeBaseGeometry(water.geometry);
      applyEnvelopeNoiseDeform(water.geometry, oceanParams, torusNoiseMix);
    }

    builtGeometryKey = key;
    updateTransform();
  }

  function disposeWater() {
    if (!water) return;
    scene.remove(water);
    water.geometry.dispose();
    water.material.dispose();
    water = null;
    builtGeometryKey = null;
  }

  function sync() {
    if (!oceanParams.enabled) {
      disposeWater();
      return;
    }

    rebuildGeometry();
    applyUniforms();
    updateTransform();
    water.visible = true;
  }

  function bindModel() {
    rebuildGeometry(true);
    updateTransform();
  }

  function updateEnvelopeNoise(delta) {
    if (!water || !DEFORMABLE_ENVELOPE_SHAPES.has(oceanParams.shape)) return;

    if (!water.geometry.userData.oceanBasePosition) {
      captureEnvelopeBaseGeometry(water.geometry);
    }

    const target = oceanParams.torusNoiseEnabled ? 1 : 0;
    torusNoiseMix = THREE.MathUtils.damp(
      torusNoiseMix,
      target,
      oceanParams.torusNoiseMorphSpeed,
      delta
    );

    applyEnvelopeNoiseDeform(water.geometry, oceanParams, torusNoiseMix);
  }

  function snapTorusNoiseMix(value) {
    torusNoiseMix = value;
    if (!water || !DEFORMABLE_ENVELOPE_SHAPES.has(oceanParams.shape)) return;
    if (!water.geometry.userData.oceanBasePosition) {
      captureEnvelopeBaseGeometry(water.geometry);
    }
    applyEnvelopeNoiseDeform(water.geometry, oceanParams, torusNoiseMix);
  }

  function update(delta) {
    if (!water || !oceanParams.enabled) return;
    water.material.uniforms.time.value += delta;
    updateEnvelopeNoise(delta);
  }

  async function exportEnvelope() {
    if (!water || !oceanParams.enabled) {
      return { ok: false, reason: "Enable the ocean envelope first." };
    }
    if (!DEFORMABLE_ENVELOPE_SHAPES.has(oceanParams.shape)) {
      return { ok: false, reason: "Switch to torus or torus knot shape first." };
    }

    const bounds = getModelBounds?.();
    const extent = getLayoutExtent(bounds);
    return exportEnvelopeModel({ mesh: water, extent, noiseMix: torusNoiseMix });
  }

  return { sync, bindModel, update, snapTorusNoiseMix, exportEnvelope };
}
