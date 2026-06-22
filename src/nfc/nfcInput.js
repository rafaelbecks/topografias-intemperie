/** WebSocket address broadcast by ardeidae when an NFC card is tapped. */
export const NFC_CARD_ADDRESS = "/nfc/card";

const DEFAULT_DEBOUNCE_MS = 2500;

export function setupNfcInput(
  sensorClient,
  { sceneOrder, onSceneSelect, debounceMs = DEFAULT_DEBOUNCE_MS } = {}
) {
  let lastCard = 0;
  let lastAt = 0;

  sensorClient.onMessage = ({ address, value }) => {
    if (address !== NFC_CARD_ADDRESS) return;

    const card = Number(value?.[0]);
    if (!Number.isFinite(card) || card < 1) return;

    const now = performance.now();
    if (card === lastCard && now - lastAt < debounceMs) return;
    lastCard = card;
    lastAt = now;

    console.info("[nfc] card", card);

    if (card <= sceneOrder.length) {
      const scene = sceneOrder[card - 1];
      console.info("[nfc] scene", scene, `(key ${card})`);
      onSceneSelect?.(scene);
    } else {
      console.warn("[nfc] no scene for card", card);
    }
  };
}
