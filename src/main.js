import { createFrontPage } from "./front/createFrontPage.js";
import { unlockAudioFromUserGesture } from "./audio/audioUnlock.js";
import { getInitialSceneName } from "./scenes.js";

async function enterViewer(sceneName) {
  const { bootSceneViewer } = await import("./sceneMain.js");
  await bootSceneViewer(sceneName);
}

const sceneParam = new URLSearchParams(location.search).get("scene");

if (sceneParam) {
  enterViewer(getInitialSceneName());
} else {
  const front = createFrontPage({
    onSceneSelect: (name) => {
      unlockAudioFromUserGesture();
      front.destroy();
      enterViewer(name);
    },
  });
}
