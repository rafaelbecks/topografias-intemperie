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
};

export function applySensorMessage(state, address, value) {
  const key = ADDRESS_KEYS[address];
  if (!key) return false;
  state[key] = value[0] ?? 0;
  state.updatedAt = performance.now();
  return true;
}
