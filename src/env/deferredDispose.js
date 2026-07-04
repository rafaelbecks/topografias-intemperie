const pending = [];

export function deferDispose(...items) {
  for (const item of items) {
    if (item?.dispose) pending.push(item);
  }
}

/** Run at the start of a frame so disposals never share a frame with env swaps. */
export function flushDeferredDisposals() {
  if (pending.length === 0) return;
  const batch = pending.splice(0);
  for (const item of batch) item.dispose();
}
