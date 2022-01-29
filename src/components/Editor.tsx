import React from "react";
import { x2c, y2r } from "../api/converters";
import { clip } from "../api/clipboard";
import { UserTable } from "../api/tables";
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

import { EditorLayout } from "./styles/EditorLayout";

import { Context } from "../store";

export const Editor: React.FC = () => {
  const { store, dispatch } = React.useContext(Context);

  const {
    editorRect,
    editingCell,
    choosing,
    selectingZone,
    entering,
    searchQuery,
    editorRef,
    searchInputRef,
    editingOnEnter,
    onSave,
    table,
  } = store;

  let [y, x] = choosing;

  const rowId = `${y2r(y)}`;
  const colId = x2c(x);
  const cellId = `${colId}${rowId}`;

  const [before, setBefore] = React.useState("");
  if (y === -1 || x === -1) {
    return <></>;
  }

  const editing = editingCell === cellId;

  const cell = table.get(y, x) || {};
  const value = cell.data;
  const [top, left, height, width] = editorRect;

  const writeCell = (value: string) => {
    if (before !== value) {
      dispatch(write(value));
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
        style={{ ...cell?.style, height, width }}
        rows={typeof value === "string" ? value.split("\n").length : 1}
        onFocus={(e) => {
          e.currentTarget.value = "";
        }}
        onDoubleClick={(e) => {
          const input = e.currentTarget;
          if (!editing) {
            input.value = table.stringify(y, x, value || null);
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
                  numRows: table.numRows(),
                  numCols: table.numCols(),
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
                  numRows: table.numRows(),
                  numCols: table.numCols(),
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
                    numRows: table.numRows(),
                    numCols: table.numCols(),
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
                    numRows: table.numRows(),
                    numCols: table.numCols(),
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
                    numRows: table.numRows(),
                    numCols: table.numCols(),
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
                    numRows: table.numRows(),
                    numCols: table.numCols(),
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
                  dispatch(select([0, 0, table.numRows() - 1, table.numCols() - 1]));
                  return false;
                }
              }
            case "c": // C
              if (e.ctrlKey || e.metaKey) {
                if (!editing) {
                  e.preventDefault();
                  const area = clip(store);
                  dispatch(copy(area));
                  input.focus(); // refocus
                  return false;
                }
              }

            case "f": // F
              if (e.ctrlKey || e.metaKey) {
                if (!editing) {
                  e.preventDefault();
                  if (typeof searchQuery === "undefined") {
                    dispatch(setSearchQuery(""));
                  }
                  dispatch(setEntering(false));
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                  return false;
                }
              }
            case "r": // R
              if (e.ctrlKey || e.metaKey) {
                if (!editing) {
                  e.preventDefault();
                  dispatch(redo(null));
                  setTimeout(() => (input.value = ""), 100); // resetting textarea
                  return false;
                }
              }
            case "s": // S
              if (e.ctrlKey || e.metaKey) {
                if (!editing) {
                  e.preventDefault();
                  onSave && onSave(table as UserTable, {
                    pointing: choosing,
                    selectingFrom: [selectingZone[0], selectingZone[1]],
                    selectingTo: [selectingZone[2], selectingZone[3]],
                  });
                  return false;
                }
              }
            case "v": // V
              if (e.ctrlKey || e.metaKey) {
                if (!editing) {
                  setTimeout(() => {
                    dispatch(paste({ text: input.value }));
                    input.value = "";
                  }, 50);
                  return false;
                }
              }
            case "x": // X
              if (e.ctrlKey || e.metaKey) {
                if (!editing) {
                  e.preventDefault();
                  const area = clip(store);
                  dispatch(cut(area));
                  input.focus(); // refocus

                  return false;
                }
              }
            case "z": // Z
              if (e.ctrlKey || e.metaKey) {
                if (!editing) {
                  e.preventDefault();
                  if (e.shiftKey) {
                    dispatch(redo(null));
                    setTimeout(() => (input.value = ""), 100); // resetting textarea
                  } else {
                    dispatch(undo(null));
                  }
                  return false;
                }
              }
            case ";": // semicolon
              if (e.ctrlKey || e.metaKey) {
                if (!editing) {
                  e.preventDefault();
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
