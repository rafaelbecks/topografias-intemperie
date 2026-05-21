const LABELS = {
  model: "Loading model",
  environment: "Loading environment",
  memory: "Loading memory",
};

/**
 * Centered loading overlay with stacked tasks (model / environment / memory).
 */
export function createLoading() {
  const root = document.getElementById("loading");
  const labelEl = root?.querySelector(".loading-label");
  const barEl = root?.querySelector(".loading-bar");
  const trackEl = root?.querySelector(".loading-track");

  const stack = [];
  let progress = null;

  function currentType() {
    return stack.length ? stack[stack.length - 1] : null;
  }

  function render() {
    if (!root || !labelEl || !barEl) return;

    const type = currentType();
    if (!type) {
      root.hidden = true;
      return;
    }

    root.hidden = false;
    labelEl.textContent = LABELS[type] ?? "Loading";

    if (progress == null || !Number.isFinite(progress)) {
      barEl.classList.add("loading-bar--indeterminate");
      barEl.style.width = "";
      trackEl?.setAttribute("aria-valuenow", "");
    } else {
      barEl.classList.remove("loading-bar--indeterminate");
      const pct = Math.max(0, Math.min(1, progress)) * 100;
      barEl.style.width = `${pct}%`;
      trackEl?.setAttribute("aria-valuenow", String(Math.round(pct)));
    }
  }

  function push(type) {
    stack.push(type);
    progress = null;
    render();
  }

  function pop(type) {
    const i = stack.lastIndexOf(type);
    if (i !== -1) stack.splice(i, 1);
    progress = null;
    render();
  }

  return {
    begin(type) {
      push(type);
    },
    end(type) {
      pop(type);
    },
    setProgress(value) {
      if (stack.length === 0) return;
      progress = value;
      render();
    },
    async run(type, fn) {
      push(type);
      try {
        return await fn({
          setProgress: (v) => {
            progress = v;
            render();
          },
        });
      } finally {
        pop(type);
      }
    },
  };
}
