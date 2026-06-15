/** Sine LFO — oscillates between `min` and `max` at `rateHz` cycles per second. */
export function sineLfo(timeSeconds, rateHz, min, max) {
  const mid = (min + max) * 0.5;
  const amp = (max - min) * 0.5;
  return mid + amp * Math.sin(timeSeconds * rateHz * Math.PI * 2);
}
