import React from "react";
import { x2c, y2r } from "../api/converters";
import { zoneToArea, among, zoneShape } from "../api/structs";
import {
  choose,
  select,
  drag,
  write,
  setEditorRect,
  setContextMenuPosition,
} from "../store/actions";

import { DUMMY_IMG, DEFAULT_HEIGHT, DEFAULT_WIDTH } from "../constants";
import { AreaType } from "../types";
import { CellLayout } from "./styles/CellLayout";

import { Context } from "../store";
import { FormulaError } from "../formula/evaluator";

type Props = {
  rowIndex: number;
  columnIndex: number;
  style: React.CSSProperties;
};

export const Cell: React.FC<Props> = React.memo(
  ({ rowIndex: y, columnIndex: x, style: outerStyle }) => {
    const rowId = y2r(++y);
    const colId = x2c(++x);
    const address = `${colId}${rowId}`;
    const { store, dispatch } = React.useContext(Context);

    const cellRef = React.useRef<HTMLDivElement>(document.createElement("div"));

    const {
      table,
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
    const editing = editingCell === address;
    const pointed = choosing.y === y && choosing.x === x;

    React.useEffect(() => {
      if (editing) {
        const rect = cellRef.current.getBoundingClientRect();
        dispatch(
          setEditorRect({
            y: rect.top,
            x: rect.left,
            height: rect.height,
            width: rect.width,
          })
        );
        //editorRef.current?.focus();
      }
    }, [editing]);
    if (table.getNumRows() === 0) {
      return null;
    }
    const cell = table.getByPoint({ y, x });
    const height = table.getByPoint({ y, x: 0 })?.height || DEFAULT_HEIGHT;
    const width = table.getByPoint({ y: 0, x })?.width || DEFAULT_WIDTH;

    const verticalAlign = cell?.verticalAlign || "middle";
    const writeCell = (value: string) => {
      if (before !== value) {
        dispatch(write(value));
      }
      setBefore("");
    };

    let matching = false;
    if (searchQuery && table.stringify({ y, x }).indexOf(searchQuery) !== -1) {
      matching = true;
    }

    let errorMessage = "";
    let rendered;
    try {
      rendered = table.render({ y, x }, writeCell);
    } catch (e) {
      if (e instanceof FormulaError) {
        errorMessage = e.message;
        rendered = e.code;
      } else if (e instanceof RangeError) {
        errorMessage = "References are circulating.";
        rendered = "#REF!";
      }
      // TODO: debug flag
    }

    return (
      <CellLayout
        key={x}
        ref={cellRef}
        className={`gs-cell ${
          among(copyingArea, { y, x }) ? "gs-copying" : ""
        } ${y === 0 ? "gs-cell-top-end" : ""} ${
          x === 0 ? "gs-cell-left-end" : ""
        } ${y === table.getNumRows() ? "gs-cell-bottom-end" : ""} ${
          x === table.getNumCols() ? "gs-cell-right-end" : ""
        }`}
        style={{
          ...outerStyle,
          ...cell?.style,
          ...getCellStyle(y, x, copyingArea, cutting),
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          console.log({ e });
          dispatch(setContextMenuPosition({ y: e.clientY, x: e.clientX }));
          return false;
        }}
        onClick={(e) => {
          dispatch(setContextMenuPosition({ y: -1, x: -1 }));
          if (e.shiftKey) {
            dispatch(drag({ y, x }));
          } else {
            dispatch(choose({ y, x }));
            dispatch(select({ startY: -1, startX: -1, endY: -1, endX: -1 }));
          }
          editorRef.current?.focus();
        }}
        onDoubleClick={(e) => {
          e.preventDefault();
          const dblclick = document.createEvent("MouseEvents");
          dblclick.initEvent("dblclick", true, true);
          editorRef.current?.dispatchEvent(dblclick);
          return false;
        }}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
          dispatch(choose({ y, x }));
          dispatch(select({ startY: y, startX: x, endY: y, endX: x }));
        }}
        onDragEnd={(e) => {
          const { height: h, width: w } = zoneShape(selectingZone);
          if (h + w === 0) {
            dispatch(select({ startY: -1, startX: -1, endY: -1, endX: -1 }));
          }
        }}
        onDragEnter={() => {
          if (horizontalHeadersSelecting) {
            dispatch(drag({ y: table.getNumRows(), x }));
            return false;
          }
          if (verticalHeadersSelecting) {
            dispatch(drag({ y, x: table.getNumCols() }));
            return false;
          }
          dispatch(drag({ y, x }));
          return false;
        }}
      >
        <div
          className={`
          gs-cell-rendered-wrapper-outer ${
            among(selectingArea, { y, x }) ? "gs-selected" : ""
          }
          ${pointed ? "gs-pointed" : ""} ${editing ? "gs-editing" : ""}
          ${matching ? "gs-matching" : ""}
          ${matchingCell === address ? "gs-searching" : ""}`}
        >
          {errorMessage && (
            <div className="formula-error-triangle" title={errorMessage} />
          )}
          <div
            className={`gs-cell-rendered-wrapper-inner`}
            style={{
              width,
              height,
              verticalAlign,
            }}
          >
            {cellLabel && <div className="gs-cell-label">{address}</div>}
            <div className="gs-cell-rendered">{rendered}</div>
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
  let style: React.CSSProperties = {};
  const { top, left, bottom, right } = copyingArea;

  if (top === y && left <= x && x <= right) {
    style.borderTopStyle = cutting ? "dotted" : "dashed";
    style.borderTopWidth = "2px";
    style.borderColor = "#0077ff";
  }
  if (bottom === y && left <= x && x <= right) {
    style.borderBottomStyle = cutting ? "dotted" : "dashed";
    style.borderBottomWidth = "2px";
    style.borderColor = "#0077ff";
  }
  if (left === x && top <= y && y <= bottom) {
    style.borderLeftStyle = cutting ? "dotted" : "dashed";
    style.borderLeftWidth = "2px";
    style.borderColor = "#0077ff";
  }
  if (right === x && top <= y && y <= bottom) {
    style.borderRightStyle = cutting ? "dotted" : "dashed";
    style.borderRightWidth = "2px";
    style.borderColor = "#0077ff";
  }
  return style;
};
