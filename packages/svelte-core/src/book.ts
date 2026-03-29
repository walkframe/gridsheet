import { writable } from 'svelte/store';
import { createBook, updateSheet, type BookType, type RegistryProps, type TransmitProps } from '@gridsheet/preact-core';

export function useBook(props: RegistryProps = {}) {
  const book = createBook(props);
  const store = writable<BookType>(book);
  const { registry } = book;

  registry.updateSheet = updateSheet;
  registry.transmit = (patch?: TransmitProps) => {
    Object.assign(registry, patch);
    if (!registry.ready) {
      return;
    }
    requestAnimationFrame(() => store.set({ registry }));
  };

  return store;
}
