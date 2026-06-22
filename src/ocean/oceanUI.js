import { ENVELOPE_SIDE_OPTIONS, oceanParams } from "./oceanParams.js";
import { OCEAN_SHAPES } from "./oceanGeometries.js";

const SHAPE_OPTIONS = Object.fromEntries(
  OCEAN_SHAPES.map((shape) => [shape, shape])
);

export function setupOceanUI(page, oceanSystem) {
  const folder = page.addFolder({ title: "Ocean", expanded: false });

  folder.addBinding(oceanParams, "enabled", { label: "enabled" });

  const shapeFolder = folder.addFolder({ title: "Shape", expanded: true });

  shapeFolder.addBinding(oceanParams, "shape", {
    label: "type",
    options: SHAPE_OPTIONS,
  });

  shapeFolder.addBinding(oceanParams, "sizeScale", {
    label: "size scale",
    min: 1,
    max: 10,
    step: 0.1,
  });

  shapeFolder.addBinding(oceanParams, "shapeSegments", {
    label: "segments",
    min: 16,
    max: 256,
    step: 1,
  });

  const flatFolder = shapeFolder.addFolder({ title: "Flat edges", expanded: false });

  flatFolder.addBinding(oceanParams, "height", {
    label: "height",
    min: -200,
    max: 200,
    step: 0.5,
  });

  flatFolder.addBinding(oceanParams, "ovalRatio", {
    label: "oval ratio",
    min: 0.25,
    max: 4,
    step: 0.05,
  });

  const noiseFolder = flatFolder.addFolder({ title: "Noise edge", expanded: false });

  noiseFolder.addBinding(oceanParams, "noiseAmplitude", {
    label: "amplitude",
    min: 0,
    max: 1,
    step: 0.01,
  });

  noiseFolder.addBinding(oceanParams, "noiseScale", {
    label: "frequency",
    min: 0.1,
    max: 5,
    step: 0.05,
  });

  noiseFolder.addBinding(oceanParams, "noiseSeed", {
    label: "seed",
    min: 0,
    max: 9999,
    step: 1,
  });

  const envelopeFolder = shapeFolder.addFolder({
    title: "Envelope (experimental)",
    expanded: false,
  });

  envelopeFolder.addBinding(oceanParams, "envelopeRadius", {
    label: "radius scale",
    min: 0.5,
    max: 30,
    step: 0.05,
  });

  envelopeFolder.addBinding(oceanParams, "torusTube", {
    label: "torus tube",
    min: 0.05,
    max: 0.8,
    step: 0.01,
  });

  const torusNoiseFolder = envelopeFolder.addFolder({
    title: "Torus noise deform",
    expanded: false,
  });

  torusNoiseFolder.addBinding(oceanParams, "torusNoiseEnabled", { label: "enabled" });

  torusNoiseFolder.addBinding(oceanParams, "torusNoiseAmplitude", {
    label: "amplitude",
    min: 0,
    max: 1,
    step: 0.01,
  });

  torusNoiseFolder.addBinding(oceanParams, "torusNoiseScale", {
    label: "frequency",
    min: 0.1,
    max: 6,
    step: 0.05,
  });

  torusNoiseFolder.addBinding(oceanParams, "torusNoiseOctaves", {
    label: "octaves",
    min: 1,
    max: 5,
    step: 1,
  });

  torusNoiseFolder.addBinding(oceanParams, "torusNoiseSeed", {
    label: "seed",
    min: 0,
    max: 9999,
    step: 1,
  });

  torusNoiseFolder.addBinding(oceanParams, "torusNoiseMorphSpeed", {
    label: "morph speed",
    min: 0.5,
    max: 12,
    step: 0.1,
  });

  torusNoiseFolder.addButton({ title: "Export model (.glb + .json)" }).on("click", async () => {
    try {
      const result = await oceanSystem.exportEnvelope();
      if (!result.ok) {
        alert(result.reason);
      }
    } catch (err) {
      console.error(err);
      alert(`Export failed: ${err.message}`);
    }
  });

  const torusKnotFolder = envelopeFolder.addFolder({
    title: "Torus knot",
    expanded: false,
  });

  torusKnotFolder.addBinding(oceanParams, "torusKnotRadius", {
    label: "radius",
    min: 0.1,
    max: 4,
    step: 0.05,
  });

  torusKnotFolder.addBinding(oceanParams, "torusKnotTube", {
    label: "tube",
    min: 0.05,
    max: 1.5,
    step: 0.01,
  });

  torusKnotFolder.addBinding(oceanParams, "torusKnotTubularSegments", {
    label: "tubular segments",
    min: 8,
    max: 512,
    step: 1,
  });

  torusKnotFolder.addBinding(oceanParams, "torusKnotRadialSegments", {
    label: "radial segments",
    min: 3,
    max: 64,
    step: 1,
  });

  torusKnotFolder.addBinding(oceanParams, "torusKnotP", {
    label: "p",
    min: 1,
    max: 20,
    step: 1,
  });

  torusKnotFolder.addBinding(oceanParams, "torusKnotQ", {
    label: "q",
    min: 1,
    max: 20,
    step: 1,
  });

  envelopeFolder.addBinding(oceanParams, "envelopeSide", {
    label: "visible side",
    options: ENVELOPE_SIDE_OPTIONS,
  });

  folder.addBinding(oceanParams, "waterColor", { label: "water color" });
  folder.addBinding(oceanParams, "sunColor", { label: "sun color" });

  folder.addBinding(oceanParams, "sunElevation", {
    label: "sun elevation",
    min: 0,
    max: 90,
    step: 0.1,
  });

  folder.addBinding(oceanParams, "sunAzimuth", {
    label: "sun azimuth",
    min: -180,
    max: 180,
    step: 0.1,
  });

  folder.addBinding(oceanParams, "distortionScale", {
    label: "distortion",
    min: 0,
    max: 8,
    step: 0.1,
  });

  folder.addBinding(oceanParams, "waveSize", {
    label: "wave size",
    min: 0.1,
    max: 10,
    step: 0.1,
  });

  folder.addBinding(oceanParams, "alpha", {
    min: 0,
    max: 1,
    step: 0.01,
  });

  const sync = () => oceanSystem.sync();
  folder.on("change", sync);
  shapeFolder.on("change", sync);
  flatFolder.on("change", sync);
  noiseFolder.on("change", sync);
  envelopeFolder.on("change", sync);
  torusNoiseFolder.on("change", sync);
  torusKnotFolder.on("change", sync);
}
