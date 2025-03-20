import React from 'react';

import { Props } from '../types';

import { Context } from '../store';
import {
  setSheetHeight,
  setSheetWidth,
  setHeaderHeight,
  setHeaderWidth,
  setEditingOnEnter,
  setShowAddress,
  setOnSave,
  initializeTable,
  setMode,
} from '../store/actions';

import { HEADER_HEIGHT, HEADER_WIDTH } from '../constants';
import { useSheetContext } from './SheetProvider';
import { usePluginContext } from './PluginBase';

export const StoreInitializer: React.FC<Props> = ({ options = {} }) => {
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

  const [sheetProvided, sheetContext] = useSheetContext();
  const { store, dispatch } = React.useContext(Context);

  React.useEffect(() => {
    const { table, tableInitialized } = store;
    if (table == null || tableInitialized) {
      return;
    }

    if (!sheetProvided || sheetContext.mounted) {
      table.absolutizeFormula();
      dispatch(initializeTable(table.shallowCopy()));
    }
  }, [sheetContext.mounted]);

  React.useEffect(() => {
    if (sheetHeight) {
      dispatch(setSheetHeight(sheetHeight));
    }
  }, [sheetHeight]);
  React.useEffect(() => {
    if (sheetWidth) {
      dispatch(setSheetWidth(sheetWidth));
    }
  }, [sheetWidth]);
  React.useEffect(() => {
    if (headerHeight) {
      dispatch(setHeaderHeight(headerHeight));
    }
  }, [headerHeight]);
  React.useEffect(() => {
    if (headerWidth) {
      dispatch(setHeaderWidth(headerWidth));
    }
  }, [headerWidth]);
  React.useEffect(() => {
    if (typeof editingOnEnter !== 'undefined') {
      dispatch(setEditingOnEnter(editingOnEnter));
    }
  }, [editingOnEnter]);
  React.useEffect(() => {
    if (typeof showAddress !== 'undefined') {
      dispatch(setShowAddress(showAddress));
    }
  }, [showAddress]);

  React.useEffect(() => {
    if (mode) {
      dispatch(setMode(mode));
    }
  }, [mode]);

  React.useEffect(() => {
    if (typeof onSave !== 'undefined') {
      dispatch(setOnSave(onSave));
    }
  }, [onSave]);

  const [pluginProvided, pluginContext] = usePluginContext();
  React.useEffect(() => {
    if (!pluginProvided) {
      return;
    }
    pluginContext.setStore(store);
    pluginContext.setDispatch(() => dispatch);
  }, [store, dispatch]);

  return <></>;
};
