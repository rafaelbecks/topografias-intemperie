// proximityExtrude.js
import fs from "fs";
import * as THREE from "three";
import { NodeIO } from "@gltf-transform/core";

// ---------- SETTINGS ----------
const INPUT = "./carto13.glb";
const OUTPUT = "./carto13-extruded.glb";

const MODE = "terrain";

// contour range to extrude
const TOP_CURVE = 211;
const BOTTOM_CURVE = 142;

const TOP_CURVE_2 = 72;
const BOTTOM_CURVE_2 = 140;

// terrain height (meters or units)
const MAX_HEIGHT = 2;

// terrain profile:
// "mountain" | "volcano" | "dune"
const PROFILE = "mountain";

// Blender-style centered extrusion compensation
const COMPENSATE_CENTER = true;


// proximity parameters (used if MODE="proximity")
const INFLUENCE_RADIUS = 25;
// --------------------------------


// terrain profiles
function heightProfile(t) {
  switch (PROFILE) {
    case "mountain":
      return MAX_HEIGHT * (1 - Math.pow(t, 1.7));
    case "volcano":
      return MAX_HEIGHT * (1 - Math.pow(t, 2));
    case "dune":
      return MAX_HEIGHT * Math.cos(t * Math.PI / 2);
    default:
      return MAX_HEIGHT * (1 - t);
  }
}

// proximity-based height (your original logic)
function computeHeight(point, points) {
  let minDist = Infinity;

  for (let p of points) {
    const d = point.distanceTo(p);
    if (d > 0 && d < minDist) minDist = d;
  }

  if (minDist === Infinity) return 0;

  const normalized = Math.max(0, 1 - minDist / INFLUENCE_RADIUS);
  return normalized * MAX_HEIGHT;
}

// extract curve number from object name
function getCurveIndex(name) {
  const match = name.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

async function run() {
  const io = new NodeIO();
  const doc = await io.read(INPUT);
  const root = doc.getRoot();

  const meshes = root.listMeshes();

  // filter mershes within desired contour range
  const targetMeshes = meshes.filter(mesh => {
    const idx = getCurveIndex(mesh.getName());
    return idx !== null &&
           idx <= TOP_CURVE &&
           idx >= BOTTOM_CURVE;
  });

  // sort from top → bottom
  targetMeshes.sort((a, b) =>
    getCurveIndex(b.getName()) - getCurveIndex(a.getName())
  );

  const contourCount = targetMeshes.length;

  console.log("Contours selected:", contourCount);

  targetMeshes.forEach(m => console.log(m.getName()));

  targetMeshes.forEach((mesh, i) => {

    const t = contourCount > 1 ? i / (contourCount - 1) : 0;
    const terrainHeight = heightProfile(t);

    mesh.listPrimitives().forEach((prim) => {

      const posAccessor = prim.getAttribute("POSITION");
      const array = posAccessor.getArray();

      const points = [];

      if (MODE === "proximity") {
        for (let j = 0; j < array.length; j += 3) {
          points.push(
            new THREE.Vector3(array[j], array[j+1], array[j+2])
          );
        }
      }

      for (let j = 0; j < array.length; j += 3) {

        let height;

        if (MODE === "terrain") {
          height = terrainHeight;
        } else {
          const p = new THREE.Vector3(
            array[j],
            array[j+1],
            array[j+2]
          );
          height = computeHeight(p, points);
        }

        // compensate centered extrusion like Blender
        if (COMPENSATE_CENTER) {
          array[j + 2] += height * 0.5;
        } else {
          array[j + 2] += height;
        }
      }

      posAccessor.setArray(array);
    });

  });

  await io.write(OUTPUT, doc);
  console.log("✅ Extruded model saved:", OUTPUT);
}

run();
