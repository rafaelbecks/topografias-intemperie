/** Front page typography, background, and LFOs — adjust values here. */

/** Web paths (use .jpg; HEIC originals in /background need conversion for browsers). */
export const FRONT_PAGE_BACKGROUNDS = {
  BARLOPATIO: "background/BARLOVPATIO.png",
  CORTINA: "background/cortina.png",
};

export const frontPageConfig = {
  background: {
    image: FRONT_PAGE_BACKGROUNDS.BARLOPATIO,
    size: "contain",
    position: "center",
    repeat: "no-repeat",
  },
  lfo: {
    rate: 0.12,
    min: 10,
    max: 130,
  },
  rotationLfo: {
    rate: 0.0091,
    min: -180,
    max: 180,
  },
  typography: {
    lines: ["topo", "grafías", "de la", "intem", "perie"],
    fontSize: 300,
    letterSpacing: -0.07,
    strokeWidth: 3,
    strokeColor: "#fff",
  }
};
