import React from "react";
import { x2c, y2r } from "../lib/converters";
import { clip } from "../lib/clipboard";
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

import { Context } from "../store";
import { areaToZone } from "../lib/structs";
import {DEFAULT_HEIGHT} from "../constants";
import { Prevention, isProtected } from "../lib/protection";


export const Editor: React.FC = () => {
  const { store, dispatch } = React.useContext(Context);

  const {
    showAddress,
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

  let { y, x } = choosing;
  const rowId = `${y2r(y)}`;
  const colId = x2c(x);
  const address = `${colId}${rowId}`;
  const [before, setBefore] = React.useState("");
  const editing = editingCell === address

  const cell = table.getByPoint({ y, x });
  const headerTop = table.getByPoint({ y: 0, x });
  const value = cell?.value;
  const { y: top, x: left, height, width } = editorRect;

  const writeCell = (value: string) => {
    if (before !== value) {
      dispatch(write(value));
    }
    setBefore("");
  };

  const [isKeyDown, setIsKeyDown] = React.useState(false);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isKeyDown) {
      return;
    }
    // do not debounce it if control key is down.
    if (!(e.key === "Meta" || e.key === "Control")) {
      setIsKeyDown(true);
      const timeout = window.setTimeout(() => {
        setIsKeyDown(false);
        window.clearTimeout(timeout);
      }, 10);
    }
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
            numRows: table.getNumRows(),
            numCols: table.getNumCols(),
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
            input.style.height = `${input.clientHeight + DEFAULT_HEIGHT}px`;
            return false;
          } else {
            if (e.nativeEvent.isComposing) {
              return false;
            }
            writeCell(input.value);
            dispatch(setEditingCell(""));
            input.value = "";
          }
        } else if (editingOnEnter && selectingZone.startY === -1) {
          const dblclick = document.createEvent("MouseEvents");
          dblclick.initEvent("dblclick", true, true);
          input.dispatchEvent(dblclick);
          e.preventDefault();
          return false;
        }
        dispatch(
          walk({
            numRows: table.getNumRows(),
            numCols: table.getNumCols(),
            deltaY: shiftKey ? -1 : 1,
            deltaX: 0,
          })
        );
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
              numRows: table.getNumRows(),
              numCols: table.getNumCols(),
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
              numRows: table.getNumRows(),
              numCols: table.getNumCols(),
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
              numRows: table.getNumRows(),
              numCols: table.getNumCols(),
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
              numRows: table.getNumRows(),
              numCols: table.getNumCols(),
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
            dispatch(
              select({
                startY: 0,
                startX: 0,
                endY: table.getNumRows(),
                endX: table.getNumCols(),
              })
            );
            return false;
          }
        }
      case "c": // C
        if (e.ctrlKey || e.metaKey) {
          if (!editing) {
            e.preventDefault();
            const area = clip(store);
            dispatch(copy(areaToZone(area)));
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
            window.setTimeout(() => searchInputRef.current!.focus(), 100);
            return false;
          }
        }
      case "r": // R
        if (e.ctrlKey || e.metaKey) {
          if (!editing) {
            e.preventDefault();
            dispatch(redo(null));
            window.setTimeout(() => (input.value = ""), 100); // resetting textarea
            return false;
          }
        }
      case "s": // S
        if (e.ctrlKey || e.metaKey) {
          if (!editing) {
            e.preventDefault();
            onSave &&
            onSave(table, {
              pointing: choosing,
              selectingFrom: {
                y: selectingZone.startY,
                x: selectingZone.startX,
              },
              selectingTo: {
                y: selectingZone.endY,
                x: selectingZone.endX,
              },
            });
            return false;
          }
        }
      case "v": // V
        if (e.ctrlKey || e.metaKey) {
          if (!editing) {
            window.setTimeout(() => {
              dispatch(paste({text: input.value}));
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
            dispatch(cut(areaToZone(area)));
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
              window.setTimeout(() => (input.value = ""), 100); // resetting textarea
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
    if (isProtected(cell?.protection, Prevention.Write)) {
      console.warn("This cell is protected from writing.");
      return false;
    }
    dispatch(setEditingCell(address));
    return false;
  };

  return (
    <div
      className={`gs-editor ${editing ? "gs-editing" : ""}`}
      style={editing ? { top, left, height, width } : {}}
    >
      {showAddress && <div className="gs-cell-label">{address}</div>}
      <textarea
        autoFocus
        draggable={false}
        ref={editorRef}
        style={{
          ...cell?.style,
          height,
          width,
      }}
        rows={typeof value === "string" ? value.split("\n").length : 1}
        onFocus={(e) => {
          e.currentTarget.value = "";
        }}
        onDoubleClick={(e) => {
          if (isProtected(cell?.protection, Prevention.Write)) {
            console.warn("This cell is protected from writing.");
            return;
          }
          const input = e.currentTarget;
          if (!editing) {
            input.value = table.stringify({ y, x }, value);
            setBefore(input.value);
            dispatch(setEditingCell(address));
            input.style.width = `${width}px`;
            input.style.height = `${height}px`;
            window.setTimeout(() => {
              input.style.width = `${input.scrollWidth}px`;
              input.style.height = `${input.scrollHeight}px`;
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
          window.setTimeout(() => entering && e.target.focus(), 100);
        }}
        onInput={(e) => {
          const input = e.currentTarget;
          input.style.width = `${width}px`;
          input.style.width = `${input.scrollWidth}px`;
          input.style.height = `${height}px`;
          input.style.height = `${input.scrollHeight}px`;
        }}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};
