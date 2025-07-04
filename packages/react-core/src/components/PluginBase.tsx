import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

import type { StoreType } from '../types';
import type { Dispatcher } from '../store';

export type PluginContextType = {
  provided: boolean;
  store?: StoreType;
  sync?: Dispatcher;
  setStore: (store: StoreType) => void;
  setSync: (sync: Dispatcher) => void;
};

export const PluginContext = createContext({} as PluginContextType);

export function useInitialPluginContext(): PluginContextType {
  const [store, setStore] = useState<StoreType | undefined>(undefined);
  const [sync, setSync] = useState<Dispatcher>();
  return {
    provided: true,
    store,
    sync,
    setStore,
    setSync,
  };
}

export function usePluginContext(): [boolean, PluginContextType] {
  const ctx = useContext(PluginContext);
  if (ctx?.provided == null) {
    return [false, ctx];
  }
  return [true, ctx];
}

export function usePluginDispatch() {
  const sync = useContext(PluginContext);
  if (!sync) {
    return undefined;
  }
  return sync;
}

type Props = {
  children: ReactNode;
  context: PluginContextType;
};

export function PluginBase({ children, context }: Props) {
  const [provided] = usePluginContext();
  if (provided) {
    return <>{children}</>;
  }
  return <PluginContext.Provider value={context}>{children}</PluginContext.Provider>;
}
