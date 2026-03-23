import type { FC, MutableRefObject } from 'react';
import { createRef, useContext, useEffect, useRef, useState } from 'react';

import type { OptionsType, Props, Connector } from '../types';
import { Context } from '../store';

import { setStore, updateSheet } from '../store/actions';

import { usePluginContext } from './PluginBase';
import { Sheet } from '../lib/sheet';

type StoreObserverProps = OptionsType & {
  sheetName?: string;
  connector?: MutableRefObject<Connector | null>;
};

export const createConnector = () => createRef<Connector | null>();
export const useConnector = () => useRef<Connector | null>(null);
export const StoreObserver: FC<StoreObserverProps> = ({
  sheetName,
  sheetHeight,
  sheetWidth,
  connector,
  editingOnEnter,
  mode,
}) => {
  const { store, dispatch } = useContext(Context);
  const { sheetReactive: sheetRef } = store;
  const sheet = sheetRef.current;

  useEffect(() => {
    if (!sheet) {
      return;
    }
    if (sheetName && sheetName !== sheet.name) {
      sheet.name = sheetName;
      sheet.registry.sheetIdsByName[sheetName] = sheet.id;
      delete sheet.registry.sheetIdsByName[sheet.prevName];
      sheet.prevName = sheetName;
      //book.transmit();
    }
  }, [sheetName]);

  useEffect(() => {
    if (!sheet) {
      return;
    }
    const { registry } = sheet;
    requestAnimationFrame(() => registry.boot());
    registry.contextsBySheetId[sheet.id] = { store, dispatch };
    registry.transmit();

    if (connector) {
      connector.current = {
        sheetManager: {
          sheet,
          sync: (sheet) => {
            dispatch(updateSheet(sheet as Sheet));
          },
        },
        storeManager: {
          store,
          sync: (store) => {
            dispatch(setStore(store));
          },
          dispatch,
        },
      };
    }
  }, [store, sheet, connector]);

  useEffect(() => {
    if (sheetHeight) {
      dispatch(setStore({ sheetHeight }));
    }
  }, [sheetHeight, dispatch]);
  useEffect(() => {
    if (sheetWidth) {
      dispatch(setStore({ sheetWidth }));
    }
  }, [sheetWidth]);
  useEffect(() => {
    if (typeof editingOnEnter !== 'undefined') {
      dispatch(setStore({ editingOnEnter }));
    }
  }, [editingOnEnter]);
  useEffect(() => {
    if (mode) {
      dispatch(setStore({ mode }));
    }
  }, [mode]);

  const [pluginProvided, pluginContext] = usePluginContext();
  useEffect(() => {
    if (!pluginProvided) {
      return;
    }
    pluginContext.setStore(store);
    pluginContext.setSync(() => dispatch);
  }, [store, pluginProvided, pluginContext]);

  return <></>;
};
