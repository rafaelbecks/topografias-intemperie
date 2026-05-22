/** WebSocket IMU controller — Tweakpane-bound. */
export const sensorParams = {
  enabled: false,
  url: "ws://127.0.0.1:8080",
  connected: false,
  applyRotation: true,
  applyPosition: false,
  useOffsetAngles: true,
  useGyroAssist: true,
  rotationSensitivity: 1.2,
  positionSensitivity: 0.08,
  gyroSensitivity: 0.0004,
  smoothing: 0.12,
  disableOrbitWhileActive: true,
  disableWalkWhileActive: true,
};

export const DEG = Math.PI / 180;
