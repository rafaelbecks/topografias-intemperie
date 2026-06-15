import { unlockAudioFromUserGesture } from "./audio/audioUnlock.js";
import { FRONT_SCENE, getInitialSceneName } from "./scenes.js";

async function enterViewer(sceneName) {
  const { bootSceneViewer } = await import("./sceneMain.js");
  await bootSceneViewer(sceneName);
}

unlockAudioFromUserGesture();
enterViewer(getInitialSceneName() ?? FRONT_SCENE);
