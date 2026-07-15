/** Sine LFO — oscillates between `min` and `max` at `rateHz` cycles per second. */
export function sineLfo(timeSeconds, rateHz, min, max) {
  const mid = (min + max) * 0.5;
  const amp = (max - min) * 0.5;
  return mid + amp * Math.sin(timeSeconds * rateHz * Math.PI * 2);
}

/** Triangle LFO — linear sweep between `min` and `max`; constant speed, no dwell at extremes. */
export function triangleLfo(timeSeconds, rateHz, min, max) {
  const phase = (timeSeconds * rateHz) % 1;
  const t = phase < 0.5 ? phase * 2 : 2 - phase * 2;
  return min + (max - min) * t;
}
