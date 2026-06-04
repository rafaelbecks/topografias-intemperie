import * as THREE from "three";

/**
 * Dolly the orbit camera along the view axis (push = closer, pull = farther).
 */
export function applyGestureZoom({ camera, controls, pending, delta, smoothing }) {
  if (Math.abs(pending) < 1e-4) return 0;

  const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
  const distance = offset.length();
  if (distance < 1e-6) return pending;

  const t = 1 - Math.pow(1 - smoothing, delta * 60);
  const deltaDist = pending * t;
  const minDist = controls.minDistance ?? 0.1;
  const maxDist = controls.maxDistance ?? Infinity;
  const newDistance = THREE.MathUtils.clamp(distance + deltaDist, minDist, maxDist);
  const applied = newDistance - distance;

  offset.setLength(newDistance);
  camera.position.copy(controls.target).add(offset);

  return pending - applied;
}
