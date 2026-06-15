import * as THREE from "three";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import { clampParticleParams, particleParams } from "./particleParams.js";
import { getParticleTexture } from "./particleTexture.js";

const _position = new THREE.Vector3();
const _sampleColor = new THREE.Color();
const _tint = new THREE.Color();

function getMeshMaterials(mesh) {
  if (!mesh.material) return [];
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

function getMaterialColor(mesh) {
  const mats = getMeshMaterials(mesh);
  if (mats.length === 0) return new THREE.Color(0xffffff);
  return mats[0].color?.clone() ?? new THREE.Color(0xffffff);
}

function setMeshMaterialsVisible(mesh, visible) {
  for (const mat of getMeshMaterials(mesh)) {
    mat.visible = visible;
  }
}

function collectMeshes(root) {
  const meshes = [];
  root.traverse((obj) => {
    if (obj.isMesh && obj.geometry?.attributes?.position) meshes.push(obj);
  });
  return meshes;
}

function distributeCounts(total, meshes) {
  const weights = meshes.map((mesh) => mesh.geometry.attributes.position.count);
  const weightSum = weights.reduce((sum, w) => sum + w, 0) || meshes.length;
  const counts = weights.map((w) => Math.floor((total * w) / weightSum));
  let assigned = counts.reduce((sum, n) => sum + n, 0);
  let i = 0;
  while (assigned < total) {
    counts[i % counts.length] += 1;
    assigned += 1;
    i += 1;
  }
  return counts;
}

function meshHasVertexColors(mesh) {
  return Boolean(mesh.geometry.getAttribute("color"));
}

/**
 * Sample mesh surfaces into point clouds parented per mesh (follows terrain layer animation).
 */
export function createParticleSystem() {
  let rootModel = null;
  let particleEntries = [];
  let modelSize = 1;
  let builtKey = null;

  function disposePoints() {
    for (const entry of particleEntries) {
      entry.mesh.remove(entry.points);
      entry.points.geometry.dispose();
      entry.points.material.dispose();
    }
    particleEntries = [];
    builtKey = null;
  }

  function restoreMeshVisibility() {
    if (!rootModel) return;
    rootModel.traverse((obj) => {
      if (!obj.isMesh) return;
      setMeshMaterialsVisible(obj, true);
    });
  }

  function buildKey() {
    clampParticleParams();
    return [particleParams.count, particleParams.useModelColors, rootModel?.uuid ?? "none"].join("|");
  }

  function sampleBaseColor(mesh, sampler, hasVertexColors) {
    sampler.sample(_position, undefined, hasVertexColors ? _sampleColor : undefined);
    if (particleParams.useModelColors) {
      return hasVertexColors ? _sampleColor.clone() : getMaterialColor(mesh);
    }
    return _tint.set(particleParams.color);
  }

  function updateCustomBaseColors() {
    if (particleParams.useModelColors) return;
    _tint.set(particleParams.color);
    for (const entry of particleEntries) {
      const { baseColors } = entry;
      for (let i = 0; i < baseColors.length; i += 3) {
        baseColors[i] = _tint.r;
        baseColors[i + 1] = _tint.g;
        baseColors[i + 2] = _tint.b;
      }
    }
  }

  function applyColorsToAttribute(baseColors, colorAttr) {
    const luminance = particleParams.luminance;
    for (let i = 0; i < colorAttr.count; i++) {
      const base = i * 3;
      colorAttr.setXYZ(
        i,
        baseColors[base] * luminance,
        baseColors[base + 1] * luminance,
        baseColors[base + 2] * luminance
      );
    }
    colorAttr.needsUpdate = true;
  }

  function buildParticles() {
    disposePoints();
    if (!rootModel) return;

    const meshes = collectMeshes(rootModel);
    if (meshes.length === 0) return;

    const box = new THREE.Box3().setFromObject(rootModel);
    const size = box.getSize(new THREE.Vector3());
    modelSize = Math.max(size.x, size.y, size.z, 0.001);

    const perMeshCounts = distributeCounts(particleParams.count, meshes);
    const alphaMap = getParticleTexture();
    const pointSize = modelSize * 0.0012 * particleParams.size;

    for (let meshIndex = 0; meshIndex < meshes.length; meshIndex++) {
      const mesh = meshes[meshIndex];
      const sampleCount = perMeshCounts[meshIndex];
      if (sampleCount <= 0) continue;

      const sampler = new MeshSurfaceSampler(mesh).build();
      const hasVertexColors = meshHasVertexColors(mesh);
      const positions = new Float32Array(sampleCount * 3);
      const baseColors = new Float32Array(sampleCount * 3);

      for (let i = 0; i < sampleCount; i++) {
        const color = sampleBaseColor(mesh, sampler, hasVertexColors);
        const base = i * 3;
        positions[base] = _position.x;
        positions[base + 1] = _position.y;
        positions[base + 2] = _position.z;
        baseColors[base] = color.r;
        baseColors[base + 1] = color.g;
        baseColors[base + 2] = color.b;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const colorAttr = new THREE.BufferAttribute(new Float32Array(sampleCount * 3), 3);
      geometry.setAttribute("color", colorAttr);
      applyColorsToAttribute(baseColors, colorAttr);

      const material = new THREE.PointsMaterial({
        size: pointSize,
        map: alphaMap,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: particleParams.opacity,
        depthWrite: false,
        sizeAttenuation: true,
      });

      const points = new THREE.Points(geometry, material);
      points.frustumCulled = false;
      mesh.add(points);

      particleEntries.push({ mesh, points, baseColors });
    }

    builtKey = buildKey();
  }

  function applyVisibility() {
    if (!rootModel) return;

    const showParticles = particleParams.enabled;
    for (const entry of particleEntries) {
      entry.points.visible = showParticles;
      setMeshMaterialsVisible(entry.mesh, !showParticles);
    }

    if (!showParticles) restoreMeshVisibility();
  }

  function updateAppearance() {
    const pointSize = modelSize * 0.0012 * particleParams.size;

    for (const entry of particleEntries) {
      entry.points.material.size = pointSize;
      entry.points.material.opacity = particleParams.opacity;
      entry.points.material.needsUpdate = true;

      const colorAttr = entry.points.geometry.getAttribute("color");
      applyColorsToAttribute(entry.baseColors, colorAttr);
    }
  }

  function sync() {
    clampParticleParams();
    if (!rootModel) return;

    const key = buildKey();
    const needsRebuild = particleParams.enabled && key !== builtKey;

    if (needsRebuild) buildParticles();
    else updateCustomBaseColors();
    if (particleEntries.length === 0 && particleParams.enabled) buildParticles();

    applyVisibility();

    if (particleParams.enabled && particleEntries.length > 0) {
      updateAppearance();
    }
  }

  function bindModel(model) {
    disposePoints();
    restoreMeshVisibility();
    rootModel = model ?? null;
    builtKey = null;
    if (rootModel) sync();
  }

  function dispose() {
    disposePoints();
    restoreMeshVisibility();
    rootModel = null;
  }

  return { bindModel, sync, dispose };
}
