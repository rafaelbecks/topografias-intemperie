import {
  LinearFilter,
  Matrix3,
  NearestFilter,
  RGBAFormat,
  ShaderMaterial,
  StereoCamera,
  WebGLRenderTarget,
} from "three";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";

/** Anaglyph effect with exposed {@link StereoCamera} for runtime tuning. */
export class AnaglyphEffect {
  constructor(renderer, width = 512, height = 512) {
    this.colorMatrixLeft = new Matrix3().fromArray([
      0.4561, -0.0400822, -0.0152161, 0.500484, -0.0378246, -0.0205971, 0.176381, -0.0157589,
      -0.00546856,
    ]);

    this.colorMatrixRight = new Matrix3().fromArray([
      -0.0434706, 0.378476, -0.0721527, -0.0879388, 0.73364, -0.112961, -0.00155529, -0.0184503,
      1.2264,
    ]);

    this.stereo = new StereoCamera();

    const targetParams = { minFilter: LinearFilter, magFilter: NearestFilter, format: RGBAFormat };
    const renderTargetL = new WebGLRenderTarget(width, height, targetParams);
    const renderTargetR = new WebGLRenderTarget(width, height, targetParams);

    const material = new ShaderMaterial({
      uniforms: {
        mapLeft: { value: renderTargetL.texture },
        mapRight: { value: renderTargetR.texture },
        colorMatrixLeft: { value: this.colorMatrixLeft },
        colorMatrixRight: { value: this.colorMatrixRight },
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
        "uniform mat3 colorMatrixLeft;",
        "uniform mat3 colorMatrixRight;",
        "void main() {",
        "  vec2 uv = vUv;",
        "  vec4 colorL = texture2D( mapLeft, uv );",
        "  vec4 colorR = texture2D( mapRight, uv );",
        "  vec3 color = clamp(",
        "    colorMatrixLeft * colorL.rgb +",
        "    colorMatrixRight * colorR.rgb, 0., 1. );",
        "  gl_FragColor = vec4(",
        "    color.r, color.g, color.b,",
        "    max( colorL.a, colorR.a ) );",
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
