import { shallowRef, watch } from 'vue';
import { createBook, RegistryProps, type TransmitProps } from '@gridsheet/preact-core';

export function useBook(registryProps: RegistryProps = {}) {
  const book = createBook(registryProps);
  const ref = shallowRef(book);
  const { registry } = ref.value;

  function transmit(patch?: TransmitProps) {
    Object.assign(registry, patch);
    if (!registry.ready) {
      return;
    }
    requestAnimationFrame(() => (ref.value = { ...ref.value }));
  }
  registry.transmit = transmit;

  // Watch for registryProps changes and apply them to book
  watch(
    () => registryProps,
    (newProps) => transmit(newProps),
    { deep: true },
  );
  return ref;
}
