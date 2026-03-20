import type { FC } from 'react';
import {
  useContext,
  useEffect,
  useState,
  useCallback,
  memo,
} from 'react';
import { createPortal } from 'react-dom';
import { FunctionGuide } from './FunctionGuide';
import { EditorOptions } from './EditorOptions';
import { x2c, y2r } from '../lib/coords';
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
  setEditorHovering,
  updateSheet,
} from '../store/actions';

import { Context } from '../store';
import { areaToZone, zoneToArea } from '../lib/spatial';
import * as prevention from '../lib/operation';
import {
  expandInput,
  handleFormulaQuoteAutoClose,
  insertTextAtCursor,
  isFocus,
  isRefInsertable,
  resetInput,
} from '../lib/input';
import { focus } from '../lib/dom';
import { Lexer } from '../formula/evaluator';
import { COLOR_PALETTE } from '../lib/palette';
import { useAutocomplete } from './useAutocomplete';
import { EditorEventWithNativeEvent, FeedbackType, ModeType } from '../types';
import { Fixed } from './Fixed';
import { parseHTML, parseText } from '../lib/paste';
import React from 'react';

type Props = {
  mode: ModeType;
};

export const Editor: FC<Props> = ({ mode }: Props) => {
  const { store, dispatch } = useContext(Context);
  const [shiftKey, setShiftKey] = useState(false);
  const [selectionStart, setSelectionStart] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const {
    choosing,
    inputting,
    selectingZone,
    editorRect,
    editingAddress,
    entering,
    matchingCells,
    matchingCellIndex,
    searchQuery,
    editorRef,
    largeEditorRef,
    searchInputRef,
    editingOnEnter,
    sheetReactive: sheetRef,
    sheetId,
    dragging,
  } = store;
  const sheet = sheetRef.current;

  const renderOverlays = () => {
    if (!isFocused || !editing || typeof document === 'undefined') {
      return null;
    }
    if (editorRef.current !== document.activeElement) {
      return null;
    }

    const rect = editorRef.current?.getBoundingClientRect();
    if (!rect) {
      return null;
    }
    const { bottom: top, left } = rect;

    return createPortal(
      <>
        {activeFunctionHelp &&
          filteredOptions.length === 0 &&
          (!selectingZone || (selectingZone.endY === -1 && selectingZone.endX === -1)) && (
            <FunctionGuide
              activeFunctionGuide={activeFunctionHelp}
              activeArgIndex={activeArgIndex}
              top={top}
              left={left}
            />
          )}
        {filteredOptions.length > 0 && (
          <EditorOptions
            filteredOptions={filteredOptions}
            top={top}
            left={left}
            selected={selected}
            onOptionMouseDown={handleOptionMouseDown}
          />
        )}
      </>,
      document.body,
    );
  };

  if (!sheet) {
    return null;
  }

  const policy = sheet.getPolicyByPoint(choosing);
  const optionsAll = policy.getSelectOptions();

  const handleSelect = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setSelectionStart(e.currentTarget.selectionStart);
  }, []);

  const {
    filteredOptions,
    selected,
    setSelected,
    replaceWithOption,
    handleArrowUp,
    handleArrowDown,
    isFormula,
    activeFunctionHelp,
    activeArgIndex,
  } = useAutocomplete({
    inputting,
    selectionStart,
    optionsAll,
    functions: sheet.registry.functions,
  });

  useEffect(() => {
    focus(editorRef?.current);
  }, [editorRef]);

  useEffect(() => {
    if (sheet.registry.lastFocused == null) {
      return;
    }
    if (sheet.registry.lastFocused !== editorRef.current) {
      return;
    }
    if (sheet.registry.lastFocused !== largeEditorRef.current) {
      return;
    }

    dispatch(setEditingAddress(''));
  }, [sheet.registry.lastFocused, editorRef, largeEditorRef, dispatch]);
  useEffect(() => {
    sheet.registry.editingSheetId = sheetId;
    sheet.registry.editingAddress = editingAddress;
  }, [editingAddress, sheet, sheetId]);

  useEffect(() => {
    //sheet.registry.transmit();
    expandInput(editorRef.current);
  }, [inputting, editingAddress, editorRef]);

  const { y, x } = choosing;
  const rowId = `${y2r(y)}`;
  const colId = x2c(x);
  const address = `${colId}${rowId}`;
  const editing = editingAddress === address;

  // Use 'RAW' so that spilled values (stored in solvedCaches) are already
  // reflected in cell.value without re-evaluating the formula.
  const cell = sheet.getCellByPoint({ y, x }, 'RAW');
  const currentString = sheet.stringify({ point: choosing, cell, refEvaluation: 'RAW' });
  const [before, setBefore] = useState<string>(currentString);

  const writeCell = useCallback(
    (value: string) => {
      if (before !== value) {
        dispatch(write({ value }));
      }
      setBefore(value);
    },
    [before, dispatch],
  );

  const selectValue = useCallback(
    (selectedIndex: number) => {
      const option = filteredOptions[selectedIndex];
      if (option) {
        if (option.isFunction) {
          const { value: newValue, selectionStart: newCursor } = replaceWithOption(option);
          dispatch(setInputting(newValue));

          setTimeout(() => {
            if (editorRef.current) {
              focus(editorRef.current);
              editorRef.current.setSelectionRange(newCursor, newCursor);
            }
          }, 0);
        } else {
          const t = sheet.update({
            diff: { [address]: { value: option.value } },
            partial: true,
          });
          dispatch(updateSheet(t.clone()));
          dispatch(setEditingAddress(''));
          dispatch(setInputting(''));
        }
        setSelected(0);
      }
    },
    [filteredOptions, sheet, address, inputting, writeCell, dispatch, editorRef],
  );

  useEffect(() => {
    setBefore(currentString);
    dispatch(setInputting(currentString));
    resetInput(editorRef.current, sheet, choosing);
  }, [choosing, currentString, dispatch, editorRef, sheet]);

  const { y: top, x: left, height, width } = editorRect;

  const numLines = currentString.split('\n').length;
  const [isKeyDown, setIsKeyDown] = useState(false);
  const handleKeyDown = useCallback(
    (e: EditorEventWithNativeEvent) => {
      if (isKeyDown) {
        return;
      }
      // do not debounce it if control key is down.
      if (!(e.key === 'Meta' || e.key === 'Control')) {
        setIsKeyDown(true);
        requestAnimationFrame(() => {
          setIsKeyDown(false);
        });
      }
      const input = e.currentTarget;

      // Auto-close double quotes in formula mode
      if (handleFormulaQuoteAutoClose(e, inputting)) {
        dispatch(setInputting(input.value));
        return false;
      }

      const shiftKey = e.shiftKey;
      switch (e.key) {
        case 'Tab': // TAB
          e.preventDefault();
          if (editing) {
            if (filteredOptions.length) {
              const isFunction = filteredOptions[selected]?.isFunction;
              selectValue(selected);
              if (isFunction) {
                return false;
              }
            } else {
              writeCell(input.value);
              dispatch(setEditingAddress(''));
              dispatch(setInputting(''));
            }
          }
          dispatch(
            walk({
              numRows: sheet.getNumRows(),
              numCols: sheet.getNumCols(),
              deltaY: 0,
              deltaX: shiftKey ? -1 : 1,
            }),
          );
          dispatch(setEditingAddress(''));
          return false;

        case 'Enter': // ENTER
          if (editing) {
            if (filteredOptions.length) {
              const isFunction = filteredOptions[selected]?.isFunction;
              selectValue(selected);
              if (isFunction) {
                e.preventDefault();
                return false;
              }
            } else if (e.altKey) {
              insertTextAtCursor(input, '\n');
              dispatch(setInputting(input.value));
              e.preventDefault();
              return false;
            } else {
              if (e.nativeEvent.isComposing) {
                return false;
              }
              writeCell(input.value);
              dispatch(setEditingAddress(''));
              dispatch(setInputting(''));
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
              numRows: sheet.getNumRows(),
              numCols: sheet.getNumCols(),
              deltaY: shiftKey ? -1 : 1,
              deltaX: 0,
            }),
          );
          e.preventDefault();
          return false;

        case 'Backspace': // BACKSPACE
          if (!editing) {
            // Spilled cells are read-only — clearing them would only erase the
            // cached spill value while the origin formula remains intact, causing
            // a confusing state where the FormulaBar goes blank but the cell
            // visually still shows the spilled value after re-evaluation.
            // e.preventDefault() is required here: without it the browser still
            // fires the default textarea behavior (deletes one char), which
            // triggers onInput → setInputting, making the value shrink character
            // by character on each Backspace press.
            if (sheet.getSystemByPoint({ y, x })?.spilledFrom != null) {
              e.preventDefault();
              return false;
            }
            dispatch(clear(null));
            dispatch(setInputting(''));
            return false;
          }
          break;
        case 'Delete': // DELETE
          if (!editing) {
            // Same guard as Backspace — spilled cells must not be cleared directly.
            if (sheet.getSystemByPoint({ y, x })?.spilledFrom != null) {
              e.preventDefault();
              return false;
            }
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
                numRows: sheet.getNumRows(),
                numCols: sheet.getNumCols(),
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
                numRows: sheet.getNumRows(),
                numCols: sheet.getNumCols(),
                deltaY: -1,
                deltaX: 0,
              }),
            );
            return false;
          }
          if (handleArrowUp(e as unknown as React.KeyboardEvent<HTMLTextAreaElement>)) {
            return true;
          }
          break;
        case 'ArrowRight': // RIGHT
          if (!editing) {
            dispatch(
              arrow({
                shiftKey,
                numRows: sheet.getNumRows(),
                numCols: sheet.getNumCols(),
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
                numRows: sheet.getNumRows(),
                numCols: sheet.getNumCols(),
                deltaY: 1,
                deltaX: 0,
              }),
            );
            return false;
          }
          if (handleArrowDown(e as unknown as React.KeyboardEvent<HTMLTextAreaElement>)) {
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
                  endY: sheet.getNumRows(),
                  endX: sheet.getNumCols(),
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
              focus(input); // refocus
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
              requestAnimationFrame(() => focus(searchInputRef.current));
              return false;
            }
          }
          break;
        case 'r': // R
          if (e.ctrlKey || e.metaKey) {
            if (!editing) {
              e.preventDefault();
              dispatch(redo(null));
              requestAnimationFrame(() => dispatch(setInputting(''))); // resetting textarea
              return false;
            }
          }
          break;
        case 's': // S
          if (e.ctrlKey || e.metaKey) {
            if (!editing) {
              e.preventDefault();
              sheet.registry.onSave?.({
                sheet,
                points: {
                  pointing: choosing,
                  selectingFrom: {
                    y: selectingZone.startY,
                    x: selectingZone.startX,
                  },
                  selectingTo: {
                    y: selectingZone.endY,
                    x: selectingZone.endX,
                  },
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
              focus(input); // refocus

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
                //window.setTimeout(() => sync(setInputting('')), 100); // resetting textarea
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
    },
    [
      isKeyDown,
      editing,
      filteredOptions,
      selected,
      editingOnEnter,
      selectingZone,
      before,
      sheet,
      choosing,
      store,
      cell,
      address,
      writeCell,
      searchQuery,
      inputting,
    ],
  );

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      sheet.registry.lastFocused = e.currentTarget;
    },
    [sheet],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLTextAreaElement>) => {
      if (prevention.hasOperation(cell?.prevention, prevention.Write)) {
        console.warn('This cell is protected from writing.');
        return;
      }
      const input = e.currentTarget;
      if (!editing) {
        dispatch(setInputting(currentString));
        dispatch(setEditingAddress(address));
        requestAnimationFrame(() => {
          input.style.width = `${input.scrollWidth}px`;
          input.style.height = `${input.scrollHeight}px`;
          const length = new String(currentString).length;
          input.setSelectionRange(length, length);
        });
      }
    },
    [cell, editing, currentString, address],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      if (isRefInsertable(e.currentTarget)) {
        return true;
      } else {
        if (editing) {
          writeCell(e.currentTarget.value);
        }
      }
      dispatch(setEditingAddress(''));
    },
    [editing, writeCell, dispatch],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (prevention.hasOperation(cell?.prevention, prevention.Write)) {
        return;
      }
      dispatch(setInputting(e.currentTarget.value));
      setSelected(0);
    },
    [cell],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
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
    },
    [editing, shiftKey],
  );

  const handleKeyUpInternal = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      setShiftKey(false);
      const selectingArea = zoneToArea(store.selectingZone);
      sheet.registry.onKeyUp?.({
        e,
        points: {
          pointing: choosing,
          selectingFrom: { y: selectingArea.top, x: selectingArea.left },
          selectingTo: { y: selectingArea.bottom, x: selectingArea.right },
        },
      });
    },
    [store.selectingZone, choosing],
  );

  const handleOptionMouseDown = useCallback(
    (e: React.MouseEvent<HTMLLIElement>, index: number) => {
      selectValue(index);
      e.preventDefault();
      e.stopPropagation();
      return false;
    },
    [selectValue],
  );

  return (
    <Fixed
      className={`gs-editor ${editing ? 'gs-editing' : ''}`}
      style={editing ? { top, left, height } : {}}
      {...{
        'data-mode': mode,
        'data-sheet-id': sheetId,
      }}
    >
      <div className={`gs-cell-label ${editing ? ' gs-hidden' : ''}`}>{address}</div>
      <div className="gs-editor-inner" style={{ width }}>
        <pre
          className="gs-editor-hl"
          style={{
            //...cell?.style,
            height: editorRef.current?.scrollHeight,
            width: (editorRef.current?.scrollWidth ?? 0) - 4,
          }}
        >
          {(cell?.formulaEnabled ?? true) ? editorStyle(inputting) : inputting}
        </pre>
        <textarea
          data-sheet-id={sheetId}
          name="gs-editor-input"
          data-size="small"
          autoFocus={true}
          spellCheck={false}
          draggable={false}
          ref={editorRef}
          rows={numLines}
          onFocus={handleFocus}
          style={{ minWidth: width, minHeight: height }}
          onDoubleClick={handleDoubleClick}
          onBlur={handleBlur}
          value={inputting}
          onChange={handleChange}
          onSelect={handleSelect}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUpInternal}
          onMouseEnter={() => {
            dispatch(setEditorHovering(true));
          }}
          onMouseLeave={() => {
            dispatch(setEditorHovering(false));
          }}
        />
      </div>
      {renderOverlays()}
    </Fixed>
  );
};

