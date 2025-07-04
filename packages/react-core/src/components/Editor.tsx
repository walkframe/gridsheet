import type { FC, KeyboardEvent } from 'react';
import { useContext, useEffect, useState } from 'react';
import { x2c, y2r } from '../lib/converters';
import { clip } from '../lib/clipboard';
import {
  clear,
  escape,
  select,
  setEditingAddress,
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
  setInputting,
  updateTable,
} from '../store/actions';

import { Context } from '../store';
import { areaToZone, zoneToArea } from '../lib/structs';
import * as prevention from '../lib/operation';
import { expandInput, insertTextAtCursor, isRefInsertable, resetInput } from '../lib/input';
import { Lexer } from '../formula/evaluator';
import { COLOR_PALETTE } from '../lib/palette';
import { CursorStateType, EditorEventWithNativeEvent, ModeType } from '../types';
import { Fixed } from './Fixed';
import { parseHTML, parseText } from '../lib/paste';

type Props = {
  mode: ModeType;
  handleKeyUp?: (e: KeyboardEvent<HTMLTextAreaElement>, points: CursorStateType) => void;
};

export const Editor: FC<Props> = ({ mode, handleKeyUp }: Props) => {
  const { store, dispatch } = useContext(Context);
  const [selected, setSelected] = useState(0);
  const [shiftKey, setShiftKey] = useState(false);
  const {
    showAddress,
    editorRect,
    editingAddress,
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

  const policy = table.getPolicyByPoint(choosing);
  const optionsAll = policy.getOptions();
  const inputLower = inputting.toLocaleLowerCase();
  const filteredOptions = optionsAll
    .map((option) => {
      const keywords = option.keywords ?? [String(option.value)];
      let bestMatch = { index: -1, startsWith: false, keyword: '' };

      for (const keyword of keywords) {
        const keywordLower = keyword.toLowerCase();
        const index = keywordLower.indexOf(inputLower);
        if (index !== -1) {
          const startsWith = keywordLower.startsWith(inputLower);
          if (
            bestMatch.index === -1 ||
            index < bestMatch.index ||
            (index === bestMatch.index && startsWith && !bestMatch.startsWith)
          ) {
            bestMatch = { index, startsWith, keyword };
          }
        }
      }

      return {
        option,
        ...bestMatch,
        keywordCount: keywords.length, // Add hierarchy (number of keywords)
      };
    })
    .filter(({ index }) => index !== -1)
    .sort((a, b) => {
      // First priority: starts with input
      if (a.startsWith !== b.startsWith) {
        return b.startsWith ? 1 : -1;
      }
      // Second priority: earlier match position
      if (a.index !== b.index) {
        return a.index - b.index;
      }
      // Third priority: more keywords (higher hierarchy)
      if (a.keywordCount !== b.keywordCount) {
        return b.keywordCount - a.keywordCount;
      }
      // Fourth priority: alphabetical order
      return a.keyword.localeCompare(b.keyword);
    })
    .map(({ option }) => option);

  useEffect(() => {
    editorRef?.current?.focus?.({ preventScroll: true });
  }, [editorRef]);

  useEffect(() => {
    if (table.wire.lastFocused == null) {
      return;
    }
    if (table.wire.lastFocused !== editorRef.current) {
      return;
    }
    if (table.wire.lastFocused !== largeEditorRef.current) {
      return;
    }

    dispatch(setEditingAddress(''));
  }, [table.wire.lastFocused]);
  useEffect(() => {
    table.wire.editingSheetId = sheetId;
    table.wire.editingAddress = editingAddress;
  }, [editingAddress]);

  useEffect(() => {
    //table.wire.transmit();
    expandInput(editorRef.current);
  }, [inputting, editingAddress]);

  const { y, x } = choosing;
  const rowId = `${y2r(y)}`;
  const colId = x2c(x);
  const address = `${colId}${rowId}`;
  const editing = editingAddress === address;

  const cell = table.getByPoint({ y, x });
  const valueString = table.stringify({ point: choosing, cell, refEvaluation: 'raw' });
  const [before, setBefore] = useState<string>(valueString);

  const selectValue = (selected: number) => {
    const option = filteredOptions[selected];
    if (option) {
      const t = table.update({
        diff: { [address]: { value: option.value } },
        partial: true,
      });
      dispatch(updateTable(t.clone()));
      dispatch(setEditingAddress(''));
      dispatch(setInputting(''));
      setSelected(0);
    }
  };

  useEffect(() => {
    setBefore(valueString);
    dispatch(setInputting(valueString));
    resetInput(editorRef.current, table, choosing);
  }, [choosing]);

  const { y: top, x: left, height, width } = editorRect;

  const writeCell = (value: string) => {
    if (before !== value) {
      dispatch(write({ value }));
    }
    setBefore(value);
  };

  const numLines = valueString.split('\n').length;
  const [isKeyDown, setIsKeyDown] = useState(false);
  const handleKeyDown = (e: EditorEventWithNativeEvent) => {
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
          if (filteredOptions.length) {
            selectValue(selected);
          } else {
            writeCell(input.value);
            dispatch(setEditingAddress(''));
            dispatch(setInputting(''));
          }
        }
        dispatch(
          walk({
            numRows: table.getNumRows(),
            numCols: table.getNumCols(),
            deltaY: 0,
            deltaX: shiftKey ? -1 : 1,
          }),
        );
        dispatch(setEditingAddress(''));
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
            if (filteredOptions.length) {
              selectValue(selected);
            } else {
              writeCell(input.value);
              dispatch(setEditingAddress(''));
              dispatch(setInputting(''));
            }
          }
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
          dispatch(setInputting(''));
          return false;
        }
        break;
      case 'Shift': // SHIFT
        setShiftKey(true);
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
        dispatch(setInputting(before));
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
        if (filteredOptions.length > 1) {
          if (selected <= 0) {
            setSelected(filteredOptions.length - 1);
          } else {
            setSelected(selected - 1);
          }
          return true;
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
        if (filteredOptions.length > 1) {
          if (selected >= filteredOptions.length - 1) {
            setSelected(0);
          } else {
            setSelected(selected + 1);
          }
          return true;
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
          return true;
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
          // moved to onPaste
          e.stopPropagation();
          return false;
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
    if (prevention.hasOperation(cell?.prevention, prevention.Write)) {
      console.warn('This cell is protected from writing.');
      return false;
    }
    dispatch(setEditingAddress(address));
    if (!editing) {
      dispatch(setInputting(''));
    }
    setSelected(0);
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
          data-sheet-id={sheetId}
          data-size="small"
          autoFocus={true}
          spellCheck={false}
          draggable={false}
          ref={editorRef}
          rows={numLines}
          onFocus={(e) => {
            table.wire.lastFocused = e.currentTarget;
          }}
          style={{ minWidth: width, minHeight: height }}
          onDoubleClick={(e) => {
            if (prevention.hasOperation(cell?.prevention, prevention.Write)) {
              console.warn('This cell is protected from writing.');
              return;
            }
            const input = e.currentTarget;
            if (!editing) {
              dispatch(setInputting(valueString));
              dispatch(setEditingAddress(address));
              window.setTimeout(() => {
                input.style.width = `${input.scrollWidth}px`;
                input.style.height = `${input.scrollHeight}px`;
                const length = new String(valueString).length;
                input.setSelectionRange(length, length);
              }, 20);
            }
          }}
          onBlur={(e) => {
            if (isRefInsertable(e.currentTarget)) {
              return true;
            } else {
              if (editing) {
                writeCell(e.currentTarget.value);
              }
            }
            dispatch(setEditingAddress(''));
          }}
          value={inputting}
          onChange={(e) => {
            if (prevention.hasOperation(cell?.prevention, prevention.Write)) {
              return;
            }
            dispatch(setInputting(e.currentTarget.value));
            setSelected(0);
          }}
          onPaste={(e) => {
            if (editing) {
              return true;
            }

            const onlyValue = shiftKey;
            const html = e.clipboardData?.getData?.('text/html');
            if (html) {
              dispatch(paste({ matrix: parseHTML(html), onlyValue }));
            } else {
              const text = e.clipboardData?.getData?.('text/plain');
              if (text) {
                dispatch(paste({ matrix: parseText(text), onlyValue }));
              } else {
                console.warn('No clipboard data found.');
              }
            }
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onKeyDown={handleKeyDown}
          onKeyUp={(e) => {
            setShiftKey(false);
            const selectingArea = zoneToArea(store.selectingZone);
            handleKeyUp?.(e, {
              pointing: choosing,
              selectingFrom: { y: selectingArea.top, x: selectingArea.left },
              selectingTo: { y: selectingArea.bottom, x: selectingArea.right },
            });
          }}
        />
      </div>
      <ul className="gs-editor-options" style={{ marginTop: editorRef.current?.scrollHeight }}>
        {filteredOptions.map((option, i) => (
          <li
            key={i}
            className={`gs-editor-option ${selected === i ? ' gs-editor-option-selected' : ''}`}
            onMouseDown={(e) => {
              selectValue(i);
              e.preventDefault();
              e.stopPropagation();
              return false;
            }}
          >
            {option.label ?? option.value}
          </li>
        ))}
      </ul>
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
              <span key={i} style={{ color: COLOR_PALETTE[existsIndex % COLOR_PALETTE.length] }}>
                {token.stringify()}
              </span>
            );
          }
          const color = COLOR_PALETTE[palletIndex % COLOR_PALETTE.length];
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
