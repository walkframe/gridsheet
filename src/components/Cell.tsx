import React from "react";
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import styled from "styled-components";
import {convertNtoA} from "../api/converters";
import { clip } from "../api/clipboard";
import { zoneToArea, among, shape } from "../api/arrays";
import {RootState, DispatchType } from "../store";
import {
  InsideState,
  blur,
  clear,
  escape,
  choose,
  select, drag,
  selectCols, selectRows,
  selectAll,
  setEditingCell,
  undo, redo,
  arrow, walk, write,
  copy, cut, paste, refocus,
  setCutting,
} from "../store/inside";

import {
  OutsideState,
} from "../store/outside";

import { DUMMY_IMG } from "../constants";
import {
  AreaType,
  ZoneType,
  CellOptionType,
} from "../types";
import { Renderer as DefaultRenderer } from "../renderers/core";
import { Parser as DefaultParser } from "../parsers/core";

const CellLayout = styled.div`
  overflow: hidden;
  font-size: 13px;
  letter-spacing: 1px;
  white-space: pre-wrap;
  line-height: 20px;
  cursor: auto;
  word-wrap: break-word;
  word-break: break-all;

  .rendered {
    padding: 0 2px;
  }

  textarea {
    width: 100%;
    position: absolute;
    font-size: 13px;
    line-height: 20px;
    letter-spacing: 1px;
    top: 0;
    left: 0;
    border: none;
    outline: none;
    background-color: transparent;
    resize: none;
    box-sizing: border-box;
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    overflow: hidden;
    caret-color: transparent;
    cursor: default;
    &.editing {
      caret-color: #000000;
      background-color: #ffffff;
      z-index: 1;
      cursor: text;
      min-width: 100%;
      white-space: pre;
      outline: solid 2px #0077ff;
      height: auto;
    }
  }
`;

interface Props {
  y: number;
  x: number;
  clipboardRef: React.RefObject<HTMLTextAreaElement>;
};

