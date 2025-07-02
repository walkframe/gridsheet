import type { FC, MutableRefObject } from 'react';
import { createRef, useContext, useEffect, useRef, useState } from 'react';

import type { OptionsType, Props, StoreRef } from '../types';
import { Context } from '../store';

import { setStore, updateTable } from '../store/actions';

import { HEADER_HEIGHT, HEADER_WIDTH } from '../constants';
import { usePluginContext } from './PluginBase';

type StoreInitializerProps = OptionsType & {
  sheetName?: string;
  storeRef?: MutableRefObject<StoreRef | null>;
};

export const createStoreRef = () => createRef<StoreRef | null>();
export const useStoreRef = () => useRef<StoreRef | null>(null);
export const StoreObserver: FC<StoreInitializerProps> = ({
  headerHeight = HEADER_HEIGHT,
  headerWidth = HEADER_WIDTH,
  sheetName,
  sheetHeight,
  sheetWidth,
  storeRef,
  editingOnEnter,
  showAddress,
  mode,
  onSave,
}) => {
  const { store, dispatch } = useContext(Context);
  const { table } = store;
  const { wire } = table;

  useEffect(() => {
    if (sheetName && sheetName !== table.sheetName) {
      table.sheetName = sheetName;
      wire.sheetIdsByName[sheetName] = table.sheetId;
      delete wire.sheetIdsByName[table.prevSheetName];
      table.prevSheetName = sheetName;
      //hub.transmit();
    }
  }, [sheetName]);

  useEffect(() => {
    const { wire: hub } = table;
    requestAnimationFrame(() => hub.identifyFormula());
    hub.contextsBySheetId[table.sheetId] = { store, dispatch };
    hub.transmit();

    if (storeRef) {
      storeRef.current = { store, dispatch };
    }
  }, [store]);

  useEffect(() => {
    if (sheetHeight) {
      dispatch(setStore({ sheetHeight }));
    }
  }, [sheetHeight]);
  useEffect(() => {
    if (sheetWidth) {
      dispatch(setStore({ sheetWidth }));
    }
  }, [sheetWidth]);
  useEffect(() => {
    if (headerHeight) {
      dispatch(setStore({ headerHeight }));
    }
  }, [headerHeight]);
  useEffect(() => {
    if (headerWidth) {
      dispatch(setStore({ headerWidth }));
    }
  }, [headerWidth]);
  useEffect(() => {
    if (typeof editingOnEnter !== 'undefined') {
      dispatch(setStore({ editingOnEnter }));
    }
  }, [editingOnEnter]);
  useEffect(() => {
    if (typeof showAddress !== 'undefined') {
      dispatch(setStore({ showAddress }));
    }
  }, [showAddress]);

  useEffect(() => {
    if (mode) {
      dispatch(setStore({ mode }));
    }
  }, [mode]);

  useEffect(() => {
    if (typeof onSave !== 'undefined') {
      dispatch(setStore({ onSave }));
    }
  }, [onSave]);

  const [pluginProvided, pluginContext] = usePluginContext();
  useEffect(() => {
    if (!pluginProvided) {
      return;
    }
    pluginContext.setStore(store);
    pluginContext.setDispatch(() => dispatch);
  }, [store, dispatch]);

  return <></>;
};
