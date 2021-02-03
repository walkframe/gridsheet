import React from "react";
import { useDispatch, useSelector } from 'react-redux';

import { n2a } from "../api/converters";
import { clip } from "../api/clipboard";
import { Renderer as DefaultRenderer } from "../renderers/core";
import { Parser as DefaultParser } from "../parsers/core";


import {
  InsideState,
  blur,
  clear,
  escape,
  choose, reChoose,
  select, drag,
  setEditingCell,
  undo, redo,
  arrow, walk, write,
  copy, cut, paste,
  addRows, removeRows,
  addCols, removeCols,
} from "../store/inside";
import {
  OutsideState,
  setNumRows,
  setNumCols,
  setContextMenuPosition,
} from "../store/outside"
import {
  ContextMenuLayout,
} from "./styles/ContextMenuLayout";
import {
  zoneShape,
  zoneToArea,
} from "../api/arrays";

import {
  AreaType,
  CellOptionType,
} from "../types";

import { RootState } from "../store";

type Props = {
  clipboardRef: React.RefObject<HTMLTextAreaElement>;
};

export const ContextMenu: React.FC<Props> = ({ clipboardRef }) => {
  const dispatch = useDispatch();

  const {
    renderers,
    parsers,
    onSave,
    numRows,
    numCols,
    contextMenuPosition,
  } = useSelector<RootState, OutsideState>(
      state => state["outside"]);

  const {
    matrix,
    cellsOption,
    copyingZone,
    cutting,
    choosing,
    selectingZone,
    horizontalHeadersSelecting,
    verticalHeadersSelecting,
  } = useSelector<RootState, InsideState>(state => state["inside"]);

  const [y, x] = choosing;
  let [selectingTop, selectingLeft, selectingBottom, selectingRight] = zoneToArea(selectingZone);
  if (selectingTop === -1) {
    [selectingTop, selectingLeft, selectingBottom, selectingRight] = [y, x, y, x];
  }
  const rowId = `${ y + 1 }`;
  const colId = n2a(x + 1);
  const cellId = `${colId}${rowId}`;

  const [height, width] = zoneShape(selectingZone);

  const defaultOption: CellOptionType = cellsOption.default || {};
  const rowOption: CellOptionType = cellsOption[rowId] || {};
  const colOption: CellOptionType = cellsOption[colId] || {};
  const cellOption: CellOptionType = cellsOption[cellId] || {};

  const rendererKey = cellOption.renderer || colOption.renderer || rowOption.renderer || defaultOption.renderer;
  const parserKey = cellOption.parser || colOption.parser || rowOption.parser || defaultOption.parser;

  const renderer = renderers[rendererKey || ""] || new DefaultRenderer();
  const parser = parsers[parserKey || ""] || new DefaultParser();

  const [top, left] = contextMenuPosition;
  if (top === -1) {
    return null;
  }

  return (<ContextMenuLayout
    style={{
      top,
      left,
    }}
  >
    <ul>
      <li onClick={(e) => {
        const area = clip(selectingZone, choosing, matrix, clipboardRef, renderer);
        dispatch(cut(area));
        dispatch(setContextMenuPosition([-1, -1]));
      }}>
        <div className="name">Cut</div>
        <div className="shortcut"><span className="underline">X</span></div>
      </li>
      <li onClick={(e) => {
        const area = clip(selectingZone, choosing, matrix, clipboardRef, renderer);
        dispatch(copy(area));
        dispatch(setContextMenuPosition([-1, -1]));
      }}>
        <div className="name">Copy</div>
        <div className="shortcut"><span className="underline">C</span></div>
      </li>
      <li onClick={async (e) => {
        const text = await navigator.clipboard.readText();
        dispatch(paste({ text, parser }));
        dispatch(setContextMenuPosition([-1, -1]));
      }}>
        <div className="name">Paste</div>
        <div className="shortcut"><span className="underline">V</span></div>
      </li>

      <li className="divider" />

      { !horizontalHeadersSelecting &&
        <li onClick={(e) => {
          dispatch(addRows({ numRows: height + 1, y: selectingTop}));
          dispatch(setNumRows(numRows + height + 1));
          dispatch(select([selectingTop, 0, selectingTop + height, matrix[0].length]));
          dispatch(choose([selectingTop, 0]));
          dispatch(setContextMenuPosition([-1, -1]));
        }}>
          <div className="name">Insert { height + 1 } row{ height > 0 && "s" } above</div>
        </li>
      }
      { !horizontalHeadersSelecting &&
        <li onClick={(e) => {
          dispatch(addRows({ numRows: height + 1, y: selectingBottom + 1}));
          dispatch(setNumRows(numRows + height + 1));
          dispatch(select([selectingBottom + 1, 0, selectingBottom + height + 1, matrix[0].length]));
          dispatch(choose([selectingBottom + 1, 0]));
          dispatch(setContextMenuPosition([-1, -1]));
        }}>
          <div className="name">Insert { height + 1 } row{ height > 0 && "s" } below</div>
        </li>
      }
      
      { !verticalHeadersSelecting &&
        <li onClick={(e) => {
          const area = clip(selectingZone, choosing, matrix, clipboardRef, renderer);
          dispatch(addCols({ numCols: width + 1, x: selectingLeft}));
          dispatch(setNumCols(numCols + width + 1));
          dispatch(select([0, selectingLeft, matrix.length, selectingLeft + width]));
          dispatch(choose([0, selectingLeft]));
          dispatch(setContextMenuPosition([-1, -1]));
        }}>
          <div className="name">Insert { width + 1 } column{ width > 0 && "s" } left</div>
        </li>
      }
      { !verticalHeadersSelecting &&
        <li onClick={(e) => {
          const area = clip(selectingZone, choosing, matrix, clipboardRef, renderer);
          dispatch(addCols({ numCols: width + 1, x: selectingRight + 1}));
          dispatch(setNumCols(numCols + width + 1));
          dispatch(select([0, selectingRight + 1, matrix.length, selectingRight + width + 1]));
          dispatch(choose([0, selectingRight + 1]));
          dispatch(setContextMenuPosition([-1, -1]));
        }}>
          <div className="name">Insert { width + 1 } column{ width > 0 && "s" } right</div>
        </li>
      }

      { !horizontalHeadersSelecting &&
        <li onClick={(e) => {
          dispatch(removeRows({ numRows: height + 1, y: selectingTop}));
          dispatch(setNumRows(numRows - height - 1));
          dispatch(setContextMenuPosition([-1, -1]));
        }}>
          <div className="name">Remove { height + 1 } row{ height > 0 && "s" }</div>
        </li>
      }

      { !verticalHeadersSelecting &&
        <li onClick={(e) => {
          dispatch(removeCols({ numCols: width + 1, x: selectingLeft}));
          dispatch(setNumCols(numCols - width - 1));
          dispatch(setContextMenuPosition([-1, -1]));
        }}>
          <div className="name">Remove { width + 1 } column{ width > 0 && "s" }</div>
        </li>
      }

      <li className="divider" />

      <li onClick={async (e) => {
        dispatch(undo());
        dispatch(setContextMenuPosition([-1, -1]));
      }}>
        <div className="name">Undo</div>
        <div className="shortcut"><span className="underline">Z</span></div>
      </li>
      <li onClick={async (e) => {
        dispatch(redo());
        dispatch(setContextMenuPosition([-1, -1]));
      }}>
        <div className="name">Redo</div>
        <div className="shortcut"><span className="underline">R</span></div>
      </li>
    </ul>
  </ContextMenuLayout>);
};
