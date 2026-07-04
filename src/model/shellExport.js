import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

const CAP_THRESHOLD = 0.85;

const _center = new THREE.Vector3();
const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();
const _vC = new THREE.Vector3();
const _edge1 = new THREE.Vector3();
const _edge2 = new THREE.Vector3();
const _normal = new THREE.Vector3();

function exportTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportGlb(object) {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      object,
      (result) => {
        if (result instanceof ArrayBuffer) resolve(result);
        else reject(new Error("Expected binary GLB export"));
      },
      reject,
      { binary: true }
    );
  });
}

function getTriangleNormal(position, i0, i1, i2, target) {
  _vA.fromBufferAttribute(position, i0);
  _vB.fromBufferAttribute(position, i1);
  _vC.fromBufferAttribute(position, i2);
  _edge1.subVectors(_vB, _vA);
  _edge2.subVectors(_vC, _vA);
  return target.crossVectors(_edge1, _edge2).normalize();
}

function shouldKeepTriangle(normal, isTop, isBottom) {
  const absY = Math.abs(normal.y);
  if (absY < CAP_THRESHOLD) return true;
  if (normal.y > 0 && isTop) return true;
  if (normal.y < 0 && isBottom) return true;
  return false;
}

/**
 * Keep side walls plus the top cap of the highest layer and bottom cap of the lowest.
 * Drops horizontal faces between stacked contour layers so the mesh is a hollow shell.
 */
function extractShellGeometry(sourceGeometry, worldMatrix, { isTop, isBottom }) {
  const geometry = sourceGeometry.clone();
  geometry.applyMatrix4(worldMatrix);

  const position = geometry.attributes.position;
  const index = geometry.index;
  const triCount = index ? index.count / 3 : position.count / 3;
  const kept = [];

  for (let t = 0; t < triCount; t++) {
    const i0 = index ? index.getX(t * 3) : t * 3;
    const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;

    getTriangleNormal(position, i0, i1, i2, _normal);
    if (!shouldKeepTriangle(_normal, isTop, isBottom)) continue;

    kept.push(
      position.getX(i0),
      position.getY(i0),
      position.getZ(i0),
      position.getX(i1),
      position.getY(i1),
      position.getZ(i1),
      position.getX(i2),
      position.getY(i2),
      position.getZ(i2)
    );
  }

  geometry.dispose();

  if (kept.length === 0) return null;

  const shell = new THREE.BufferGeometry();
  shell.setAttribute("position", new THREE.Float32BufferAttribute(kept, 3));
  shell.computeVertexNormals();
  return shell;
}

function sortMeshesByHeight(meshes) {
  return [...meshes].sort((a, b) => {
    const ay = new THREE.Box3().setFromObject(a).getCenter(_center).y;
    const by = new THREE.Box3().setFromObject(b).getCenter(_center).y;
    return ay - by;
  });
}

function collectMeshes(root) {
  const meshes = [];
  root.traverse((child) => {
    if (child.isMesh && child.geometry?.attributes?.position) meshes.push(child);
  });
  return meshes;
}

function mergeGeometries(geometries) {
  let totalVerts = 0;
  for (const geometry of geometries) {
    totalVerts += geometry.attributes.position.count;
  }

  const merged = new Float32Array(totalVerts * 3);
  let offset = 0;
  for (const geometry of geometries) {
    const array = geometry.attributes.position.array;
    merged.set(array, offset);
    offset += array.length;
  }

  const result = new THREE.BufferGeometry();
  result.setAttribute("position", new THREE.BufferAttribute(merged, 3));
  result.computeVertexNormals();
  return result;
}

function buildShellMesh(root, terrainAnimation) {
  terrainAnimation?.resetLayers?.();
  root.updateMatrixWorld(true);

  const meshes = sortMeshesByHeight(collectMeshes(root));
  if (meshes.length === 0) return null;

  const parts = [];
  const last = meshes.length - 1;

  for (let i = 0; i < meshes.length; i++) {
    const shell = extractShellGeometry(meshes[i].geometry, meshes[i].matrixWorld, {
      isTop: i === last,
      isBottom: i === 0,
    });
    if (shell) parts.push(shell);
  }

  if (parts.length === 0) return null;

  const merged = mergeGeometries(parts);
  parts.forEach((geometry) => geometry.dispose());

  const exportMesh = new THREE.Mesh(
    merged,
    new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.55,
      metalness: 0.05,
      side: THREE.DoubleSide,
    })
  );

  exportMesh.name = `${root.name || "model"}-shell`;
  return exportMesh;
}

/**
 * Export the loaded contour model as a hollow shell GLB (rest pose, no animation).
 */
export async function exportContourShell({ model, modelName, terrainAnimation }) {
  if (!model) {
    return { ok: false, reason: "Load a terrain model first." };
  }

  const exportMesh = buildShellMesh(model, terrainAnimation);
  if (!exportMesh) {
    return { ok: false, reason: "Could not extract shell geometry from this model." };
  }

  const stamp = exportTimestamp();
  const baseName = `${modelName || "model"}-shell-${stamp}`;

  try {
    const glb = await exportGlb(exportMesh);
    downloadBlob(new Blob([glb], { type: "model/gltf-binary" }), `${baseName}.glb`);
    return { ok: true, baseName };
  } finally {
    exportMesh.geometry.dispose();
    exportMesh.material.dispose();
  }
}
