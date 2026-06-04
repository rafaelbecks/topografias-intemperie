/** Latest accelerometer readings keyed by OSC-style paths. */
export function createSensorState() {
  return {
    ax: 0,
    ay: 0,
    az: 1,
    gx: 0,
    gy: 0,
    gz: 0,
    angx: 0,
    angy: 0,
    angz: 0,
    offsetx: 0,
    offsety: 0,
    offsetz: 0,
    qx: 0,
    qy: 0,
    qz: 0,
    qw: 1,
    gesturePushAt: 0,
    gesturePullAt: 0,
    updatedAt: 0,
  };
}

const ADDRESS_KEYS = {
  "/accelerometer/ax": "ax",
  "/accelerometer/ay": "ay",
  "/accelerometer/az": "az",
  "/accelerometer/gx": "gx",
  "/accelerometer/gy": "gy",
  "/accelerometer/gz": "gz",
  "/accelerometer/angx": "angx",
  "/accelerometer/angy": "angy",
  "/accelerometer/angz": "angz",
  "/accelerometer/offsetx": "offsetx",
  "/accelerometer/offsety": "offsety",
  "/accelerometer/offsetz": "offsetz",
  "/accelerometer/qx": "qx",
  "/accelerometer/qy": "qy",
  "/accelerometer/qz": "qz",
  "/accelerometer/qw": "qw",
};

const GESTURE_KEYS = {
  "/gesture/push": "gesturePushAt",
  "/gesture/pull": "gesturePullAt",
};

export function applySensorMessage(state, address, value) {
  const gestureKey = GESTURE_KEYS[address];
  if (gestureKey) {
    state[gestureKey] = performance.now();
    return true;
  }

  const key = ADDRESS_KEYS[address];
  if (!key) return false;
  state[key] = value[0] ?? 0;
  state.updatedAt = performance.now();
  return true;
}
