import { shallowRef } from 'vue';
import { createHubReactive, DEFAULT_HISTORY_LIMIT, type HubPatchType } from '@gridsheet/preact-core';

export function useHubReactive(historyLimit = DEFAULT_HISTORY_LIMIT) {
  const hubReactive = createHubReactive(historyLimit);
  const ref = shallowRef(hubReactive);
  const { hub } = ref.value;

  function applyPatch(patch?: HubPatchType) {
    Object.assign(hub, { ...patch });
    if (!hub.ready) {
      return;
    }
    requestAnimationFrame(() => (ref.value = { ...ref.value }));
  }
  hub.reflect = applyPatch;
  return ref;
}
