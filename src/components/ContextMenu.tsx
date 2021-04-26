import React from "react";

import { x2c, y2r } from "../api/converters";
import { clip } from "../api/clipboard";
import { Renderer as DefaultRenderer } from "../renderers/core";
import { Parser as DefaultParser } from "../parsers/core";

import {
  choose,
  select,
  undo,
  redo,
  copy,
  cut,
  paste,
  addRows,
  removeRows,
  addCols,
  removeCols,
  setContextMenuPosition,
} from "../store/actions";
import { ContextMenuLayout } from "./styles/ContextMenuLayout";
import { zoneShape, zoneToArea } from "../api/arrays";

import { CellOptionType } from "../types";
import { Context } from "../store";

export const ContextMenu: React.FC = () => {
  const { store, dispatch } = React.useContext(Context);

  const {
    matrix,
    cellsOption,
    choosing,
    selectingZone,
    horizontalHeadersSelecting,
    verticalHeadersSelecting,
    history,
    renderers,
    parsers,
    editorRef,
    contextMenuPosition,
    sheetRef,
  } = store;

  const [y, x] = choosing;
  let [
    selectingTop,
    selectingLeft,
    selectingBottom,
    selectingRight,
  ] = zoneToArea(selectingZone);
  if (selectingTop === -1) {
    [selectingTop, selectingLeft, selectingBottom, selectingRight] = [
      y,
      x,
      y,
      x,
    ];
  }
  const rowId = y2r(y);
  const colId = x2c(x);
  const cellId = `${colId}${rowId}`;

  const [height, width] = zoneShape(selectingZone);

  const defaultOption: CellOptionType = cellsOption.default || {};
  const rowOption: CellOptionType = cellsOption[rowId] || {};
  const colOption: CellOptionType = cellsOption[colId] || {};
  const cellOption: CellOptionType = cellsOption[cellId] || {};

  const rendererKey =
    cellOption.renderer ||
    colOption.renderer ||
    rowOption.renderer ||
    defaultOption.renderer;
  const parserKey =
    cellOption.parser ||
    colOption.parser ||
    rowOption.parser ||
    defaultOption.parser;

  const renderer = renderers[rendererKey || ""] || new DefaultRenderer();
  const parser = parsers[parserKey || ""] || new DefaultParser();

  const [top, left] = contextMenuPosition;
  if (top === -1) {
    return null;
  }

  const { y: offsetY, x: offsetX } = sheetRef.current.getBoundingClientRect();

  return (
    <ContextMenuLayout
      style={{
        top: top - offsetY,
        left: left - offsetX,
      }}
    >
      <ul>
        <li
          onClick={() => {
            const area = clip(
              selectingZone,
              choosing,
              matrix,
              editorRef,
              renderer
            );
            dispatch(cut(area));
            dispatch(setContextMenuPosition([-1, -1]));
          }}
        >
          <div className="gs-menu-name">Cut</div>
          <div className="gs-menu-shortcut">
            <span className="gs-menu-underline">X</span>
          </div>
        </li>
        <li
          onClick={() => {
            const area = clip(
              selectingZone,
              choosing,
              matrix,
              editorRef,
              renderer
            );
            dispatch(copy(area));
            dispatch(setContextMenuPosition([-1, -1]));
          }}
        >
          <div className="gs-menu-name">Copy</div>
          <div className="gs-menu-shortcut">
            <span className="gs-menu-underline">C</span>
          </div>
        </li>
        <li
          onClick={async () => {
            const text = editorRef.current?.value || "";
            dispatch(paste({ text, parser }));
            dispatch(setContextMenuPosition([-1, -1]));
          }}
        >
          <div className="gs-menu-name">Paste</div>
          <div className="gs-menu-shortcut">
            <span className="gs-menu-underline">V</span>
          </div>
        </li>

        <li className="gs-menu-divider" />

        {!horizontalHeadersSelecting && (
          <li
            onClick={() => {
              dispatch(addRows({ numRows: height + 1, y: selectingTop }));
              dispatch(
                select([
                  selectingTop,
                  0,
                  selectingTop + height,
                  matrix[0].length,
                ])
              );
              dispatch(choose([selectingTop, 0]));
              dispatch(setContextMenuPosition([-1, -1]));
            }}
          >
            <div className="gs-menu-name">
              Insert {height + 1} row{height > 0 && "s"} above
            </div>
          </li>
        )}
        {!horizontalHeadersSelecting && (
          <li
            onClick={() => {
              dispatch(
                addRows({ numRows: height + 1, y: selectingBottom + 1 })
              );
              dispatch(
                select([
                  selectingBottom + 1,
                  0,
                  selectingBottom + height + 1,
                  matrix[0].length,
                ])
              );
              dispatch(choose([selectingBottom + 1, 0]));
              dispatch(setContextMenuPosition([-1, -1]));
            }}
          >
            <div className="gs-menu-name">
              Insert {height + 1} row{height > 0 && "s"} below
            </div>
          </li>
        )}

        {!verticalHeadersSelecting && (
          <li
            onClick={() => {
              dispatch(addCols({ numCols: width + 1, x: selectingLeft }));
              dispatch(
                select([0, selectingLeft, matrix.length, selectingLeft + width])
              );
              dispatch(choose([0, selectingLeft]));
              dispatch(setContextMenuPosition([-1, -1]));
            }}
          >
            <div className="gs-menu-name">
              Insert {width + 1} column{width > 0 && "s"} left
            </div>
          </li>
        )}
        {!verticalHeadersSelecting && (
          <li
            onClick={() => {
              dispatch(addCols({ numCols: width + 1, x: selectingRight + 1 }));
              dispatch(
                select([
                  0,
                  selectingRight + 1,
                  matrix.length,
                  selectingRight + width + 1,
                ])
              );
              dispatch(choose([0, selectingRight + 1]));
              dispatch(setContextMenuPosition([-1, -1]));
            }}
          >
            <div className="gs-menu-name">
              Insert {width + 1} column{width > 0 && "s"} right
            </div>
          </li>
        )}

        {!horizontalHeadersSelecting && (
          <li
            onClick={() => {
              dispatch(removeRows({ numRows: height + 1, y: selectingTop }));
              dispatch(setContextMenuPosition([-1, -1]));
              dispatch(choose([-1, -1]));
              setTimeout(() => {
                dispatch(choose([y, 0]));
              }, 200);
            }}
          >
            <div className="gs-menu-name">
              Remove {height + 1} row{height > 0 && "s"}
            </div>
          </li>
        )}

        {!verticalHeadersSelecting && (
          <li
            onClick={() => {
              dispatch(removeCols({ numCols: width + 1, x: selectingLeft }));
              dispatch(setContextMenuPosition([-1, -1]));
              dispatch(choose([-1, -1]));
              setTimeout(() => {
                dispatch(choose([0, x]));
              }, 200);
            }}
          >
            <div className="gs-menu-name">
              Remove {width + 1} column{width > 0 && "s"}
            </div>
          </li>
        )}

        {(history.index > -1 ||
          history.index < history.operations.length - 1) && (
          <li className="gs-menu-divider" />
        )}

        {history.index > -1 && (
          <li
            onClick={async () => {
              dispatch(undo(null));
              dispatch(setContextMenuPosition([-1, -1]));
            }}
          >
            <div className="gs-menu-name">Undo</div>
            <div className="gs-menu-shortcut">
              <span className="gs-menu-underline">Z</span>
            </div>
          </li>
        )}
        {history.index < history.operations.length - 1 && (
          <li
            onClick={async () => {
              dispatch(redo(null));
              dispatch(setContextMenuPosition([-1, -1]));
            }}
          >
            <div className="gs-menu-name">Redo</div>
            <div className="gs-menu-shortcut">
              <span className="gs-menu-underline">R</span>
            </div>
          </li>
        )}
      </ul>
    </ContextMenuLayout>
  );
};
