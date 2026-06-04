/** WebSocket IMU controller — Tweakpane-bound. */
export const ROTATION_MODES = {
  EULER: "euler",
  QUATERNION: "quaternion",
};

export const sensorParams = {
  enabled: false,
  url: "ws://127.0.0.1:8080",
  connected: false,
  applyRotation: true,
  applyPosition: false,
  rotationMode: ROTATION_MODES.QUATERNION,
  useOffsetAngles: true,
  useGyroAssist: true,
  rotationSensitivity: 1.2,
  positionSensitivity: 0.08,
  gyroSensitivity: 0.0004,
  smoothing: 0.12,
  gestureZoomEnabled: true,
  gestureZoomAmount: 1,
  gestureZoomSmoothing: 0.18,
  disableOrbitWhileActive: false,
  disableWalkWhileActive: false,
};

export const DEG = Math.PI / 180;
