import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { n2a } from "../api/converters";
import { clip } from "../api/clipboard";
import { zoneToArea, among, zoneShape } from "../api/arrays";
import { RootState } from "../store";
import {
  blur,
  clear,
  escape,
  choose,
  reChoose,
  select,
  drag,
  setEditingCell,
  undo,
  redo,
  arrow,
  walk,
  write,
  copy,
  cut,
  paste,
  setEditorRect,
} from "../store/inside";

import { setContextMenuPosition } from "../store/outside";

import { DUMMY_IMG, DEFAULT_HEIGHT, DEFAULT_WIDTH } from "../constants";
import { AreaType, CellOptionType, InsideState, OutsideState } from "../types";
import { Renderer as DefaultRenderer } from "../renderers/core";
import { Parser as DefaultParser } from "../parsers/core";
import { CellLayout } from "./styles/CellLayout";

import { Context } from "./GridSheet";

type Props = {
  rowIndex: number;
  columnIndex: number;
  style: React.CSSProperties;
};

export const Cell: React.FC<Props> = React.memo(
  ({ rowIndex: y, columnIndex: x, style: outerStyle }) => {
    const rowId = `${y + 1}`;
    const colId = n2a(x + 1);
    const cellId = `${colId}${rowId}`;
    const dispatch = useDispatch();

    if (y === 0) {
      outerStyle.borderTop = "none";
    }
    if (x === 0) {
      outerStyle.borderLeft = "none";
    }

    const {
      cellLabel,
      editingOnEnter,
      renderers,
      parsers,
      onSave,
    } = useSelector<RootState, OutsideState>(
      (state) => state["outside"],
      () => {
        return true;
      }
    );

    const {
      matrix,
      cellsOption,
      editingCell,
      choosing,
      selectingZone,
      horizontalHeadersSelecting,
      verticalHeadersSelecting,
      copyingZone,
      cutting,
    } = useSelector<RootState, InsideState>(
      (state) => state["inside"]
      /*
      (current, old) => {
        if (old.reactions[cellId] || current.reactions[cellId]) {
          return false;
        }
        return true;
      }*/
    );

    const { editorRef } = React.useContext(Context);

    const [before, setBefore] = React.useState("");

    const selectingArea = zoneToArea(selectingZone); // (top, left) -> (bottom, right)
    const copyingArea = zoneToArea(copyingZone); // (top, left) -> (bottom, right)
    const editing = editingCell === cellId;
    const pointed = choosing[0] === y && choosing[1] === x;

    if ((matrix && matrix[y] == null) || matrix[y][x] == null) {
      return <div />;
    }
    const value = matrix[y][x];
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
    const height = rowOption.height || DEFAULT_HEIGHT;
    const width = colOption.width || DEFAULT_WIDTH;
    const verticalAlign =
      cellOption.verticalAlign ||
      colOption.verticalAlign ||
      rowOption.verticalAlign ||
      defaultOption.verticalAlign ||
      "middle";

    const writeCell = (value: string) => {
      if (before !== value) {
        const parsed = parser.parse(value);
        dispatch(write(parsed));
      }
      setBefore("");
    };

    return (
      <div
        key={x}
        className={`cell ${among(copyingArea, [y, x]) ? "copying" : ""} ${
          y === numRows - 1 ? "lower-end" : ""
        } ${x === numCols - 1 ? "right-end" : ""}`}
        style={{
          ...outerStyle,
          ...style,
          ...getCellStyle(y, x, copyingArea, cutting),
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          dispatch(setContextMenuPosition([e.pageY, e.pageX]));
          return false;
        }}
        onClick={(e) => {
          dispatch(setContextMenuPosition([-1, -1]));
          if (e.shiftKey) {
            dispatch(drag([y, x]));
            dispatch(choose([-1, -1]));
            setTimeout(() => {
              dispatch(reChoose());
            }, 100);
          } else {
            dispatch(choose([y, x]));
            dispatch(select([-1, -1, -1, -1]));
          }
          const { y: top, x: left } = e.currentTarget.getBoundingClientRect();
          const rect = e.currentTarget.getBoundingClientRect();
          dispatch(
            setEditorRect([rect.top, rect.left, rect.height, rect.width])
          );
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
          dispatch(choose([y, x]));
          dispatch(select([y, x, y, x]));
          const rect = e.currentTarget.getBoundingClientRect();
          dispatch(
            setEditorRect([rect.top, rect.left, rect.height, rect.width])
          );
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
          className={`cell-wrapper-outer ${
            among(selectingArea, [y, x]) ? "selected" : ""
          } ${pointed ? "pointed" : ""} ${editing ? "editing" : ""}`}
        >
          <div
            className={`cell-wrapper-inner`}
            style={{
              width,
              height,
              verticalAlign,
            }}
          >
            {cellLabel && <div className="label">{cellId}</div>}
            <CellLayout>
              <div className="rendered">
                {renderer.render(value, writeCell)}
              </div>
            </CellLayout>
          </div>
        </div>
      </div>
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
