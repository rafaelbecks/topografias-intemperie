/** Surface particle overlay (MeshSurfaceSampler) — Tweakpane-bound and serialized in scene JSON. */
export const particleParams = {
  enabled: false,
  useModelColors: true,
  color: "#c8a0b0",
  luminance: 1,
  count: 150000,
  size: 6.15,
  opacity: 0.85,
};

export const PARTICLE_PARAM_KEYS = [
  "enabled",
  "useModelColors",
  "color",
  "luminance",
  "count",
  "size",
  "opacity",
];

export function clampParticleParams() {
  particleParams.count = Math.max(1000, Math.min(300000, Math.round(particleParams.count)));
  particleParams.luminance = Math.max(0, Math.min(3, particleParams.luminance));
  particleParams.size = Math.max(0.1, Math.min(10, particleParams.size));
  particleParams.opacity = Math.max(0, Math.min(1, particleParams.opacity));
}
