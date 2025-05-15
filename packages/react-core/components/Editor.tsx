import React from 'react';
import { x2c, y2r } from '../lib/converters';
import { clip } from '../lib/clipboard';
import {
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
  setLastEdited,
  setLastFocusedRef,
  setInputting,
} from '../store/actions';

import { Context } from '../store';
import { areaToZone, zoneToArea } from '../lib/structs';
import * as prevention from '../lib/prevention';
import { expandInput, insertTextAtCursor } from '../lib/input';
import { useSheetContext } from './SheetProvider';
import { Lexer } from '../formula/evaluator';
import { REF_PALETTE } from '../lib/palette';
import { CursorStateType, ModeType } from '../types';
import { Fixed } from './Fixed';

type Props = {
  mode: ModeType;
  handleKeyUp?: (e: React.KeyboardEvent<HTMLTextAreaElement>, points: CursorStateType) => void;
};

export const Editor: React.FC<Props> = ({ mode, handleKeyUp }: Props) => {
  const { store, dispatch } = React.useContext(Context);
  const {
    showAddress,
    editorRect,
    editingCell,
    choosing,
    inputting,
    selectingZone,
    searchQuery,
    editorRef,
    largeEditorRef,
    searchInputRef,
    editingOnEnter,
    onSave,
    table,
    sheetId,
  } = store;

  const [, sheetContext] = useSheetContext();
  React.useEffect(() => {
    editorRef?.current?.focus?.({ preventScroll: true });
  }, [editorRef]);

  React.useEffect(() => {
    if (!sheetContext?.lastFocusedRef) {
      return;
    }
    if (sheetContext.lastFocusedRef === editorRef) {
      return;
    }
    if (sheetContext.lastFocusedRef === largeEditorRef) {
      return;
    }
    dispatch(setEditingCell(''));
  }, [sheetContext?.lastFocusedRef]);
  React.useEffect(() => {
    sheetContext?.setEditingCell?.(editingCell);
  }, [editingCell]);

  const { y, x } = choosing;
  const rowId = `${y2r(y)}`;
  const colId = x2c(x);
  const address = `${colId}${rowId}`;
  const editing = editingCell === address;

  const cell = table.getByPoint({ y, x });
  const value: any = cell?.value;
  const valueString = table.stringify({ y, x }, value);
  const [before, setBefore] = React.useState<string>(valueString);
  React.useEffect(() => {
    setBefore(valueString);
  }, [choosing]);

  const { y: top, x: left, height, width } = editorRect;

  const writeCell = (value: string) => {
    if (before !== value) {
      dispatch(write(value));
    }
    setBefore(value);
  };

  const numLines = valueString.split('\n').length;
  const [isKeyDown, setIsKeyDown] = React.useState(false);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isKeyDown) {
      return;
    }
    // do not debounce it if control key is down.
    if (!(e.key === 'Meta' || e.key === 'Control')) {
      setIsKeyDown(true);
      const timeout = window.setTimeout(() => {
        setIsKeyDown(false);
        window.clearTimeout(timeout);
      }, 10);
    }
    const input = e.currentTarget;

    const shiftKey = e.shiftKey;
    switch (e.key) {
      case 'Tab': // TAB
        e.preventDefault();
        if (editing) {
          writeCell(input.value);
          dispatch(setEditingCell(''));
          dispatch(setInputting(''));
        }
        dispatch(
          walk({
            numRows: table.getNumRows(),
            numCols: table.getNumCols(),
            deltaY: 0,
            deltaX: shiftKey ? -1 : 1,
          }),
        );
        dispatch(setEditingCell(''));
        resetSize(e.currentTarget);
        return false;

      case 'Enter': // ENTER
        if (editing) {
          if (e.altKey) {
            insertTextAtCursor(input, '\n');
            dispatch(setInputting(input.value));
            e.preventDefault();
            return false;
          } else {
            if (e.nativeEvent.isComposing) {
              return false;
            }
            writeCell(input.value);
            dispatch(setEditingCell(''));
          }
          resetSize(e.currentTarget);
        } else if (editingOnEnter && selectingZone.endY === -1) {
          const dblclick = document.createEvent('MouseEvents');
          dblclick.initEvent('dblclick', true, true);
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
          }),
        );
        e.preventDefault();
        return false;

      case 'Backspace': // BACKSPACE
        if (!editing) {
          dispatch(clear(null));
          return false;
        }
        break;
      case 'Shift': // SHIFT
        return false;

      case 'Control': // CTRL
        return false;

      case 'Alt': // OPTION
        return false;

      case 'Meta': // COMMAND
        return false;

      case 'NumLock': // NUMLOCK
        return false;

      case 'Escape': // ESCAPE
        dispatch(escape(null));
        dispatch(setSearchQuery(undefined));
        // input.blur();
        return false;

      case 'ArrowLeft': // LEFT
        if (!editing) {
          dispatch(
            arrow({
              shiftKey,
              numRows: table.getNumRows(),
              numCols: table.getNumCols(),
              deltaY: 0,
              deltaX: -1,
            }),
          );
          return false;
        }
        break;
      case 'ArrowUp': // UP
        if (!editing) {
          dispatch(
            arrow({
              shiftKey,
              numRows: table.getNumRows(),
              numCols: table.getNumCols(),
              deltaY: -1,
              deltaX: 0,
            }),
          );
          return false;
        }
        break;
      case 'ArrowRight': // RIGHT
        if (!editing) {
          dispatch(
            arrow({
              shiftKey,
              numRows: table.getNumRows(),
              numCols: table.getNumCols(),
              deltaY: 0,
              deltaX: 1,
            }),
          );
          return false;
        }
        break;
      case 'ArrowDown': // DOWN
        if (!editing) {
          dispatch(
            arrow({
              shiftKey,
              numRows: table.getNumRows(),
              numCols: table.getNumCols(),
              deltaY: 1,
              deltaX: 0,
            }),
          );
          return false;
        }
        break;
      case 'a': // A
        if (e.ctrlKey || e.metaKey) {
          if (!editing) {
            e.preventDefault();
            dispatch(
              select({
                startY: 1,
                startX: 1,
                endY: table.getNumRows(),
                endX: table.getNumCols(),
              }),
            );
            return false;
          }
        }
        break;
      case 'c': // C
        if (e.ctrlKey || e.metaKey) {
          if (!editing) {
            e.preventDefault();
            const area = clip(store);
            dispatch(copy(areaToZone(area)));
            input.focus(); // refocus
            return false;
          }
        }
        break;
      case 'f': // F
        if (e.ctrlKey || e.metaKey) {
          if (!editing) {
            e.preventDefault();
            if (typeof searchQuery === 'undefined') {
              dispatch(setSearchQuery(''));
            }
            dispatch(setEntering(false));
            window.setTimeout(() => searchInputRef.current!.focus(), 100);
            return false;
          }
        }
        break;
      case 'r': // R
        if (e.ctrlKey || e.metaKey) {
          if (!editing) {
            e.preventDefault();
            dispatch(redo(null));
            window.setTimeout(() => dispatch(setInputting('')), 100); // resetting textarea
            return false;
          }
        }
        break;
      case 's': // S
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
        break;
      case 'v': // V
        if (e.ctrlKey || e.metaKey) {
          if (!editing) {
            window.setTimeout(() => {
              dispatch(paste({ text: input.value }));
              dispatch(setInputting(''));
            }, 50);
            return false;
          }
        }
        break;
      case 'x': // X
        if (e.ctrlKey || e.metaKey) {
          if (!editing) {
            e.preventDefault();
            const area = clip(store);
            dispatch(cut(areaToZone(area)));
            input.focus(); // refocus

            return false;
          }
        }
        break;
      case 'z': // Z
        if (e.ctrlKey || e.metaKey) {
          if (!editing) {
            e.preventDefault();
            if (e.shiftKey) {
              dispatch(redo(null));
              //window.setTimeout(() => dispatch(setInputting('')), 100); // resetting textarea
            } else {
              dispatch(undo(null));
            }
            return false;
          }
        }
        break;
      case ';': // semicolon
        if (e.ctrlKey || e.metaKey) {
          if (!editing) {
            e.preventDefault();
            // MAYBE: need to aware timezone.
            writeCell(new Date().toDateString());
          }
        }
        break;
    }
    if (e.ctrlKey || e.metaKey) {
      return false;
    }
    if (prevention.isPrevented(cell?.prevention, prevention.Write)) {
      console.warn('This cell is protected from writing.');
      return false;
    }
    dispatch(setEditingCell(address));
    if (!editing) {
      dispatch(setInputting(''));
    }
    return false;
  };

  return (
    <Fixed
      className={`gs-editor ${editing ? 'gs-editing' : ''}`}
      style={editing ? { top, left, height } : {}}
      {...{
        'data-mode': mode,
        'data-sheet-id': sheetId,
      }}
    >
      {showAddress && <div className="gs-cell-label">{address}</div>}
      <div className="gs-editor-inner" style={{ width }}>
        <pre
          className="gs-editor-hl"
          style={{
            //...cell?.style,
            height: editorRef.current?.scrollHeight,
            width: (editorRef.current?.scrollWidth ?? 0) - 4,
          }}
        >
          {cell?.disableFormula ? inputting : editorStyle(inputting)}
        </pre>
        <textarea
          autoFocus={true}
          spellCheck={false}
          draggable={false}
          ref={editorRef}
          rows={numLines}
          onFocus={() => {
            dispatch(setLastFocusedRef(editorRef));
            sheetContext?.setLastFocusedRef?.(editorRef);
          }}
          style={{ minWidth: width, minHeight: height }}
          onDoubleClick={(e) => {
            if (prevention.isPrevented(cell?.prevention, prevention.Write)) {
              console.warn('This cell is protected from writing.');
              return;
            }
            const input = e.currentTarget;
            resetSize(input);
            if (!editing) {
              dispatch(setInputting(valueString));
              dispatch(setEditingCell(address));
              window.setTimeout(() => {
                input.style.width = `${input.scrollWidth}px`;
                input.style.height = `${input.scrollHeight}px`;
                const length = new String(valueString).length;
                input.setSelectionRange(length, length);
              }, 20);
            }
          }}
          onBlur={(e) => {
            dispatch(setLastEdited(before));
            if (e.target.value.startsWith('=')) {
              return true;
            } else {
              if (editing) {
                writeCell(e.target.value);
              }
            }
            resetSize(e.target);
          }}
          value={inputting}
          onChange={(e) => {
            const input = e.currentTarget;
            expandInput(input);
            dispatch(setInputting(e.currentTarget.value));
          }}
          onKeyDown={handleKeyDown}
          onKeyUp={(e) => {
            const input = e.currentTarget;
            const selectingArea = zoneToArea(store.selectingZone);
            handleKeyUp?.(e, {
              pointing: choosing,
              selectingFrom: { y: selectingArea.top, x: selectingArea.left },
              selectingTo: { y: selectingArea.bottom, x: selectingArea.right },
            });
          }}
        />
      </div>
    </Fixed>
  );
};

