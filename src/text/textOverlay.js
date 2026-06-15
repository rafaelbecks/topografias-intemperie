import * as THREE from "three";
import { Text } from "three-text";
import { woff2Decode } from "woff-lib/woff2/decode";
import { getTextById } from "./textLines.js";
import { textParams } from "./textParams.js";
import { flipVertexShader } from "./flipShaders.js";
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

function getDisplayText() {
  if (textParams.content?.trim()) return textParams.content;
  return getTextById(textParams.lineId);
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

function computeDiagonalRange(geometry) {
  const glyphCenter = geometry.attributes.glyphCenter;
  if (!glyphCenter) return { min: 0, max: 1 };

  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < glyphCenter.count; i++) {
    const diagonal = glyphCenter.getX(i) + glyphCenter.getY(i);
    min = Math.min(min, diagonal);
    max = Math.max(max, diagonal);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1 };
  return { min, max };
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

function createFlipMaterial(time, diagonalRange) {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: time },
      flipSpeed: { value: textParams.flipSpeed },
      flipPauseDuration: { value: textParams.flipPauseDuration },
      minDiagonal: { value: diagonalRange.min },
      maxDiagonal: { value: diagonalRange.max },
      opacity: { value: 1.0 },
    },
    vertexShader: flipVertexShader,
    fragmentShader: twisterFragmentShader,
    vertexColors: true,
    side: THREE.DoubleSide,
    transparent: true,
    wireframe: textParams.wireframe,
    defines: { USE_COLOR: "" },
  });
}

function createBasicMaterial() {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color().fromArray(TEXT_COLOR),
    wireframe: textParams.wireframe,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.95,
  });
}

/**
 * Secondary 3D poem text orbiting the terrain model (three-text twister / flip).
 */
export function createTextOverlay({ scene, loading, getModelBounds }) {
  let textGroup = null;
  let textMesh = null;
  let textInstance = null;
  let time = 0;
  let rendering = false;
  let pendingRebuild = false;
  let diagonalRange = { min: 0, max: 1 };

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

  function applyOrientation() {
    if (!textGroup) return;
    textGroup.rotation.x = textParams.upright ? 0 : -Math.PI / 2;
  }

  function updateMaterialUniforms() {
    if (!textMesh?.material) return;

    if (textParams.animationMode === "orbit") {
      textMesh.material.wireframe = textParams.wireframe;
      return;
    }

    const uniforms = textMesh.material.uniforms;
    if (!uniforms) return;

    if (textParams.animationMode === "twister") {
      if (uniforms.twisterSpeed) uniforms.twisterSpeed.value = textParams.twisterSpeed;
      if (uniforms.twisterHeight) uniforms.twisterHeight.value = textParams.twisterHeight;
      if (uniforms.twisterRadius) uniforms.twisterRadius.value = textParams.twisterRadius;
    } else if (textParams.animationMode === "flip") {
      if (uniforms.flipSpeed) uniforms.flipSpeed.value = textParams.flipSpeed;
      if (uniforms.flipPauseDuration) {
        uniforms.flipPauseDuration.value = textParams.flipPauseDuration;
      }
      if (uniforms.minDiagonal) uniforms.minDiagonal.value = diagonalRange.min;
      if (uniforms.maxDiagonal) uniforms.maxDiagonal.value = diagonalRange.max;
    }

    textMesh.material.wireframe = textParams.wireframe;
  }

  function createMaterialForMode() {
    if (textParams.animationMode === "flip") {
      return createFlipMaterial(time, diagonalRange);
    }
    if (textParams.animationMode === "orbit") {
      return createBasicMaterial();
    }
    return createTwisterMaterial(time);
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
        text: getDisplayText(),
        font: FONT_PATH,
        size: textParams.fontSize,
        letterSpacing: textParams.letterSpacing,
        depth: textParams.depth,
        color: TEXT_COLOR,
        perGlyphAttributes: true,
        fontVariations: { wght: 100 },
        layout: {
          direction: textParams.direction,
          align: textParams.align,
          lineWidth: textParams.lineWidth,
          lineHeight: textParams.lineHeight,
          respectExistingBreaks: true,
        },
      };

      const result = textInstance
        ? await textInstance.update(opts)
        : await Text.create(opts);
      textInstance = result;

      centerGeometry(result.geometry);
      diagonalRange = computeDiagonalRange(result.geometry);

      const material = createMaterialForMode();

      if (textMesh) {
        textMesh.geometry.dispose();
        textMesh.material.dispose();
        textMesh.geometry = result.geometry;
        textMesh.material = material;
      } else {
        textMesh = new THREE.Mesh(result.geometry, material);
        textGroup = new THREE.Group();
        textGroup.add(textMesh);
        scene.add(textGroup);
      }

      applyOrientation();
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

    if (textGroup && textParams.animationMode === "orbit" && textParams.orbitSpeed) {
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
