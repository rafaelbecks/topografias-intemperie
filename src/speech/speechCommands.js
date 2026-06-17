const COMMAND_GROUPS = [
  {
    id: "wireframe",
    words: ["cuerda", "tejido"],
  },
  {
    id: "particles",
    words: ["fragmento", "sedimento"],
  },
  {
    id: "dither",
    words: ["delirio", "vertico", "vertigo", "extasis", "ecstasis"],
  },
];

function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Returns command ids detected in a finalized transcript (at most once per group). */
export function matchSpeechCommands(text) {
  const tokens = new Set(
    normalize(text)
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean)
  );

  const matched = [];
  for (const group of COMMAND_GROUPS) {
    if (group.words.some((word) => tokens.has(normalize(word)))) {
      matched.push(group.id);
    }
  }
  return matched;
}

export function createSpeechCommandHandler({ toggleWireframe, toggleParticles, toggleDither }) {
  const handlers = {
    wireframe: toggleWireframe,
    particles: toggleParticles,
    dither: toggleDither,
  };

  return {
    handleFinalText(text) {
      for (const id of matchSpeechCommands(text)) {
        handlers[id]?.();
      }
    },
  };
}
