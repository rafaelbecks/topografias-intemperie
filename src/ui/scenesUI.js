import {
  ensureDirPermission,
  FRONT_SCENE,
  listJsonFiles,
  loadSceneByName,
  loadSceneFromHandle,
  pickScenesFolder,
  SCENE_ORDER,
  supportsDirectoryPicker,
} from "../scenes.js";

/**
 * Scene picker controls inside the State folder.
 * @returns {{ currentScene: string, refreshSceneList: Function }}
 */
export function setupScenesUI(folder, ctx) {
  const sceneState = { scene: FRONT_SCENE };
  let currentScene = FRONT_SCENE;
  let dirHandle = null;
  let fileHandles = new Map();
  const { envCycle } = ctx;

  function notifySceneChange(name) {
    const isFront = name === FRONT_SCENE;
    envCycle?.setFrontScene(isFront);
    ctx.ui?.refresh?.();
  }

  const sceneOptions = Object.fromEntries(
    [FRONT_SCENE, ...SCENE_ORDER].map((name) => [name, name])
  );
  if (!sceneOptions[currentScene]) {
    sceneOptions[currentScene] = currentScene;
  }
  let sceneBinding;

  function rebuildSceneBinding() {
    if (sceneBinding) sceneBinding.dispose();
    sceneState.scene = currentScene;
    sceneBinding = folder
      .addBinding(sceneState, "scene", {
        label: "scene",
        options: sceneOptions,
      })
      .on("change", async (e) => {
        await loadSelectedScene(e.value);
      });
  }

  async function loadSelectedScene(name) {
    try {
      envCycle?.stop();
      const handle = fileHandles.get(name);
      if (handle) {
        await loadSceneFromHandle(handle, ctx);
      } else {
        await loadSceneByName(name, ctx);
      }
      currentScene = name;
      sceneState.scene = name;
      sceneBinding?.refresh();
      notifySceneChange(name);
    } catch (err) {
      console.error(err);
      alert(`Failed to load scene: ${err.message}`);
      sceneBinding?.refresh();
    }
  }

  async function refreshSceneList(handles) {
    fileHandles.clear();
    for (const key of Object.keys(sceneOptions)) {
      delete sceneOptions[key];
    }

    for (const handle of handles) {
      sceneOptions[handle.name] = handle.name;
      fileHandles.set(handle.name, handle);
    }

    if (!sceneOptions[currentScene]) {
      currentScene = handles[0]?.name ?? FRONT_SCENE;
      if (!sceneOptions[currentScene]) {
        sceneOptions[currentScene] = currentScene;
      }
    }

    rebuildSceneBinding();
  }

  rebuildSceneBinding();

  folder.addButton({ title: "Reload scene" }).on("click", () => {
    loadSelectedScene(currentScene);
  });

  if (supportsDirectoryPicker()) {
    folder.addButton({ title: "Browse scenes folder" }).on("click", async () => {
      try {
        const picked = await pickScenesFolder();
        if (!picked) return;
        if (!(await ensureDirPermission(picked))) return;

        dirHandle = picked;
        const files = await listJsonFiles(dirHandle);
        if (files.length === 0) {
          alert("No JSON files found in that folder.");
          return;
        }
        await refreshSceneList(files);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error(err);
        alert(`Failed to open scenes folder: ${err.message}`);
      }
    });
  }

  return {
    currentScene: () => currentScene,
    loadScene: (name) => loadSelectedScene(name),
  };
}
