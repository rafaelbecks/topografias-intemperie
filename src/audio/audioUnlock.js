import { Howl, Howler } from "howler";

// Minimal valid WAV — used to create/resume the shared Howler AudioContext on gesture.
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

let primed = false;

/**
 * Resume Howler's audio context inside a user-gesture handler (click, keydown, etc.).
 * Call synchronously before any async scene boot so saved `playing: true` can start.
 */
export function unlockAudioFromUserGesture() {
  if (primed && Howler.ctx?.state === "running") return;

  const probe = new Howl({
    src: [SILENT_WAV],
    volume: 0,
    html5: true,
  });

  const id = probe.play();
  probe.stop(id);
  probe.unload();

  if (Howler.ctx?.state === "suspended") {
    void Howler.ctx.resume();
  }

  primed = true;
}
