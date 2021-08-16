import React from "react";
import { x2c, y2r } from "../api/converters";
import { zoneToArea, among, zoneShape, stackOption } from "../api/arrays";
import {
  choose,
  select,
  drag,
  write,
  setEditorRect,
  setContextMenuPosition,
} from "../store/actions";

import { DUMMY_IMG, DEFAULT_HEIGHT, DEFAULT_WIDTH } from "../constants";
import { AreaType, CellOptionType } from "../types";
import { defaultRenderer } from "../renderers/core";
import { CellLayout } from "./styles/CellLayout";

import { Context } from "../store";

type Props = {
  rowIndex: number;
  columnIndex: number;
  style: React.CSSProperties;
};

export const Cell: React.FC<Props> = React.memo(
  ({ rowIndex: y, columnIndex: x, style: outerStyle }) => {
    const rowId = y2r(y);
    const colId = x2c(x);
    const cellId = `${colId}${rowId}`;
    const { store, dispatch } = React.useContext(Context);

    const cellRef = React.useRef<HTMLDivElement>(document.createElement("div"));

    const {
      matrix,
      renderers,
      parsers,
      cellsOption,
      editingCell,
      choosing,
      selectingZone,
      horizontalHeadersSelecting,
      verticalHeadersSelecting,
      copyingZone,
      cutting,
      searchQuery,
      matchingCells,
      matchingCellIndex,
      editorRef,
      cellLabel,
    } = store;

    const [before, setBefore] = React.useState("");

    const matchingCell = matchingCells[matchingCellIndex];

    const selectingArea = zoneToArea(selectingZone); // (top, left) -> (bottom, right)
    const copyingArea = zoneToArea(copyingZone); // (top, left) -> (bottom, right)
    const editing = editingCell === cellId;
    const pointed = choosing[0] === y && choosing[1] === x;
    const value = matrix[y][x];

    React.useEffect(() => {
      if (editing) {
        const rect = cellRef.current.getBoundingClientRect();
        dispatch(setEditorRect([rect.top, rect.left, rect.height, rect.width]));
        //editorRef.current?.focus();
      }
    }, [editing]);

    if ((matrix && matrix[y] == null) || matrix[y][x] == null) {
      return <div />;
    }

    const [numRows, numCols] = [matrix.length, matrix[0].length || 0];
    const defaultOption: CellOptionType = cellsOption.default || {};
    const rowOption: CellOptionType = cellsOption[rowId] || {};
    const colOption: CellOptionType = cellsOption[colId] || {};
    const cellOption: CellOptionType = cellsOption[cellId] || {};
    // defaultOption < rowOption < colOption < cellOption
    const style = {
      ...defaultOption.style,
      ...rowOption.style,
      ...colOption.style,
      ...cellOption.style,
    };

    const rendererKey = stackOption(cellsOption, y, x).renderer;
    const renderer = renderers[rendererKey || ""] || defaultRenderer;
    const height = rowOption.height || DEFAULT_HEIGHT;
    const width = colOption.width || DEFAULT_WIDTH;

    const verticalAlign = stackOption(cellsOption, y, x).verticalAlign || "middle";
    const writeCell = (value: string) => {
      if (before !== value) {
        dispatch(write(value));
      }
      setBefore("");
    };

    let matching = false;
    if (searchQuery && renderer.stringify(value).indexOf(searchQuery) !== -1) {
      matching = true;
    }

    return (
      <CellLayout
        key={x}
        ref={cellRef}
        className={`gs-cell ${among(copyingArea, [y, x]) ? "gs-copying" : ""} ${
          y === 0
            ? "gs-cell-top-end"
            : y === numRows - 1
            ? "gs-cell-lower-end"
            : ""
        } ${
          x === 0
            ? "gs-cell-left-end"
            : x === numCols - 1
            ? "gs-cell-right-end"
            : ""
        }`}
        style={{
          ...outerStyle,
          ...style,
          ...getCellStyle(y, x, copyingArea, cutting),
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          dispatch(setContextMenuPosition([e.clientY, e.clientX]));
          return false;
        }}
        onClick={(e) => {
          dispatch(setContextMenuPosition([-1, -1]));
          if (e.shiftKey) {
            dispatch(drag([y, x]));
          } else {
            dispatch(choose([y, x]));
            dispatch(select([-1, -1, -1, -1]));
          }
          editorRef.current?.focus();
        }}
        onDoubleClick={(e) => {
          e.preventDefault();
          const dblclick = document.createEvent("MouseEvents");
          dblclick.initEvent("dblclick", true, true);
          editorRef.current?.dispatchEvent(dblclick);
          setTimeout(() => (editorRef.current.value = renderer.stringify(value)), 100);
          return false;
        }}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
          dispatch(choose([y, x]));
          dispatch(select([y, x, y, x]));
        }}
        onDragEnd={(e) => {
          const [h, w] = zoneShape(selectingZone);
          if (h + w === 0) {
            dispatch(select([-1, -1, -1, -1]));
          }
        }}
        onDragEnter={() => {
          if (horizontalHeadersSelecting) {
            dispatch(drag([numRows - 1, x]));
            return false;
          }
          if (verticalHeadersSelecting) {
            dispatch(drag([y, numCols - 1]));
            return false;
          }
          dispatch(drag([y, x]));
          return false;
        }}
      >
        <div
          className={`gs-cell-rendered-wrapper-outer ${
            among(selectingArea, [y, x]) ? "gs-selected" : ""
          } ${pointed ? "gs-pointed" : ""} ${editing ? "gs-editing" : ""} ${
            matching ? "gs-matching" : ""
          } ${matchingCell === cellId ? "gs-searching" : ""}`}
        >
          <div
            className={`gs-cell-rendered-wrapper-inner`}
            style={{
              width,
              height,
              verticalAlign,
            }}
          >
            {cellLabel && <div className="gs-cell-label">{cellId}</div>}

            <div className="gs-cell-rendered">
              {renderer.render(value, writeCell)}
            </div>
          </div>
        </div>
      </CellLayout>
    );
  }
);

const getCellStyle = (
  y: number,
  x: number,
  copyingArea: AreaType,
  cutting: boolean
): React.CSSProperties => {
  let style: any = {};
  const [top, left, bottom, right] = copyingArea;

  if (top === y && left <= x && x <= right) {
    style.borderTop = `${cutting ? "dotted" : "dashed"} 2px #0077ff`;
  }
  if (bottom === y && left <= x && x <= right) {
    style.borderBottom = `${cutting ? "dotted" : "dashed"} 2px #0077ff`;
  }
  if (left === x && top <= y && y <= bottom) {
    style.borderLeft = `${cutting ? "dotted" : "dashed"} 2px #0077ff`;
  }
  if (right === x && top <= y && y <= bottom) {
    style.borderRight = `${cutting ? "dotted" : "dashed"} 2px #0077ff`;
  }
  return style;
};