export const Cell: React.FC<Props> = React.memo(({
  y,
  x,
  clipboardRef,
}) => {
  const rowId = `${ y + 1 }`;
  const colId = convertNtoA(x + 1);
  const cellId = `${colId}${rowId}`;
  const dispatch = useDispatch();

  const {
    cellsOption,
    cellLabel,
    defaultHeight,
    defaultWidth,
  } = useSelector<RootState, OutsideState>(
      state => state["outside"],
      (current, old) => {
        return true;
      }
  );

  const {
    matrix,
    editingCell,
    choosing,
    selecting,
    horizontalHeadersSelecting,
    verticalHeadersSelecting,
    copying,
    cutting,
  } = useSelector<RootState, InsideState>(
    state => state["inside"],
    (current, old) => {
      if (old.matrix.length === 0) {
          return false;
      }
      if (old.reactions[cellId] || current.reactions[cellId]) {
        return false;
      }
      return true;
    }
  );

  const selectingArea = zoneToArea(selecting); // (top, left) -> (bottom, right)
  const copyingArea = zoneToArea(copying); // (top, left) -> (bottom, right)
  const editing = editingCell === cellId;
  const pointed = choosing[0] === y && choosing[1] === x;

  if (matrix && matrix[y] == null || matrix[y][x] == null) {
    return <td />;
  }
  const value = matrix[y][x];
  const [numRows, numCols] = [matrix.length, matrix[0].length];
  const defaultOption: CellOptionType = cellsOption.default || {};
  const rowOption: CellOptionType = cellsOption[rowId] || {};
  const colOption: CellOptionType = cellsOption[colId] || {};
  const cellOption: CellOptionType = cellsOption[cellId] || {};
  // defaultOption < rowOption < colOption < cellOption
  const style = {
    ...defaultOption.style,
    ...rowOption.style,
    ...colOption.style,
    ...cellOption.style
  };
  const Renderer = cellOption.renderer || colOption.renderer || rowOption.renderer || defaultOption.renderer || DefaultRenderer;
  const Parser = cellOption.parser || colOption.parser || rowOption.parser || defaultOption.parser || DefaultParser;
  const height = rowOption.height || defaultHeight;
  const width = colOption.width || defaultWidth;
  
  const writeCell = (value: string) => {
    const parsed = new Parser(value).parse();
    dispatch(write(parsed));
  };

  return (<td
    key={x}
    className={` ${
        among(copyingArea, [y, x]) ? cutting ? "cutting" : "copying" : ""}`}
    style={{
      ... style,
      ... getCellStyle(y, x, copyingArea, cutting),
    }}
    draggable={!editing}
    onClick={(e) => {
      dispatch(choose([y, x]));
      dispatch(select([-1, -1, -1, -1]));
      //dispatch(select([y, x, y, x]));
    }}
    onDragStart={(e) => {
      e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
      dispatch(choose([y, x]));
      dispatch(select([y, x, y, x]));
    }}
    onDragEnd={() => {
      const [h, w] = shape(selecting);
      if (h + w === 0) {
        dispatch(select([-1, -1, -1, -1]));
      }
    }}
    onDragEnter={(e) => {
      const [startY, startX] = selecting;
      if (horizontalHeadersSelecting) {
        dispatch(drag([numRows - 1, x]));
        return false;
      }
      if (verticalHeadersSelecting) {
        dispatch(drag([y, numCols - 1]));
        return false;
      }
      dispatch(drag([y, x]));
    }}>
    <div
      className={`cell-wrapper-outer ${among(selectingArea, [y, x]) ? "selected": ""} ${pointed ? "pointed" : ""} ${editing ? "editing" : ""}`}>
      <div
        className={`cell-wrapper-inner`}
        style={{
          width,
          height,
          verticalAlign: rowOption.verticalAlign || colOption.verticalAlign || "middle",
        }}
      >
        { cellLabel && (<div className="label">{ cellId }</div>)}
        <CellLayout>
          {!editing && <div className="rendered">{ new Renderer(value).render() }</div>}
          {!pointed ? null : (<textarea
            autoFocus
            style={{ minHeight: height }}
            rows={typeof value === "string" ? value.split("\n").length : 1}
            className={editing ? "editing" : ""}
            onDoubleClick={(e) => {
              const input = e.currentTarget;
              if (!editing) {
                input.value = new Renderer(value).renderEditing();
                dispatch(setEditingCell(cellId));
                setTimeout(() => input.style.width = `${input.scrollWidth}px`, 100);
              }
            }}
            onBlur={(e) => {
              if (editing) {
                writeCell(e.target.value);
              }
              dispatch(blur());
            }}
            onKeyDown={(e) => {
              const input = e.currentTarget;
              const shiftKey = e.shiftKey;
              switch (e.key) {
                case "Tab": // TAB
                  e.preventDefault();
                  if (editing) {
                    writeCell(input.value);
                  }
                  dispatch(walk({numRows, numCols, deltaY: 0, deltaX: shiftKey ? -1 : 1}));
                  dispatch(setEditingCell(""));
                  return false;
                case "Enter": // ENTER
                  if (e.altKey) {
                    input.value = `${input.value}\n`;
                    input.style.height = `${input.clientHeight + 20}px`;
                  } else {
                    if (editing) {
                      if (e.nativeEvent.isComposing) {
                        return false;
                      }
                      writeCell(input.value);
                      dispatch(setEditingCell(""));
                      input.value = "";
                    }
                    dispatch(walk({numRows, numCols, deltaY: shiftKey ? -1 : 1, deltaX: 0}));
                    e.preventDefault();
                    return false;
                  }
                case "Backspace": // BACKSPACE
                  if (!editing) {
                    dispatch(clear());
                    return false;
                  }
                case "Shift": // SHIFT
                  return false;
                case "Control": // CTRL
                  return false;
                case "Alt": // OPTION
                  return false;
                case "Meta": // COMMAND
                  return false;
                case "NumLock": // NUMLOCK
                  return false;
                case "Escape": // ESCAPE
                  dispatch(escape());
                  input.value = "";
                  // input.blur();
                  return false;
                case "ArrowLeft": // LEFT
                  if (!editing) {
                    dispatch(arrow({shiftKey, numRows, numCols, deltaY: 0, deltaX: -1}));
                    return false;
                  }
                case "ArrowUp": // UP
                  if (!editing) {
                    dispatch(arrow({shiftKey, numRows, numCols, deltaY: -1, deltaX: 0}));
                    return false;
                  }
                case "ArrowRight": // RIGHT
                  if (!editing) {
                    dispatch(arrow({shiftKey, numRows, numCols, deltaY: 0, deltaX: 1}));
                    return false;
                  }
                case "ArrowDown": // DOWN
                  if (!editing) {
                    dispatch(arrow({shiftKey, numRows, numCols, deltaY: 1, deltaX: 0}));
                    return false;
                  }
                case "a": // A
                  if (e.ctrlKey || e.metaKey) {
                    if (!editing) {
                      e.preventDefault();
                      dispatch(selectAll({numRows, numCols}));
                      return false;
                    }
                  }
                case "c": // C
                  if (e.ctrlKey || e.metaKey) {
                    if (!editing) {
                      e.preventDefault();
                      const area = clip(selecting, choosing, matrix, clipboardRef, Renderer);
                      dispatch(copy(area));
                      setTimeout(() => {
                        dispatch(refocus({choosing: [y, x], selecting}));
                      }, 100); // refocus
                      return false;
                    }
                  }
                case "r": // R
                  if (e.ctrlKey || e.metaKey) {
                    if (!editing) {
                      dispatch(redo())
                      return false;
                    }
                  }
                case "v": // V
                  if (e.ctrlKey || e.metaKey) {
                    if (!editing) {
                      setTimeout(() => {
                        dispatch(paste(input.value));
                        input.value = "";
                      }, 50);
                      return false;
                    }
                  }
                case "x": // X
                  if (e.ctrlKey || e.metaKey) {
                    if (!editing) {
                      e.preventDefault();
                      const area = clip(selecting, choosing, matrix, clipboardRef, Renderer);
                      dispatch(cut(area));
                      setTimeout(() => {
                        dispatch(refocus({choosing: [y, x], selecting}));
                      }, 100); // refocus
                      return false;
                    }
                  }
                case "z": // Z
                  if (e.ctrlKey || e.metaKey) {
                    if (!editing) {
                      if (e.shiftKey) {
                        dispatch(redo());
                      } else {
                        dispatch(undo());
                      }
                      return false;
                    }
                  }
              }
              if (e.ctrlKey || e.metaKey) {
                return false;
              }
              input.style.width = `${input.scrollWidth}px`;
              dispatch(setEditingCell(cellId));
            }}
          />)}
        </CellLayout>
      </div>
    </div>
  </td>);
});

const getCellStyle = (y: number, x: number, copyingArea: AreaType, cutting: boolean): React.CSSProperties => {
  let style: any = {};
  const [top, left, bottom, right] = copyingArea;
  
  if (top === y && left <= x && x <= right) {
    style.borderTop = `${ cutting ? "dotted" : "dashed" } 2px #0077ff`;
  }
  if (bottom === y && left <= x && x <= right) {
    style.borderBottom = `${ cutting ? "dotted" : "dashed" } 2px #0077ff`;
  }
  if (left === x && top <= y && y <= bottom) {
    style.borderLeft = `${ cutting ? "dotted" : "dashed" } 2px #0077ff`;
  }
  if (right === x && top <= y && y <= bottom) {
    style.borderRight = `${ cutting ? "dotted" : "dashed" } 2px #0077ff`;
  }
  return style;
};
