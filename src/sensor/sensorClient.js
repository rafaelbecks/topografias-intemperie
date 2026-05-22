import { applySensorMessage, createSensorState } from "./sensorState.js";

export function createSensorClient({ onState } = {}) {
  let socket = null;
  let onStatus = () => {};
  const state = createSensorState();

  function setStatus(connected, detail = "") {
    onStatus({ connected, detail });
  }

  function connect(wsUrl) {
    disconnect();
    setStatus(false, "connecting");

    socket = new WebSocket(wsUrl);

    socket.addEventListener("open", () => {
      setStatus(true);
    });

    socket.addEventListener("message", (event) => {
      try {
        const { address, value } = JSON.parse(event.data);
        if (applySensorMessage(state, address, value)) {
          onState?.(state);
        }
      } catch (err) {
        console.warn("[sensor] bad message", err);
      }
    });

    socket.addEventListener("close", () => {
      setStatus(false);
      socket = null;
    });

    socket.addEventListener("error", () => {
      setStatus(false, "connection failed");
    });
  }

  function disconnect() {
    if (socket) {
      socket.close();
      socket = null;
    }
    setStatus(false);
  }

  function getState() {
    return state;
  }

  return {
    connect,
    disconnect,
    getState,
    set onStatus(handler) {
      onStatus = handler ?? (() => {});
    },
  };
}
