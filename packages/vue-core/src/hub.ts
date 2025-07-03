import { shallowRef, watch } from 'vue';
import { createHub, WireProps, type TransmitProps } from '@gridsheet/preact-core';

export function useHub(wireProps: WireProps = {}) {
  const hub = createHub(wireProps);
  const ref = shallowRef(hub);
  const { wire } = ref.value;

  function transmit(patch?: TransmitProps) {
    Object.assign(wire, patch);
    if (!wire.ready) {
      return;
    }
    requestAnimationFrame(() => (ref.value = { ...ref.value }));
  }
  wire.transmit = transmit;

  // Watch for hubProps changes and apply them to hub
  watch(
    () => wireProps,
    (newProps) => transmit(newProps),
    { deep: true },
  );
  return ref;
}
