/** Poem lines selectable in the Text tab. */
export const TEXT_LINES = [
  {
    id: "front",
    label: "topografías de la intemperie",
    text: "topografías\nde  la\nintemperie",
  },
  { id: "delirio", label: "Ya el delirio no me solicita.", text: "Ya el delirio no me solicita." },
  {
    id: "tension",
    label: "me llamo tensión, debilidad…",
    text: "me llamo tensión, debilidad, silencio, yerro.",
  },
  {
    id: "arrastro",
    label: "me arrastro, toco hierba…",
    text: "me arrastro, toco hierba, me hago suelo.",
  },
  { id: "inefable", label: "Lo inefable no me quiere.", text: "lo inefable no me quiere." },
  {
    id: "ventanas",
    label: "las ventanas dicen vivir.",
    text: "las ventanas dicen vivir.",
  },
  {
    id: "cuerda",
    label: "soy una cuerda que se abraza…",
    text: "soy una cuerda que se abraza a la última proximidad.",
  },
  {
    id: "vibrante",
    label: "vibrante querer, vibrante delito…",
    text: "vibrante querer, vibrante delito, vibrante desamor.",
  },
  {
    id: "disension",
    label: "ducho en disensión, en rotura…",
    text: "ducho en disensión, en rotura, en desvivir, persisto.",
  },
  {
    id: "cienaga",
    label: "soy la ciénaga sin fulgor…",
    text: "soy la ciénaga sin fulgor, el exabrupto, el manto del loco.",
  },
];

export const TEXT_LINE_OPTIONS = Object.fromEntries(
  TEXT_LINES.map((line) => [line.label, line.id])
);

export function getTextById(id) {
  return TEXT_LINES.find((line) => line.id === id)?.text ?? TEXT_LINES[0].text;
}

export const DEFAULT_PAGE_TITLE = "topografías de la intemperie";

export function syncPageTitle(lineId) {
  if (lineId === "front") {
    document.title = DEFAULT_PAGE_TITLE;
    return;
  }
  document.title = getTextById(lineId) || DEFAULT_PAGE_TITLE;
}