// Memoized token span component to prevent unnecessary re-renders
const TokenSpan = memo<{
  token: any;
  tokenKey: string;
  color?: string;
  className?: string;
}>(
  ({ token, tokenKey, color, className }) => {
    return (
      <span key={tokenKey} style={color ? { color } : undefined} className={className}>
        {token.stringify()}
      </span>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.tokenKey === nextProps.tokenKey &&
      prevProps.color === nextProps.color &&
      prevProps.className === nextProps.className &&
      prevProps.token.stringify() === nextProps.token.stringify()
    );
  },
);

export const editorStyle = (text: string) => {
  if (text[0] !== '=') {
    return <>{text}</>;
  }

  const lexer = new Lexer(text.substring(1));
  lexer.tokenize();
  let palletIndex = 0;
  const exists: { [ref: string]: number } = {};

  // Create a simple hash of the formula for stable keys
  const formulaHash = text.split('').reduce((hash, char) => {
    return ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff;
  }, 0);

  return (
    <>
      =
      {lexer.tokens.map((token, i) => {
        // Handle SPACE tokens differently - render as plain text
        if (token.type === 'SPACE') {
          return <React.Fragment key={`${formulaHash}-SPACE-${i}`}>{token.stringify()}</React.Fragment>;
        }

        // Create a stable key based on formula hash, token content and index
        const tokenKey = `${formulaHash}-${token.type}-${token.stringify()}-${i}`;

        if (token.type === 'REF' || token.type === 'RANGE') {
          const normalizedToken = token.stringify();
          const existsIndex = exists[normalizedToken];
          if (existsIndex !== undefined) {
            return (
              <TokenSpan
                key={tokenKey}
                token={token}
                tokenKey={tokenKey}
                color={COLOR_PALETTE[existsIndex % COLOR_PALETTE.length]}
              />
            );
          }
          const color = COLOR_PALETTE[palletIndex % COLOR_PALETTE.length];
          exists[normalizedToken] = palletIndex++;
          return (
            <TokenSpan
              key={tokenKey}
              token={token}
              tokenKey={tokenKey}
              color={color}
              className={`gs-token-type-${token.type}`}
            />
          );
        }

        return (
          <TokenSpan
            key={tokenKey}
            token={token}
            tokenKey={tokenKey}
            className={`gs-token-type-${token.type} gs-token-entity-type-${typeof token.entity}`}
          />
        );
      })}
    </>
  );
};
