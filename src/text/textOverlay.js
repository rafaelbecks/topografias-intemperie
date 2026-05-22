import * as THREE from "three";
import { Text } from "three-text";
import { woff2Decode } from "woff-lib/woff2/decode";
import { getTextById } from "./textLines.js";
import { textParams } from "./textParams.js";
import { twisterFragmentShader, twisterVertexShader } from "./twisterShaders.js";

const FONT_PATH = "./lib/fonts/ManieraVF.woff2";
const TEXT_COLOR = [239 / 255, 255 / 255, 235 / 255];

let harfBuzzReady = false;

function ensureHarfBuzz() {
  if (harfBuzzReady) return;
  Text.setHarfBuzzPath("./lib/hb/hb.wasm");
  Text.enableWoff2(woff2Decode);
  harfBuzzReady = true;
}

function centerGeometry(geometry) {
  geometry.computeBoundingBox();
  const center = new THREE.Vector3();
  geometry.boundingBox.getCenter(center);
  geometry.translate(-center.x, -center.y, -center.z);

  const glyphCenter = geometry.attributes.glyphCenter;
  if (!glyphCenter) return;

  for (let i = 0; i < glyphCenter.count; i++) {
    glyphCenter.setXYZ(
      i,
      glyphCenter.getX(i) - center.x,
      glyphCenter.getY(i) - center.y,
      glyphCenter.getZ(i) - center.z
    );
  }
  glyphCenter.needsUpdate = true;
}

function createTwisterMaterial(time) {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: time },
      twisterSpeed: { value: textParams.twisterSpeed },
      twisterHeight: { value: textParams.twisterHeight },
      twisterRadius: { value: textParams.twisterRadius },
      opacity: { value: 0.85 },
    },
    vertexShader: twisterVertexShader,
    fragmentShader: twisterFragmentShader,
    vertexColors: true,
    side: THREE.DoubleSide,
    transparent: true,
    wireframe: textParams.wireframe,
    defines: { USE_COLOR: "" },
  });
}

/**
 * Secondary 3D poem text orbiting the terrain model (three-text twister).
 */
export function createTextOverlay({ scene, loading, getModelBounds }) {
  let textGroup = null;
  let textMesh = null;
  let textInstance = null;
  let time = 0;
  let rendering = false;
  let pendingRebuild = false;

  function syncTransform() {
    if (!textGroup) return;
    const bounds = getModelBounds?.();
    const base = textParams.scale;
    if (bounds) {
      const maxDim = Math.max(bounds.size.x, bounds.size.y, bounds.size.z);
      const s = base * maxDim * 0.004;
      textGroup.scale.setScalar(s);
    } else {
      textGroup.scale.setScalar(base);
    }
  }

  function updateMaterialUniforms() {
    if (!textMesh?.material) return;
    const uniforms = textMesh.material.uniforms;
    if (!uniforms) return;
    uniforms.twisterSpeed.value = textParams.twisterSpeed;
    uniforms.twisterHeight.value = textParams.twisterHeight;
    uniforms.twisterRadius.value = textParams.twisterRadius;
    textMesh.material.wireframe = textParams.wireframe;
  }

  async function render() {
    if (!textParams.enabled) {
      if (textGroup) textGroup.visible = false;
      return;
    }

    if (rendering) {
      pendingRebuild = true;
      return;
    }

    rendering = true;
    ensureHarfBuzz();

    try {
      loading?.begin("text");

      const opts = {
        text: getTextById(textParams.lineId),
        font: FONT_PATH,
        size: textParams.fontSize,
        letterSpacing: textParams.letterSpacing,
        depth: textParams.depth,
        color: TEXT_COLOR,
        perGlyphAttributes: true,
        fontVariations: { wght: 100 },
        layout: {
          direction: "rtl",
          align: "justify",
          respectExistingBreaks: true,
        },
      };

      const result = textInstance
        ? await textInstance.update(opts)
        : await Text.create(opts);
      textInstance = result;

      centerGeometry(result.geometry);

      const material = createTwisterMaterial(time);

      if (textMesh) {
        textMesh.geometry.dispose();
        textMesh.material.dispose();
        textMesh.geometry = result.geometry;
        textMesh.material = material;
      } else {
        textMesh = new THREE.Mesh(result.geometry, material);
        textGroup = new THREE.Group();
        textGroup.add(textMesh);
        textGroup.rotation.x = -Math.PI / 2;
        scene.add(textGroup);
      }

      textGroup.visible = true;
      syncTransform();
    } catch (err) {
      console.error("[text]", err);
    } finally {
      loading?.end("text");
      rendering = false;
      if (pendingRebuild) {
        pendingRebuild = false;
        render();
      }
    }
  }

  async function init() {
    await render();
  }

  function update(delta) {
    if (!textParams.enabled || !textMesh) return;

    time += delta;
    if (textMesh.material?.uniforms?.time) {
      textMesh.material.uniforms.time.value = time;
    }

    if (textGroup && textParams.orbitSpeed) {
      textGroup.rotation.z += textParams.orbitSpeed * delta;
    }
  }

  function setEnabled(enabled) {
    textParams.enabled = enabled;
    if (textGroup) textGroup.visible = enabled;
    if (enabled) render();
  }

  function dispose() {
    if (textMesh) {
      textMesh.geometry?.dispose();
      textMesh.material?.dispose();
    }
    if (textGroup) scene.remove(textGroup);
    textMesh = null;
    textGroup = null;
    textInstance = null;
  }

  return {
    init,
    render,
    update,
    syncTransform,
    setEnabled,
    dispose,
    updateMaterialUniforms,
  };
}
