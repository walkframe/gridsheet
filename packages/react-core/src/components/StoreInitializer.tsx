import type { FC } from 'react';
import { useContext, useEffect } from 'react';

import type { Props } from '../types';
import { Context } from '../store';

import {
  setSheetHeight,
  setSheetWidth,
  setHeaderHeight,
  setHeaderWidth,
  setEditingOnEnter,
  setShowAddress,
  setOnSave,
  setMode,
} from '../store/actions';

import { HEADER_HEIGHT, HEADER_WIDTH } from '../constants';
import { usePluginContext } from './PluginBase';

export const StoreInitializer: FC<Props> = ({ options = {} }) => {
  const {
    headerHeight = HEADER_HEIGHT,
    headerWidth = HEADER_WIDTH,
    sheetHeight,
    sheetWidth,
    editingOnEnter,
    showAddress,
    mode,
    onSave,
  } = options;

  const { store, dispatch } = useContext(Context);
  const { table } = store;

  useEffect(() => {
    table.conn.tablesBySheetId[table.sheetId] = table;
  }, [table]);

  useEffect(() => {
    if (sheetHeight) {
      dispatch(setSheetHeight(sheetHeight));
    }
  }, [sheetHeight]);
  useEffect(() => {
    if (sheetWidth) {
      dispatch(setSheetWidth(sheetWidth));
    }
  }, [sheetWidth]);
  useEffect(() => {
    if (headerHeight) {
      dispatch(setHeaderHeight(headerHeight));
    }
  }, [headerHeight]);
  useEffect(() => {
    if (headerWidth) {
      dispatch(setHeaderWidth(headerWidth));
    }
  }, [headerWidth]);
  useEffect(() => {
    if (typeof editingOnEnter !== 'undefined') {
      dispatch(setEditingOnEnter(editingOnEnter));
    }
  }, [editingOnEnter]);
  useEffect(() => {
    if (typeof showAddress !== 'undefined') {
      dispatch(setShowAddress(showAddress));
    }
  }, [showAddress]);

  useEffect(() => {
    if (mode) {
      dispatch(setMode(mode));
    }
  }, [mode]);

  useEffect(() => {
    if (typeof onSave !== 'undefined') {
      dispatch(setOnSave(onSave));
    }
  }, [onSave]);

  useEffect(() => {
    if (table.isInitialized) {
      return;
    }
    table.absolutizeFormula();
  }, [table.conn.head]);

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
