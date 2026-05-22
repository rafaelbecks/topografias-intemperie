import { sensorParams } from "../sensor/sensorConfig.js";

export function setupSensorUI(pane, { sensorClient, sensorController }) {
  const folder = pane.addFolder({ title: "Controller sensor", expanded: false });

  folder.addBinding(sensorParams, "enabled", { label: "active" }).on("change", (e) => {
    if (e.value) {
      sensorController.setActive(true);
      sensorClient.connect(sensorParams.url);
    } else {
      sensorClient.disconnect();
      sensorController.setActive(false);
    }
  });

  folder.addBinding(sensorParams, "url", { label: "websocket" });

  folder.addBinding(sensorParams, "connected", {
    label: "connected",
    readonly: true,
  });

  folder.addButton({ title: "Connect" }).on("click", () => {
    sensorParams.enabled = true;
    sensorController.setActive(true);
    sensorClient.connect(sensorParams.url);
    pane.refresh();
  });

  folder.addButton({ title: "Disconnect" }).on("click", () => {
    sensorParams.enabled = false;
    sensorClient.disconnect();
    sensorController.setActive(false);
    pane.refresh();
  });

  folder.addButton({ title: "Calibrate (zero pose)" }).on("click", () => {
    sensorController.calibrate(sensorClient.getState());
  });

  folder.addButton({ title: "Reset model pose" }).on("click", () => {
    sensorController.resetOrientation();
  });

  const mapping = folder.addFolder({ title: "Mapping", expanded: false });

  mapping.addBinding(sensorParams, "applyRotation", { label: "rotation (angles)" });
  mapping.addBinding(sensorParams, "applyPosition", { label: "position (accel)" });
  mapping.addBinding(sensorParams, "useOffsetAngles", { label: "use offset angles" });
  mapping.addBinding(sensorParams, "useGyroAssist", { label: "gyro assist" });

  mapping.addBinding(sensorParams, "rotationSensitivity", {
    label: "rotation",
    min: 0.1,
    max: 4,
    step: 0.05,
  });

  mapping.addBinding(sensorParams, "positionSensitivity", {
    label: "position",
    min: 0,
    max: 0.5,
    step: 0.005,
  });

  mapping.addBinding(sensorParams, "gyroSensitivity", {
    label: "gyro",
    min: 0,
    max: 0.005,
    step: 0.0001,
  });

  mapping.addBinding(sensorParams, "smoothing", {
    min: 0.02,
    max: 0.5,
    step: 0.01,
  });

  const nav = folder.addFolder({ title: "While active", expanded: false });

  nav.addBinding(sensorParams, "disableOrbitWhileActive", { label: "lock orbit" });
  nav.addBinding(sensorParams, "disableWalkWhileActive", { label: "lock WASD" });

  return {
    onStatus({ connected }) {
      sensorParams.connected = connected;
      pane.refresh();
    },
  };
}
