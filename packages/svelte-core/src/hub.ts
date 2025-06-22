import { writable } from 'svelte/store';
import { createHubReactive, DEFAULT_HISTORY_LIMIT, type HubPatchType } from '@gridsheet/preact-core';

export function useHubReactive(historyLimit = DEFAULT_HISTORY_LIMIT) {
  const hubReactive = createHubReactive(historyLimit);
  const store = writable(hubReactive);
  const { hub } = hubReactive;

  function applyPatch(patch?: HubPatchType) {
    Object.assign(hub, patch);
    if (!hub.ready) {
      return;
    }
    store.set({ ...hubReactive });
  }
  hub.reflect = applyPatch;
  return store;
}
