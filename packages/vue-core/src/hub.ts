import { shallowRef } from 'vue';
import { createHubReactive } from '@gridsheet/preact-core';

export function useHubReactive(historyLimit = 100) {
  const hubReactive = createHubReactive(historyLimit)
  const ref = shallowRef(hubReactive);
  const { hub } = ref.value;

  function applyPatch(patch?: any) {
    Object.assign(hub, {...patch});
    if (!hub.ready) {
      return;
    }
    requestAnimationFrame(() => ref.value = { ...ref.value });
  }
  hub.reflect = applyPatch;
  return ref;
}
