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

  async function acquire(deviceId) {
    release();
    const audio = deviceId ? { deviceId: { exact: deviceId } } : true;
    stream = await navigator.mediaDevices.getUserMedia({ audio });
    return stream;
  }

  function release() {
    for (const track of stream?.getTracks() ?? []) {
      track.stop();
    }
    stream = null;
  }

  return {
    acquire,
    release,
    getStream: () => stream,
  };
}
