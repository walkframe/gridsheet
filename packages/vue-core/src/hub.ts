import { shallowRef, watch } from 'vue';
import { createBook, BindingProps, type TransmitProps } from '@gridsheet/preact-core';

export function useBook(wireProps: BindingProps = {}) {
  const book = createBook(wireProps);
  const ref = shallowRef(book);
  const { binding } = ref.value;

  function transmit(patch?: TransmitProps) {
    Object.assign(binding, patch);
    if (!binding.ready) {
      return;
    }
    requestAnimationFrame(() => (ref.value = { ...ref.value }));
  }
  binding.transmit = transmit;

  // Watch for hubProps changes and apply them to book
  watch(
    () => wireProps,
    (newProps) => transmit(newProps),
    { deep: true },
  );
  return ref;
}
