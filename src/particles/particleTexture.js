import * as THREE from "three";

let sharedTexture = null;

/** Soft radial sprite — same role as particle-texture.jpg in the reference demo. */
export function getParticleTexture() {
  if (sharedTexture) return sharedTexture;

  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.55)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  sharedTexture = new THREE.CanvasTexture(canvas);
  sharedTexture.needsUpdate = true;
  return sharedTexture;
}
