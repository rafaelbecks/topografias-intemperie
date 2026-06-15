/** WebSocket IMU controller — Tweakpane-bound. */
export const ROTATION_MODES = {
  EULER: "euler",
  QUATERNION: "quaternion",
};

export const ROTATION_TARGETS = {
  CAMERA: "camera",
  MODEL: "model",
};

export const sensorParams = {
  enabled: false,
  url: "ws://127.0.0.1:8080",
  connected: false,
  applyRotation: true,
  rotationTarget: ROTATION_TARGETS.CAMERA,
  applyPosition: true,
  rotationMode: ROTATION_MODES.QUATERNION,
  useOffsetAngles: true,
  useGyroAssist: true,
  rotationSensitivity: 1.2,
  positionSensitivity: 0.315,
  gyroSensitivity: 0.0004,
  smoothing: 0.02,
  distanceZoomEnabled: true,
  distanceSensitivity: 2.3,
  distanceThreshold: 2,
  distanceSmoothing: 0.12,
  disableOrbitWhileActive: false,
  disableWalkWhileActive: false,
};

export const DEG = Math.PI / 180;