export const editorStyle = (text: string) => {
  if (text[0] !== '=') {
    return <>{text}</>;
  }
  const lexer = new Lexer(text.substring(1));
  lexer.tokenize();
  let palletIndex = 0;
  const exists: { [ref: string]: number } = {};
  return (
    <>
      =
      {lexer.tokens.map((token, i) => {
        if (token.type === 'REF' || token.type === 'RANGE') {
          const normalizedToken = token.stringify();
          const existsIndex = exists[normalizedToken];
          if (existsIndex !== undefined) {
            return (
              <span key={i} style={{ color: REF_PALETTE[existsIndex % REF_PALETTE.length] }}>
                {token.stringify()}
              </span>
            );
          }
          const color = REF_PALETTE[palletIndex % REF_PALETTE.length];
          exists[normalizedToken] = palletIndex++;
          return (
            <span key={i} style={{ color }} className={`gs-token-type-${token.type}`}>
              {normalizedToken}
            </span>
          );
        }

        return (
          <span key={i} className={`gs-token-type-${token.type} gs-token-entity-type-${typeof token.entity}`}>
            {token.stringify()}
          </span>
        );
      })}
    </>
  );
};

const resetSize = (input: HTMLTextAreaElement) => {
  input.style.width = '0px';
  input.style.height = '0px';
};
