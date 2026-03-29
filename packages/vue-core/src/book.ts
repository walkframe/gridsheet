import { shallowRef } from 'vue';
import { createBook, updateSheet, type BookType, type RegistryProps, type TransmitProps } from '@gridsheet/preact-core';

export function useBook(props: RegistryProps = {}) {
  const book = createBook(props);
  const ref = shallowRef<BookType>(book);
  const { registry } = ref.value;

  registry.updateSheet = updateSheet;
  registry.transmit = (patch?: TransmitProps) => {
    Object.assign(registry, patch);
    if (!registry.ready) {
      return;
    }
    requestAnimationFrame(() => (ref.value = { registry }));
  };

  return ref;
}
