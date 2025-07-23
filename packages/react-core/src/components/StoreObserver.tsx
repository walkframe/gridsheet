import type { FC, MutableRefObject } from 'react';
import { createRef, useContext, useEffect, useRef, useState } from 'react';

import type { OptionsType, Props, Connector } from '../types';
import { Context } from '../store';

import { setStore, updateTable } from '../store/actions';

import { usePluginContext } from './PluginBase';
import { Table } from '../lib/table';

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
  showAddress,
  mode,
}) => {
  const { store, dispatch } = useContext(Context);
  const { tableReactive: tableRef } = store;
  const table = tableRef.current;

  useEffect(() => {
    if (!table) {
      return;
    }
    if (sheetName && sheetName !== table.sheetName) {
      table.sheetName = sheetName;
      table.wire.sheetIdsByName[sheetName] = table.sheetId;
      delete table.wire.sheetIdsByName[table.prevSheetName];
      table.prevSheetName = sheetName;
      //hub.transmit();
    }
  }, [sheetName]);

  useEffect(() => {
    if (!table) {
      return;
    }
    const { wire } = table;
    requestAnimationFrame(() => wire.identifyFormula());
    wire.contextsBySheetId[table.sheetId] = { store, dispatch };
    wire.transmit();

    if (connector) {
      connector.current = {
        tableManager: {
          table,
          sync: (table) => {
            dispatch(updateTable(table as Table));
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
  }, [store, table, connector]);

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
    if (typeof showAddress !== 'undefined') {
      dispatch(setStore({ showAddress }));
    }
  }, [showAddress]);

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
