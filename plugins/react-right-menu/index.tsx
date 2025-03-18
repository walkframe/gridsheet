import React from 'react';
import type { ReactNode } from 'react';

import { PluginBase, useInitialPluginContext, usePluginContext, updateTable, StoreType, Dispatcher } from '@gridsheet/react-core';

import { style } from './style';
import { zoneToArea } from '@gridsheet/react-core/lib/structs';

interface Props {
  children: ReactNode;
};

export const RightMenu = ({ children }: Props): JSX.Element => {
  const context = useInitialPluginContext();
  return (
    <div className={`gs-rightmenu-wrapper`} >
      <style>{style}</style>
      <PluginBase context={context}>
        {children}
        <SideMenuItems />
      </PluginBase>
    </div>
  );
};

export const SideMenuItems = () => {
  const [pluginProvided, pluginContext] = usePluginContext();
  if (!pluginProvided) {
    return null;
  }
  const { store, dispatch } = pluginContext;
  if (store == null || dispatch == null) {
    return null;
  }
  return (<div className={`gs-rightmenu-main`} data-mode={store.mode}>
    <div className="gs-rightmenu-items">
      <div className="gs-rightmenu-item">
        <AddRows store={store} dispatch={dispatch} />
      </div>
      <div className="gs-rightmenu-item">
        <AddCols store={store} dispatch={dispatch} />
      </div>
    </div>
  </div>);
}


type ItemProps = {
  store: StoreType;
  dispatch: Dispatcher;
}

export const AddRows = ({store, dispatch}: ItemProps) => {
  const [numRows, setNumRows] = React.useState(1000);
  const [at, setAt] = React.useState<string>("below");
  const [above, setAbove] = React.useState(1);
  const [below, setBelow] = React.useState(store.table.getNumRows());

  const { table, rootRef } = store;

  React.useEffect(() => {
    setBelow(store.table.getNumRows());
  }, [store.table.getNumRows()]);

  React.useEffect(() => {
    if (!store.leftHeaderSelecting) {
      setAbove(1);
      setBelow(store.table.getNumRows());
      return;
    }
    const area = zoneToArea(store.selectingZone);
    setAbove(area.top);
    setBelow(area.bottom);
  }, [store.leftHeaderSelecting, store.selectingZone]);

  const addRows = () => {
    let args = { y: store.table.getNumRows() + 1, baseY: store.table.getNumRows() };
    switch (at) {
      case "above":
        args = { y: above, baseY: above };
        break;
      case "below":
        args = { y: below + 1, baseY: below };
    }
    const newTable = table.addRows({...args, numRows });
    dispatch(updateTable(newTable));
  };

  return (
    <form>
      <div className="gs-rightmenu-header">Rows</div>
      <div className="gs-rightmenu-block">
        <div className="gs-rightmenu-row" style={{gap: 5}}>
          <input 
            className="gs-rightmenu-input"
            style={{width: 60}}
            type="text" 
            value={numRows}
            onChange={(e) => {
              const num = Number(e.target.value);
              if (isNaN(num)) {
                return false;
              }
              setNumRows(num);
            }}
          />
          <button 
            style={{width: 50, padding: '0 5px'}}
            type="button" 
            className="gs-right-menu-btn"
            onClick={addRows}>
            <span>Insert</span>
          </button>
        </div>

        <label className="gs-rightmenu-row">
          <div className="gs-rightmenu-col" style={{width: 65}}>
            <input
              type="radio"
              name="rows"
              checked={at === "above"}
              onChange={() => {setAt("above")}}
            />
            <span>Above</span>
          </div>
          <input
            className="gs-rightmenu-input"
            disabled={at !== "above"}
            value={String(above)}
            min={1}
            onChange={(e) => {
              const num = Number(e.target.value);
              if (isNaN(num)) {
                return false;
              }
              setAbove(num);
            }}
          />
        </label>
        <label className="gs-rightmenu-row">
          <div className="gs-rightmenu-col" style={{width: 65}}>
            <input
              type="radio"
              name="rows"
              checked={at === "below"}
              onChange={() => {setAt("below")}}
            />
            <span>Below</span>
          </div>
          
          <input
            className="gs-rightmenu-input"
            disabled={at !== "below"}  
            value={String(below)}
            max={store.table.getNumRows()}
            onChange={(e) => {
              const num = Number(e.target.value);
              if (isNaN(num)) {
                return false;
              }
              setBelow(num);
            }}
          />
        </label>
      </div>
    </form>
  );
};

export const AddCols = ({store, dispatch}: ItemProps) => {
  const [numCols, setNumCols] = React.useState(store.table.getNumCols());
  const [at, setAt] = React.useState<string>("right");
  const [left, setLeft] = React.useState(1);
  const [right, setRight] = React.useState(store.table.getNumCols());

  const { table } = store;

  React.useEffect(() => {
    setRight(store.table.getNumCols());
  }, [store.table.getNumCols()]);

  React.useEffect(() => {
    if (!store.topHeaderSelecting) {
      setLeft(1);
      setRight(store.table.getNumCols());
      return;
    }
    const area = zoneToArea(store.selectingZone);
    setLeft(area.left);
    setRight(area.right);
  }, [store.topHeaderSelecting, store.selectingZone]);

  const addCols = () => {
    let args = { x: store.table.getNumCols() + 1, baseX: store.table.getNumCols() };
    switch (at) {
      case "left":
        args = { x: left, baseX: left };
        break;
      case "right":
        args = { x: right + 1, baseX: right };
    }
    const newTable = table.addCols({...args, numCols });
    dispatch(updateTable(newTable));
  };

  return (
    <form>
      <div className="gs-rightmenu-header">Columns</div>
      <div className="gs-rightmenu-block">
        <div className="gs-rightmenu-row" style={{gap: 5}}>
          <input 
            className="gs-rightmenu-input"
            style={{width: 60}}
            type="text" 
            value={numCols}
            onChange={(e) => {
              const num = Number(e.target.value);
              if (isNaN(num)) {
                return false;
              }
              setNumCols(num);
            }}
          />
          <button 
            style={{width: 50, padding: '0 5px'}}
            type="button" 
            className="gs-right-menu-btn"
            onClick={addCols}>
            <span>Insert</span>
          </button>
        </div>
        <label className="gs-rightmenu-row">
          <div className="gs-rightmenu-col">
            <input
              type="radio"
              name="rows"
              checked={at === "left"}
              onChange={() => {setAt("left")}}
            />
            <span>Left</span>
          </div>
          <input
            className="gs-rightmenu-input gs-input-right"
            disabled={at !== "left"}
            value={String(left)}
            min={1}
            onChange={(e) => {
              const num = Number(e.target.value);
              if (isNaN(num)) {
                return false;
              }
              setLeft(num);
            }}
          />
        </label>
        <label className="gs-rightmenu-row">
          <div className="gs-rightmenu-col">
            <input
              type="radio"
              name="rows"
              checked={at === "right"}
              onChange={() => {setAt("right")}}
            />
            <span>Right</span>
          </div>
          
          <input
            className="gs-rightmenu-input"
            disabled={at !== "right"}  
            value={String(right)}
            max={store.table.getNumCols()}
            onChange={(e) => {
              const num = Number(e.target.value);
              if (isNaN(num)) {
                return false;
              }
              setRight(num);
            }}
          />
        </label>
      </div>

    </form>
  );
};



