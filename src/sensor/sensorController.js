import * as THREE from "three";
import { DEG, ROTATION_MODES, sensorParams } from "./sensorConfig.js";
import { applyGestureZoom } from "./sensorGestures.js";

export function createSensorController({ getModel, controls, input }) {
  const camera = controls.object;
  const targetRotation = new THREE.Euler(0, 0, 0, "YXZ");
  const targetPosition = new THREE.Vector3();
  const targetQuaternion = new THREE.Quaternion();
  const homeRotation = new THREE.Euler();
  const homePosition = new THREE.Vector3();
  const homeQuaternion = new THREE.Quaternion();
  const baselineQuat = new THREE.Quaternion();
  const sensorQuat = new THREE.Quaternion();
  const deltaQuat = new THREE.Quaternion();
  const scaledDeltaQuat = new THREE.Quaternion();

  let baseline = null;
  let calibrated = false;
  let savedOrbitEnabled = true;
  let lastState = null;
  let lastGesturePushAt = 0;
  let lastGesturePullAt = 0;
  let gestureZoomPending = 0;

  function getAngles(state) {
    if (sensorParams.useOffsetAngles) {
      return { x: state.offsetx, y: state.offsety, z: state.offsetz };
    }
    return { x: state.angx, y: state.angy, z: state.angz };
  }

  function getSensorQuaternion(state) {
    sensorQuat.set(state.qx, state.qy, state.qz, state.qw);
    if (sensorQuat.lengthSq() < 1e-8) {
      sensorQuat.set(0, 0, 0, 1);
    }
    sensorQuat.normalize();
    return sensorQuat;
  }

  function scaleQuaternionDelta(source, factor) {
    if (factor <= 0) return scaledDeltaQuat.identity();

    const angle = 2 * Math.acos(THREE.MathUtils.clamp(source.w, -1, 1));
    if (angle < 1e-6) return scaledDeltaQuat.identity();

    const axis = new THREE.Vector3(source.x, source.y, source.z);
    if (axis.lengthSq() < 1e-8) return scaledDeltaQuat.identity();
    axis.normalize();

    return scaledDeltaQuat.setFromAxisAngle(axis, angle * factor);
  }

  function calibrate(state) {
    const angles = getAngles(state);
    baseline = { x: angles.x, y: angles.y, z: angles.z };
    baselineQuat.copy(getSensorQuaternion(state));
    calibrated = true;

    const model = getModel();
    if (!model) return;
    homeRotation.copy(model.rotation);
    homePosition.copy(model.position);
    homeQuaternion.copy(model.quaternion);
    targetRotation.copy(homeRotation);
    targetPosition.copy(homePosition);
    targetQuaternion.copy(homeQuaternion);
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
      gestureZoomPending = 0;
      setNavigationLocked(false);
      return;
    }
    setNavigationLocked(true);
  }

  function computeEulerTargets(state, delta) {
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
  }

  function computeQuaternionTargets(state) {
    deltaQuat.copy(baselineQuat).invert().multiply(getSensorQuaternion(state));
    const scaled = scaleQuaternionDelta(deltaQuat, sensorParams.rotationSensitivity);
    targetQuaternion.copy(homeQuaternion).multiply(scaled);
  }

  function computePositionTargets(state) {
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

  function computeTargets(state, delta) {
    if (!baseline) return;

    if (sensorParams.rotationMode === ROTATION_MODES.QUATERNION) {
      computeQuaternionTargets(state);
    } else {
      computeEulerTargets(state, delta);
    }

    computePositionTargets(state);
  }

  function handleGestures(state) {
    if (!sensorParams.gestureZoomEnabled) return;

    if (state.gesturePushAt && state.gesturePushAt !== lastGesturePushAt) {
      lastGesturePushAt = state.gesturePushAt;
      gestureZoomPending -= sensorParams.gestureZoomAmount;
    }

    if (state.gesturePullAt && state.gesturePullAt !== lastGesturePullAt) {
      lastGesturePullAt = state.gesturePullAt;
      gestureZoomPending += sensorParams.gestureZoomAmount;
    }
  }

  function handleState(state) {
    handleGestures(state);
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
      if (sensorParams.rotationMode === ROTATION_MODES.QUATERNION) {
        model.quaternion.slerp(targetQuaternion, t);
      } else {
        model.rotation.x += (targetRotation.x - model.rotation.x) * t;
        model.rotation.y += (targetRotation.y - model.rotation.y) * t;
        model.rotation.z += (targetRotation.z - model.rotation.z) * t;
      }
    }

    if (sensorParams.applyPosition) {
      model.position.x += (targetPosition.x - model.position.x) * t;
      model.position.y += (targetPosition.y - model.position.y) * t;
      model.position.z += (targetPosition.z - model.position.z) * t;
    }

    if (sensorParams.gestureZoomEnabled) {
      gestureZoomPending = applyGestureZoom({
        camera,
        controls,
        pending: gestureZoomPending,
        delta,
        smoothing: sensorParams.gestureZoomSmoothing,
      });
    }
  }

  function resetOrientation() {
    const model = getModel();
    if (!model) return;
    model.rotation.copy(homeRotation);
    model.quaternion.copy(homeQuaternion);
    model.position.copy(homePosition);
    targetRotation.copy(homeRotation);
    targetQuaternion.copy(homeQuaternion);
    targetPosition.copy(homePosition);
    calibrated = false;
    baseline = null;
    gestureZoomPending = 0;
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
