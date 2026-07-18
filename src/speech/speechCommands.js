const EASTER_EGG_COMMANDS = [
  {
    id: "lionza",
    match(text) {
      const normalized = normalize(text);
      if (normalized.includes("yo te invoco maria lionza")) return true;
      return (
        textContainsWord(text, "lionsa") ||
        textContainsWord(text, "leonsa") ||
        textContainsWord(text, "alianza") ||
        textContainsWord(text, "leon") ||
        textContainsWord(text, "maria")
      );
    },
  },
];

const COMMAND_GROUPS = [
  {
    id: "wireframe",
    words: ["cuerda", "tejido", "nervio"],
  },
  {
    id: "particles",
    words: ["fragmento", "sedimento", "hambre", "verdor"],
  },
  {
    id: "ditherDelirio",
    words: ["delirio", "muerto"],
  },
  {
    id: "dither",
    words: ["vertico", "vertigo", "extasis", "ecstasis"],
  },
  {
    id: "oceanManglar",
    words: ["manglar", "corales", "coral"],
  },
  {
    id: "oceanCienaga",
    words: ["cienaga", "huerto"],
  },
  {
    id: "oceanHumedal",
    words: ["humedal", "delgada"],
  },
  {
    id: "oceanCueva",
    words: ["cueva"],
  },
];

const DEFAULT_COMMAND_COOLDOWN_MS = 3000;

function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function textContainsWord(text, word) {
  const normalized = normalize(text);
  const target = normalize(word);
  const tokens = normalized.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return tokens.some((token) => token === target || token.startsWith(target));
}

/** Returns command ids detected in a finalized transcript (at most once per group). */
export function matchSpeechCommands(text) {
  const matched = [];
  for (const group of COMMAND_GROUPS) {
    if (group.words.some((word) => textContainsWord(text, word))) {
      matched.push(group.id);
    }
  }
  for (const egg of EASTER_EGG_COMMANDS) {
    if (egg.match(text)) matched.push(egg.id);
  }
  return matched;
}

export function createSpeechCommandHandler(
  {
    toggleWireframe,
    toggleParticles,
    enableDelirioDither,
    toggleDither,
    setOceanManglar,
    setOceanCienaga,
    setOceanHumedal,
    setOceanCueva,
    loadLionzaModel,
  },
  { getCooldownMs = () => DEFAULT_COMMAND_COOLDOWN_MS } = {}
) {
  const handlers = {
    wireframe: toggleWireframe,
    particles: toggleParticles,
    ditherDelirio: enableDelirioDither,
    dither: toggleDither,
    oceanManglar: setOceanManglar,
    oceanCienaga: setOceanCienaga,
    oceanHumedal: setOceanHumedal,
    oceanCueva: setOceanCueva,
    lionza: loadLionzaModel,
  };

  const lastFiredAt = new Map();
  let interimTriggeredIds = new Set();
  let lastFinalNormalized = "";
  let lastFinalAt = 0;

  function canFire(id) {
    const cooldown = getCooldownMs();
    const last = lastFiredAt.get(id) ?? 0;
    return Date.now() - last >= cooldown;
  }

  function markFired(ids) {
    const now = Date.now();
    for (const id of ids) lastFiredAt.set(id, now);
  }

  function fire(ids) {
    for (const id of ids) handlers[id]?.();
  }

  function dispatchFromText(text, { skipIds = new Set() } = {}) {
    const ids = matchSpeechCommands(text).filter((id) => canFire(id) && !skipIds.has(id));
    if (!ids.length) return;
    markFired(ids);
    fire(ids);
  }

  return {
    handleInterimText(text) {
      const ids = matchSpeechCommands(text).filter((id) => canFire(id));
      if (!ids.length) return;
      markFired(ids);
      for (const id of ids) interimTriggeredIds.add(id);
      fire(ids);
    },

    handleFinalText(text) {
      const normalized = normalize(text);
      const cooldown = getCooldownMs();
      const now = Date.now();

      if (normalized && normalized === lastFinalNormalized && now - lastFinalAt < cooldown) {
        interimTriggeredIds.clear();
        return;
      }

      if (normalized) {
        lastFinalNormalized = normalized;
        lastFinalAt = now;
      }

      dispatchFromText(text, { skipIds: interimTriggeredIds });
      interimTriggeredIds.clear();
    },
  };
}
