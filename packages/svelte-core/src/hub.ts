import { writable } from 'svelte/store';
import { createHub, WireProps, type TransmitProps } from '@gridsheet/preact-core';

export function useHub(wireProps: WireProps = {}) {
  const hub = createHub(wireProps);
  const store = writable(hub);
  const { wire } = hub;

  function transmit(patch?: TransmitProps) {
    Object.assign(wire, patch);
    if (!wire.ready) {
      return;
    }
    store.set({ ...hub });
  }
  wire.transmit = transmit;
  return store;
}
