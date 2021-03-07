import React from "react";
import { x2c, y2r } from "../api/converters";
import { clip } from "../api/clipboard";
import {
  blur,
  clear,
  escape,
  select,
  setEditingCell,
  undo,
  redo,
  arrow,
  walk,
  write,
  copy,
  cut,
  paste,
  setSearchQuery,
  setEntering,
} from "../store/actions";

import { CellOptionType } from "../types";
import { Renderer as DefaultRenderer } from "../renderers/core";
import { Parser as DefaultParser } from "../parsers/core";
import { EditorLayout } from "./styles/EditorLayout";

import { Context } from "../store";

export const Editor: React.FC = () => {
  const { store, dispatch } = React.useContext(Context);

  const {
    matrix,
    editorRect,
    cellsOption,
    editingCell,
    choosing,
    selectingZone,

    entering,
    renderers,
    parsers,
    searchQuery,
    editorRef,
    searchInputRef,
    editingOnEnter,
    onSave,
  } = store;

  const [y, x] = choosing;

  const rowId = `${y2r(y)}`;
  const colId = x2c(x);
  const cellId = `${colId}${rowId}`;

  const [before, setBefore] = React.useState("");

  const editing = editingCell === cellId;

  if ((matrix && matrix[y] == null) || matrix[y][x] == null) {
    return <div />;
  }
  const value = matrix[y][x];
  const [numRows, numCols] = [matrix.length, matrix[0].length];
  const defaultOption: CellOptionType = cellsOption.default || {};
  const rowOption: CellOptionType = cellsOption[rowId] || {};
  const colOption: CellOptionType = cellsOption[colId] || {};
  const cellOption: CellOptionType = cellsOption[cellId] || {};
  // defaultOption < rowOption < colOption < cellOption

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
  const [top, left, height, width] = editorRect;

  const writeCell = (value: string) => {
    if (before !== value) {
      const parsed = parser.parse(value);
      dispatch(write(parsed));
    }
    setBefore("");
  };

  return (
    <EditorLayout
      className={`gs-editor ${editing ? "gs-editing" : ""}`}
      style={editing ? { top, left, height, width } : {}}
    >
      <div className="gs-cell-label">{cellId}</div>
      <textarea
        autoFocus
        draggable={false}
        ref={editorRef}
        style={{ height, width }}
        rows={typeof value === "string" ? value.split("\n").length : 1}
        onDoubleClick={(e) => {
          const input = e.currentTarget;
          if (!editing) {
            input.value = renderer.stringify(value);
            setBefore(input.value);
            dispatch(setEditingCell(cellId));
            setTimeout(() => {
              input.style.width = `${input.scrollWidth}px`;
              const length = new String(input.value).length;
              input.setSelectionRange(length, length);
            }, 20);
          }
        }}
        onBlur={(e) => {
          if (editing) {
            writeCell(e.target.value);
          }
          e.target.value = "";
          dispatch(blur(null));
          setTimeout(() => entering && e.target.focus(), 100);
        }}
        onKeyDown={(e) => {
          const input = e.currentTarget;
          const shiftKey = e.shiftKey;
          switch (e.key) {
            case "Tab": // TAB
              e.preventDefault();
              if (editing) {
                writeCell(input.value);
                dispatch(setEditingCell(""));
                input.value = "";
              }
              dispatch(
                walk({
                  numRows,
                  numCols,
                  deltaY: 0,
                  deltaX: shiftKey ? -1 : 1,
                })
              );
              dispatch(setEditingCell(""));
              return false;
            case "Enter": // ENTER
              if (editing) {
                if (e.altKey) {
                  input.value = `${input.value}\n`;
                  input.style.height = `${input.clientHeight + 20}px`;
                  return false;
                } else {
                  if (e.nativeEvent.isComposing) {
                    return false;
                  }
                  writeCell(input.value);
                  dispatch(setEditingCell(""));
                  input.value = "";
                }
              } else if (editingOnEnter && selectingZone[0] === -1) {
                const dblclick = document.createEvent("MouseEvents");
                dblclick.initEvent("dblclick", true, true);
                input.dispatchEvent(dblclick);
                e.preventDefault();
                return false;
              }
              dispatch(
                walk({
                  numRows,
                  numCols,
                  deltaY: shiftKey ? -1 : 1,
                  deltaX: 0,
                })
              );
              // gridRef.current?.scrollToItem({ rowIndex: y + 1, align: "end" });
              e.preventDefault();
              return false;
            case "Backspace": // BACKSPACE
              if (!editing) {
                dispatch(clear(null));
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
              dispatch(escape(null));
              dispatch(setSearchQuery(undefined));
              input.value = "";
              // input.blur();
              return false;
            case "ArrowLeft": // LEFT
              if (!editing) {
                dispatch(
                  arrow({
                    shiftKey,
                    numRows,
                    numCols,
                    deltaY: 0,
                    deltaX: -1,
                  })
                );
                return false;
              }
            case "ArrowUp": // UP
              if (!editing) {
                dispatch(
                  arrow({
                    shiftKey,
                    numRows,
                    numCols,
                    deltaY: -1,
                    deltaX: 0,
                  })
                );
                return false;
              }
            case "ArrowRight": // RIGHT
              if (!editing) {
                dispatch(
                  arrow({
                    shiftKey,
                    numRows,
                    numCols,
                    deltaY: 0,
                    deltaX: 1,
                  })
                );
                return false;
              }
            case "ArrowDown": // DOWN
              if (!editing) {
                dispatch(
                  arrow({
                    shiftKey,
                    numRows,
                    numCols,
                    deltaY: 1,
                    deltaX: 0,
                  })
                );
                return false;
              }
            case "a": // A
              if (e.ctrlKey || e.metaKey) {
                if (!editing) {
                  e.preventDefault();
                  dispatch(select([0, 0, numRows - 1, numCols - 1]));
                  return false;
                }
              }
            case "c": // C
              if (e.ctrlKey || e.metaKey) {
                if (!editing) {
                  e.preventDefault();
                  const area = clip(
                    selectingZone,
                    choosing,
                    matrix,
                    editorRef,
                    renderer
                  );
                  dispatch(copy(area));
                  input.focus(); // refocus

                  return false;
                }
              }

            case "f": // F
              if (e.ctrlKey || e.metaKey) {
                if (!editing) {
                  if (typeof searchQuery === "undefined") {
                    dispatch(setSearchQuery(""));
                  }
                  dispatch(setEntering(false));
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                  e.preventDefault();
                  return false;
                }
              }
            case "r": // R
              if (e.ctrlKey || e.metaKey) {
                if (!editing) {
                  dispatch(redo(null));
                  return false;
                }
              }
            case "s": // S
              if (e.ctrlKey || e.metaKey) {
                if (!editing) {
                  e.preventDefault();
                  onSave && onSave(matrix, cellsOption);
                  return false;
                }
              }
            case "v": // V
              if (e.ctrlKey || e.metaKey) {
                if (!editing) {
                  setTimeout(() => {
                    dispatch(paste({ text: input.value, parser }));
                    input.value = "";
                  }, 50);
                  return false;
                }
              }
            case "x": // X
              if (e.ctrlKey || e.metaKey) {
                if (!editing) {
                  e.preventDefault();
                  const area = clip(
                    selectingZone,
                    choosing,
                    matrix,
                    editorRef,
                    renderer
                  );
                  dispatch(cut(area));
                  input.focus(); // refocus

                  return false;
                }
              }
            case "z": // Z
              if (e.ctrlKey || e.metaKey) {
                if (!editing) {
                  if (e.shiftKey) {
                    dispatch(redo(null));
                  } else {
                    dispatch(undo(null));
                  }
                  return false;
                }
              }
            case ";": // semicolon
              if (e.ctrlKey || e.metaKey) {
                if (!editing) {
                  // MAYBE: need to aware timezone.
                  writeCell(new Date().toDateString());
                }
              }
          }
          if (e.ctrlKey || e.metaKey) {
            return false;
          }
          input.style.width = `${input.scrollWidth}px`;
          dispatch(setEditingCell(cellId));
          return false;
        }}
      />
    </EditorLayout>
  );
};
