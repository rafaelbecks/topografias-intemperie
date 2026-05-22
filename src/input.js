import * as THREE from "three";
import { params } from "./config.js";

export function createInputSystem(camera, controls) {
  let walkEnabled = true;
  const moveState = { forward: false, backward: false, left: false, right: false };
  const walkForward = new THREE.Vector3();
  const walkRight = new THREE.Vector3();
  const walkDelta = new THREE.Vector3();

  function onKeyDown(e) {
    if (e.repeat) return;
    switch (e.code) {
      case "KeyW": moveState.forward = true; break;
      case "KeyS": moveState.backward = true; break;
      case "KeyA": moveState.left = true; break;
      case "KeyD": moveState.right = true; break;
      default: break;
    }
  }

  function onKeyUp(e) {
    switch (e.code) {
      case "KeyW": moveState.forward = false; break;
      case "KeyS": moveState.backward = false; break;
      case "KeyA": moveState.left = false; break;
      case "KeyD": moveState.right = false; break;
      default: break;
    }
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  function resetMoveState() {
    moveState.forward = false;
    moveState.backward = false;
    moveState.left = false;
    moveState.right = false;
  }

  function setWalkEnabled(enabled) {
    walkEnabled = enabled;
    if (!enabled) resetMoveState();
  }

  function applyWalkMovement(delta) {
    if (!params.fpMove || !walkEnabled) return;
    const speed = params.moveSpeed * delta;
    camera.getWorldDirection(walkForward);
    walkForward.y = 0;
    if (walkForward.lengthSq() <= 1e-8) return;
    walkForward.normalize();
    walkRight.crossVectors(walkForward, camera.up).normalize();

    walkDelta.set(0, 0, 0);
    if (moveState.forward) walkDelta.addScaledVector(walkForward, speed);
    if (moveState.backward) walkDelta.addScaledVector(walkForward, -speed);
    if (moveState.right) walkDelta.addScaledVector(walkRight, speed);
    if (moveState.left) walkDelta.addScaledVector(walkRight, -speed);
    if (walkDelta.lengthSq() === 0) return;
    camera.position.add(walkDelta);
    controls.target.add(walkDelta);
  }

  return { applyWalkMovement, resetMoveState, setWalkEnabled };
}
