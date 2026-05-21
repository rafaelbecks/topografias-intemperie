/** Toggle Tweakpane visibility with Ctrl+I (Cmd+I on macOS). */
export function setupPaneToggle(pane) {
  let visible = true;

  function setVisible(show) {
    visible = show;
    pane.element.style.display = show ? "" : "none";
  }

  window.addEventListener("keydown", (e) => {
    if (e.key !== "i" && e.key !== "I") return;
    if (!e.ctrlKey && !e.metaKey) return;
    if (e.altKey || e.shiftKey) return;

    e.preventDefault();
    setVisible(!visible);
  });

  return { setVisible, isVisible: () => visible };
}
