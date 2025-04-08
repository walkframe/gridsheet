
import { createContext, ReactNode } from 'react';
import { useContext, useEffect, useState, useRef, useReducer } from 'react';

import { StoreType } from '../types';
import { Dispatcher } from '../store';

export type PluginContextType = {
  provided: boolean;
  store?: StoreType;
  dispatch?: Dispatcher;
  setStore: (store: StoreType) => void;
  setDispatch: (dispatch: Dispatcher) => void;
};

export const PluginContext = createContext({} as PluginContextType);

export function useInitialPluginContext(): PluginContextType {
  const [store, setStore] = useState<StoreType | undefined>(undefined);
  const [dispatch, setDispatch] = useState<Dispatcher>();
  return {
    provided: true,
    store,
    dispatch,
    setStore,
    setDispatch,
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
  const dispatch = useContext(PluginContext);
  if (!dispatch) {
    return undefined;
  }
  return dispatch;
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
