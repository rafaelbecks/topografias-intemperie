import * as THREE from "three";
import { DEG, sensorParams } from "./sensorConfig.js";

export function createSensorController({ getModel, controls, input }) {
  const targetRotation = new THREE.Euler(0, 0, 0, "YXZ");
  const targetPosition = new THREE.Vector3();
  const homeRotation = new THREE.Euler();
  const homePosition = new THREE.Vector3();
  let baseline = null;
  let calibrated = false;
  let savedOrbitEnabled = true;
  let lastState = null;

  function getAngles(state) {
    if (sensorParams.useOffsetAngles) {
      return { x: state.offsetx, y: state.offsety, z: state.offsetz };
    }
    return { x: state.angx, y: state.angy, z: state.angz };
  }

  function calibrate(state) {
    const angles = getAngles(state);
    baseline = { x: angles.x, y: angles.y, z: angles.z };
    calibrated = true;

    const model = getModel();
    if (!model) return;
    homeRotation.copy(model.rotation);
    homePosition.copy(model.position);
    targetRotation.copy(homeRotation);
    targetPosition.copy(homePosition);
  }

  function setNavigationLocked(locked) {
    if (sensorParams.disableOrbitWhileActive) {
      if (locked) savedOrbitEnabled = controls.enabled;
      controls.enabled = locked ? false : savedOrbitEnabled;
    }
    if (sensorParams.disableWalkWhileActive && input?.setWalkEnabled) {
      input.setWalkEnabled(!locked);
    }
  }

  function setActive(active) {
    sensorParams.enabled = active;
    if (!active) {
      calibrated = false;
      baseline = null;
      setNavigationLocked(false);
      return;
    }
    setNavigationLocked(true);
  }

  function computeTargets(state, delta) {
    if (!baseline) return;

    const angles = getAngles(state);
    const rot = sensorParams.rotationSensitivity * DEG;
    const pitch = (angles.y - baseline.y) * rot;
    const roll = (angles.x - baseline.x) * rot;
    const yaw = (angles.z - baseline.z) * rot;

    targetRotation.set(
      homeRotation.x + pitch,
      homeRotation.y + yaw,
      homeRotation.z + roll
    );

    if (sensorParams.useGyroAssist) {
      const g = sensorParams.gyroSensitivity * delta;
      targetRotation.x += state.gy * g;
      targetRotation.y += state.gz * g;
      targetRotation.z += state.gx * g;
    }

    if (sensorParams.applyPosition) {
      const p = sensorParams.positionSensitivity;
      targetPosition.set(
        homePosition.x + state.ay * p,
        homePosition.y + (state.az - 1) * p * 2,
        homePosition.z - state.ax * p
      );
    } else {
      targetPosition.copy(homePosition);
    }
  }

  function handleState(state) {
    lastState = state;
  }

  function update(delta) {
    const state = lastState;
    if (!sensorParams.enabled || !state?.updatedAt) return;

    const model = getModel();
    if (!model) return;

    if (!calibrated) {
      calibrate(state);
      return;
    }

    computeTargets(state, delta);

    const t = 1 - Math.pow(1 - sensorParams.smoothing, delta * 60);

    if (sensorParams.applyRotation) {
      model.rotation.x += (targetRotation.x - model.rotation.x) * t;
      model.rotation.y += (targetRotation.y - model.rotation.y) * t;
      model.rotation.z += (targetRotation.z - model.rotation.z) * t;
    }

    if (sensorParams.applyPosition) {
      model.position.x += (targetPosition.x - model.position.x) * t;
      model.position.y += (targetPosition.y - model.position.y) * t;
      model.position.z += (targetPosition.z - model.position.z) * t;
    }
  }

  function resetOrientation() {
    const model = getModel();
    if (!model) return;
    model.rotation.copy(homeRotation);
    model.position.copy(homePosition);
    targetRotation.copy(homeRotation);
    targetPosition.copy(homePosition);
    calibrated = false;
    baseline = null;
  }

  return {
    setActive,
    handleState,
    update,
    calibrate,
    resetOrientation,
    setNavigationLocked,
  };
}
