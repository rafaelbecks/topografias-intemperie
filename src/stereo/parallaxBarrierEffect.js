import {
  LinearFilter,
  NearestFilter,
  RGBAFormat,
  ShaderMaterial,
  StereoCamera,
  WebGLRenderTarget,
} from "three";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";

/** Parallax barrier effect with exposed {@link StereoCamera} for runtime tuning. */
export class ParallaxBarrierEffect {
  constructor(renderer) {
    this.stereo = new StereoCamera();

    const targetParams = { minFilter: LinearFilter, magFilter: NearestFilter, format: RGBAFormat };
    const renderTargetL = new WebGLRenderTarget(512, 512, targetParams);
    const renderTargetR = new WebGLRenderTarget(512, 512, targetParams);

    const material = new ShaderMaterial({
      uniforms: {
        mapLeft: { value: renderTargetL.texture },
        mapRight: { value: renderTargetR.texture },
      },
      vertexShader: [
        "varying vec2 vUv;",
        "void main() {",
        "  vUv = vec2( uv.x, uv.y );",
        "  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
        "}",
      ].join("\n"),
      fragmentShader: [
        "uniform sampler2D mapLeft;",
        "uniform sampler2D mapRight;",
        "varying vec2 vUv;",
        "void main() {",
        "  vec2 uv = vUv;",
        "  if ( ( mod( gl_FragCoord.y, 2.0 ) ) > 1.00 ) {",
        "    gl_FragColor = texture2D( mapLeft, uv );",
        "  } else {",
        "    gl_FragColor = texture2D( mapRight, uv );",
        "  }",
        "  #include <tonemapping_fragment>",
        "  #include <colorspace_fragment>",
        "}",
      ].join("\n"),
    });

    const quad = new FullScreenQuad(material);

    this.setSize = function setSize(nextWidth, nextHeight) {
      renderer.setSize(nextWidth, nextHeight);
      const pixelRatio = renderer.getPixelRatio();
      renderTargetL.setSize(nextWidth * pixelRatio, nextHeight * pixelRatio);
      renderTargetR.setSize(nextWidth * pixelRatio, nextHeight * pixelRatio);
    };

    this.render = function render(scene, camera) {
      const currentRenderTarget = renderer.getRenderTarget();

      if (scene.matrixWorldAutoUpdate === true) scene.updateMatrixWorld();
      if (camera.parent === null && camera.matrixWorldAutoUpdate === true) {
        camera.updateMatrixWorld();
      }

      this.stereo.update(camera);

      renderer.setRenderTarget(renderTargetL);
      renderer.clear();
      renderer.render(scene, this.stereo.cameraL);

      renderer.setRenderTarget(renderTargetR);
      renderer.clear();
      renderer.render(scene, this.stereo.cameraR);

      renderer.setRenderTarget(null);
      quad.render(renderer);
      renderer.setRenderTarget(currentRenderTarget);
    };

    this.dispose = function dispose() {
      renderTargetL.dispose();
      renderTargetR.dispose();
      material.dispose();
      quad.dispose();
    };
  }
}
