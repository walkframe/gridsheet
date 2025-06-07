import type { FC } from 'react';
import { useContext, useEffect, useState } from 'react';

import type { OptionsType, Props } from '../types';
import { Context } from '../store';

import {
  setStore,
  updateTable,
} from '../store/actions';

import { HEADER_HEIGHT, HEADER_WIDTH } from '../constants';
import { usePluginContext } from './PluginBase';

type StoreInitializerProps = OptionsType & { 
  sheetName?: string;
};

export const StoreObserver: FC<StoreInitializerProps> = ({
  headerHeight = HEADER_HEIGHT,
  headerWidth = HEADER_WIDTH,
  sheetName,
  sheetHeight,
  sheetWidth,
  editingOnEnter,
  showAddress,
  mode,
  policies,
  onSave,
}) => {
  const { store, dispatch } = useContext(Context);
  const { table } = store;
  const { hub } = table;

  useEffect(() => {
    if (sheetName && sheetName !== table.sheetName) {
      table.sheetName = sheetName;
      hub.sheetIdsByName[sheetName] = table.sheetId;
      delete hub.sheetIdsByName[table.prevSheetName];
      table.prevSheetName = sheetName;
      hub.reflect();
    }
  }, [sheetName]);

  useEffect(() => {
    const { hub } = table;
    requestAnimationFrame(() => hub.identifyFormula());
    hub.contextsBySheetId[table.sheetId] = { store, dispatch };
    hub.reflect();
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
    table.updatePolicies(policies);
    dispatch(updateTable(table.clone()))
  }, [policies])

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
