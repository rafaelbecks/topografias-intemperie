/** Registry of available spatial audio files under ./audio/ */

export const ENV_SOUNDS = {
  lanzarote: {
    label: "Lanzarote 1",
    file: "Lanzarote 1.wav",
  },
  tigre: {
    label: "Tigre",
    file: "TIGRE.wav",
  },
  intemperie: {
    label: "Intemperie",
    file: "intemperie.wav",
  },
};

export const OBJECT_SOUNDS = {
  antes_piano: {
    label: "Antes era un piano",
    file: "antes era un piano.wav",
  },
  campana_bogotana: {
    label: "Campana bogotana",
    file: "campana bogotana.wav",
  },
  eterofono: {
    label: "Eterófono",
    file: "eterófono.wav",
  },
  candelaria: {
    label: "La Candelaria Bogotá",
    file: "la Candelaria Bogotá.wav",
  },
  pata_perro: {
    label: "Pata de perro",
    file: "pata de perro.wav",
  },
  piano_resonancia: {
    label: "Piano resonancia",
    file: "piano resonancia.wav",
  },
  renacuajos: {
    label: "Renacuajos",
    file: "renacuajos.wav",
  },
  tunnelbanna: {
    label: "Tunnelbanna",
    file: "tunnelbanna.wav",
  },
};

export const DEFAULT_ENV_SOUND = "lluvia_bogota";
export const DEFAULT_OBJECT_SOUND = "campana_bogotana";

export function getSoundOptions(registry) {
  return Object.fromEntries(
    Object.entries(registry).map(([id, { label }]) => [label, id])
  );
}

export function getAudioPath(category, file) {
  return `./audio/${category}/${encodeURI(file)}`;
}

export function getEnvPath(id) {
  const entry = ENV_SOUNDS[id];
  if (!entry) return null;
  return getAudioPath("env", entry.file);
}

export function getObjectPath(id) {
  const entry = OBJECT_SOUNDS[id];
  if (!entry) return null;
  return getAudioPath("object", entry.file);
}
