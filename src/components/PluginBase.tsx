import React from 'react';

import { StoreType } from '../types';
import { Dispatcher } from '../store';

export type PluginContextType = {
  provided: boolean;
  store?: StoreType;
  dispatch?: Dispatcher;
  setStore: (store: StoreType) => void;
  setDispatch: (dispatch: Dispatcher) => void;
};

export const PluginContext = React.createContext({} as PluginContextType);

export function useInitialPluginContext(): PluginContextType {
  const [store, setStore] = React.useState<StoreType | undefined>(undefined);
  const [dispatch, setDispatch] = React.useState<Dispatcher>();
  return {
    provided: true,
    store,
    dispatch,
    setStore,
    setDispatch,
  };
}

export function usePluginContext(): [boolean, PluginContextType] {
  const ctx = React.useContext(PluginContext);
  if (ctx?.provided == null) {
    return [false, ctx];
  }
  return [true, ctx];
}

export function usePluginDispatch() {
  const dispatch = React.useContext(PluginContext);
  if (!dispatch) {
    return undefined;
  }
  return dispatch;
}

type Props = {
  children: React.ReactNode;
  context: PluginContextType;
};

export function PluginBase({ children, context }: Props) {
  return <PluginContext.Provider value={context}>{children}</PluginContext.Provider>;
}
