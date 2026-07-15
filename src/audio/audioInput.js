export function isAudioInputSupported() {
  return Boolean(navigator.mediaDevices?.getUserMedia && navigator.mediaDevices?.enumerateDevices);
}

export async function listAudioInputDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === "audioinput");
}

export function formatDeviceLabel(device, index) {
  const name = device.label?.trim();
  if (name) return name;
  return `Microphone ${index + 1}`;
}

export function createAudioInputManager() {
  let stream = null;
  let audioCtx = null;
  let sourceNode = null;
  let analyser = null;
  let timeData = null;

  function disconnectMonitor() {
    try {
      sourceNode?.disconnect();
    } catch {
      /* already disconnected */
    }
    sourceNode = null;
    analyser = null;
    timeData = null;
  }

  function ensureAudioContext() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    return audioCtx;
  }

  function connectMonitor(mediaStream) {
    disconnectMonitor();
    if (!mediaStream) return;

    const ctx = ensureAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    sourceNode = ctx.createMediaStreamSource(mediaStream);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.65;
    timeData = new Uint8Array(analyser.fftSize);
    sourceNode.connect(analyser);
  }

  async function acquire(deviceId) {
    // Tear down old tracks before opening a new device so the OS can hand off cleanly.
    releaseTracks();
    disconnectMonitor();

    const audio = deviceId ? { deviceId: { exact: deviceId } } : true;
    stream = await navigator.mediaDevices.getUserMedia({ audio });
    connectMonitor(stream);
    return stream;
  }

  function releaseTracks() {
    for (const track of stream?.getTracks() ?? []) {
      track.stop();
    }
    stream = null;
  }

  function release() {
    disconnectMonitor();
    releaseTracks();
  }

  /** Peak level in 0..1 from the live input track. */
  function getLevel() {
    if (!analyser || !timeData) return 0;
    analyser.getByteTimeDomainData(timeData);

    let peak = 0;
    for (let i = 0; i < timeData.length; i++) {
      const v = Math.abs(timeData[i] - 128) / 128;
      if (v > peak) peak = v;
    }
    return peak;
  }

  function getActiveTrackLabel() {
    const track = stream?.getAudioTracks()?.[0];
    if (!track) return "";
    return track.label?.trim() || "Microphone";
  }

  function getActiveDeviceId() {
    const track = stream?.getAudioTracks()?.[0];
    return track?.getSettings?.().deviceId ?? "";
  }

  function destroy() {
    release();
    if (audioCtx) {
      audioCtx.close().catch(() => {});
      audioCtx = null;
    }
  }

  return {
    acquire,
    release,
    destroy,
    getStream: () => stream,
    getLevel,
    getActiveTrackLabel,
    getActiveDeviceId,
  };
}
