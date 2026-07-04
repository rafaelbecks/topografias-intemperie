import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { oceanParams } from "./oceanParams.js";

const ENVELOPE_EXPORT_PARAM_KEYS = [
  "shape",
  "shapeSegments",
  "envelopeRadius",
  "ellipsoidRadiusX",
  "ellipsoidRadiusY",
  "ellipsoidRadiusZ",
  "cuboidWidth",
  "cuboidHeight",
  "cuboidDepth",
  "torusTube",
  "torusKnotRadius",
  "torusKnotTube",
  "torusKnotTubularSegments",
  "torusKnotRadialSegments",
  "torusKnotP",
  "torusKnotQ",
  "torusNoiseAmplitude",
  "torusNoiseScale",
  "torusNoiseSeed",
  "torusNoiseOctaves",
  "envelopeRotationX",
  "envelopeRotationY",
  "envelopeRotationZ",
  "envelopeSide",
];

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

export function buildEnvelopeExportConfig({ extent, noiseMix, mesh }) {
  const params = Object.fromEntries(
    ENVELOPE_EXPORT_PARAM_KEYS.map((key) => [key, oceanParams[key]])
  );

  return {
    version: 1,
    type: "envelope-noise",
    extent,
    noiseMix,
    transform: {
      position: mesh.position.toArray(),
      rotation: [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z],
      scale: mesh.scale.toArray(),
    },
    params,
  };
}

function createExportMesh(sourceMesh, config) {
  const geometry = sourceMesh.geometry.clone();
  const exportMesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.55,
      metalness: 0.05,
    })
  );

  exportMesh.position.copy(sourceMesh.position);
  exportMesh.rotation.copy(sourceMesh.rotation);
  exportMesh.scale.copy(sourceMesh.scale);
  exportMesh.updateMatrixWorld(true);
  geometry.applyMatrix4(exportMesh.matrixWorld);
  exportMesh.position.set(0, 0, 0);
  exportMesh.rotation.set(0, 0, 0);
  exportMesh.scale.set(1, 1, 1);
  exportMesh.userData.envelopeConfig = config;

  return exportMesh;
}

function exportGlb(mesh) {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      mesh,
      (result) => {
        if (result instanceof ArrayBuffer) resolve(result);
        else reject(new Error("Expected binary GLB export"));
      },
      reject,
      { binary: true }
    );
  });
}

/**
 * Export the current deformed envelope as GLB (baked mesh) plus a JSON config
 * that can reconstruct the same shape in this app.
 */
export async function exportEnvelopeModel({ mesh, extent, noiseMix }) {
  const config = buildEnvelopeExportConfig({ extent, noiseMix, mesh });
  const stamp = exportTimestamp();
  const baseName = `${oceanParams.shape}-noise-${stamp}`;

  downloadBlob(
    new Blob([JSON.stringify(config, null, 2)], { type: "application/json" }),
    `${baseName}.json`
  );

  const exportMesh = createExportMesh(mesh, config);
  try {
    const glb = await exportGlb(exportMesh);
    downloadBlob(new Blob([glb], { type: "model/gltf-binary" }), `${baseName}.glb`);
  } finally {
    exportMesh.geometry.dispose();
    exportMesh.material.dispose();
  }

  return { ok: true, baseName };
}
