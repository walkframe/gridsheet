import type { FC, MutableRefObject } from 'react';
import { createRef, useContext, useEffect, useRef, useState } from 'react';

import type { OptionsType, Props, SheetHandle, StoreHandle } from '../types';
import { Context } from '../store';

import { setStore, updateSheet } from '../store/actions';

import { usePluginContext } from './PluginBase';
import { Sheet } from '@gridsheet/core';

type StoreObserverProps = OptionsType & {
  sheetName?: string;
  sheetRef?: MutableRefObject<SheetHandle | null>;
  storeRef?: MutableRefObject<StoreHandle | null>;
};

export const createSheetRef = () => createRef<SheetHandle | null>();
export const useSheetRef = () => useRef<SheetHandle | null>(null);
export const createStoreRef = () => createRef<StoreHandle | null>();
export const useStoreRef = () => useRef<StoreHandle | null>(null);
export const StoreObserver: FC<StoreObserverProps> = ({
  sheetName,
  sheetHeight,
  sheetWidth,
  sheetRef,
  storeRef,
  editingOnEnter,
  mode,
}) => {
  const { store, dispatch } = useContext(Context);
  const { sheetReactive } = store;
  const sheet = sheetReactive.current;

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

    if (sheetRef) {
      sheetRef.current = {
        sheet,
        apply: (sheet) => {
          dispatch(updateSheet(sheet as Sheet));
        },
      };
    }
    if (storeRef) {
      storeRef.current = {
        store,
        apply: (store) => {
          dispatch(setStore(store));
        },
        dispatch,
      };
    }
  }, [store, sheet, sheetRef, storeRef]);

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
    pluginContext.setApply(() => dispatch);
  }, [store, pluginProvided, pluginContext]);

  return <></>;
};
