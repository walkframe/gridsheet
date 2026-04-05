import type { KeyboardEvent } from 'react';
import React, { useCallback, useEffect, useRef, useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import { FunctionGuide } from './FunctionGuide';
import { EditorOptions } from './EditorOptions';
import { Context } from '../store';
import { p2a, a2p } from '@gridsheet/core';
import { setEditingAddress, setInputting, setEditorHovering, walk, write, updateSheet } from '../store/actions';
import { operations as prevention } from '@gridsheet/core';
import { handleFormulaQuoteAutoClose, insertTextAtCursor, isFocus } from '@gridsheet/core';
import { focus } from '@gridsheet/core';
import { editorStyle } from './Editor';
import { ScrollHandle } from './ScrollHandle';
import { useAutocomplete } from './useAutocomplete';

type FormulaBarProps = {
  ready: boolean;
};

export const FormulaBar = ({ ready }: FormulaBarProps) => {
  const { store, dispatch } = useContext(Context);
  const [before, setBefore] = useState('');
  const [selectionStart, setSelectionStart] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const {
    choosing,
    selectingZone,
    editorRef,
    largeEditorRef,
    sheetReactive: sheetRef,
    inputting,
    editingAddress: editingCell,
    dragging,
  } = store;
  const sheet = sheetRef.current;
  const hlRef = useRef<HTMLDivElement | null>(null);

  const address = choosing.x === -1 ? '' : p2a(choosing);
  const cell = sheet?.getCell(choosing, { resolution: 'SYSTEM' });
  const spilledFromAddress = sheet?.getSystem(choosing)?.spilledFrom;
  const originPoint = spilledFromAddress ? a2p(spilledFromAddress) : undefined;
  const originAddress = originPoint != null ? p2a(originPoint) : undefined;
  useEffect(() => {
    if (!sheet) {
      return;
    }
    let value = sheet.getCell(choosing, { resolution: 'SYSTEM' })?.value ?? '';
    // debug to remove this line
    value = sheet.getSerializedValue({ point: choosing, cell: { ...cell, value }, resolution: 'RAW' });
    largeEditorRef.current!.value = value;
    setBefore(value as string);
  }, [address, sheet]);

  const writeCell = useCallback(
    (value: string) => {
      if (before !== value) {
        dispatch(write({ value }));
      }
      dispatch(setEditingAddress(''));
      focus(editorRef.current);
    },
    [before],
  );

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      entries.forEach(updateScroll);
    });
    if (largeEditorRef.current) {
      observer.observe(largeEditorRef.current);
    }
    return () => {
      observer.disconnect();
    };
  }, []);

  const policy = sheet?.getPolicy(choosing);
  const optionsAll = policy?.getSelectOptions() || [];

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
    functions: sheet?.registry.functions,
  });

  const composingRef = useRef(false);
  const largeInput = largeEditorRef.current;

  const handleInput = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    dispatch(setInputting(e.currentTarget.value));
    setSelectionStart(e.currentTarget.selectionStart);
  }, []);

  const handleSelect = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setSelectionStart(e.currentTarget.selectionStart);
  }, []);

  const updateScroll = useCallback(() => {
    if (!hlRef.current || !largeEditorRef.current) {
      return;
    }
    hlRef.current.style.height = `${largeEditorRef.current.clientHeight}px`;
    hlRef.current.scrollLeft = largeEditorRef.current.scrollLeft;
    hlRef.current.scrollTop = largeEditorRef.current.scrollTop;
  }, []);

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      if (!largeInput || !sheet) {
        return;
      }
      setIsFocused(true);
      dispatch(setEditingAddress(address));
      sheet.registry.lastFocused = e.currentTarget;
    },
    [largeInput, address, sheet],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      if (e.currentTarget.value!.startsWith('=')) {
        return true;
      } else {
        if (editingCell) {
          writeCell(e.currentTarget.value);
        }
      }
    },
    [editingCell, writeCell],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.nativeEvent as any).isComposing || composingRef.current) {
        return;
      }
      if (e.ctrlKey || !sheet) {
        return true;
      }
      const input = e.currentTarget;

      // Auto-close double quotes in formula mode
      if (handleFormulaQuoteAutoClose(e, inputting)) {
        dispatch(setInputting(input.value));
        return false;
      }

      switch (e.key) {
        case 'Tab': // TAB
          e.preventDefault();
          if (filteredOptions.length) {
            const option = filteredOptions[selected];
            const isFunc = option?.isFunction;

            if (isFunc) {
              const { value: newValue, selectionStart: newCursor } = replaceWithOption(option);
              dispatch(setInputting(newValue));
              setTimeout(() => {
                if (largeEditorRef.current) {
                  focus(largeEditorRef.current);
                  largeEditorRef.current.setSelectionRange(newCursor, newCursor);
                }
              }, 0);
              return false;
            } else {
              // ... regular completion ...
              const t = sheet.update({ diff: { [address]: { value: option.value } }, partial: true });
              dispatch(updateSheet(t.clone()));
              dispatch(setEditingAddress(''));
              dispatch(setInputting(''));
            }
          }
          break;
        case 'ArrowUp':
          if (handleArrowUp(e as unknown as React.KeyboardEvent<HTMLTextAreaElement>)) {
            return true;
          }
          break;
        case 'ArrowDown':
          if (handleArrowDown(e as unknown as React.KeyboardEvent<HTMLTextAreaElement>)) {
            return true;
          }
          break;
        case 'Enter': {
          if (filteredOptions.length) {
            const option = filteredOptions[selected];
            if (option?.isFunction) {
              const { value: newValue, selectionStart: newCursor } = replaceWithOption(option);
              dispatch(setInputting(newValue));
              setTimeout(() => {
                if (largeEditorRef.current) {
                  focus(largeEditorRef.current);
                  largeEditorRef.current.setSelectionRange(newCursor, newCursor);
                }
              }, 0);
              e.preventDefault();
              return false;
            }
          }

          if (e.altKey) {
            insertTextAtCursor(input, '\n');
          } else {
            writeCell(input.value);
            dispatch(setInputting(''));
            dispatch(
              walk({
                numRows: sheet.numRows,
                numCols: sheet.numCols,
                deltaY: 1,
                deltaX: 0,
              }),
            );
            e.preventDefault();
            return false;
          }
          break;
        }
        case 'Escape': {
          input.value = before;
          dispatch(setInputting(before));
          dispatch(setEditingAddress(''));
          e.preventDefault();
          focus(editorRef.current);

          break;
        }
        case 'a': // A
          if (e.ctrlKey || e.metaKey) {
            return true;
          }
        case 'c': // C
          if (e.ctrlKey || e.metaKey) {
            return true;
          }
          break;
        case 'v': // V
          if (e.ctrlKey || e.metaKey) {
            return true;
          }
          break;
      }

      const cell = sheet.getCell(choosing, { resolution: 'SYSTEM' });
      if (prevention.hasOperation(cell?.prevention, prevention.Write)) {
        console.warn('This cell is protected from writing.');
        e.preventDefault();
      }
      updateScroll();
      return false;
    },
    [
      sheet,
      choosing,
      address,
      before,
      writeCell,
      updateScroll,
      filteredOptions,
      selected,
      replaceWithOption,
      handleArrowUp,
      handleArrowDown,
      inputting,
    ],
  );

  const handleOptionMouseDown = useCallback(
    (e: React.MouseEvent, i: number) => {
      e.preventDefault();
      e.stopPropagation();
      const option = filteredOptions[i];
      if (option.isFunction) {
        const { value: newValue, selectionStart: newCursor } = replaceWithOption(option);
        writeCell(newValue);
        dispatch(setInputting(newValue));
        setTimeout(() => {
          if (largeEditorRef.current) {
            focus(largeEditorRef.current);
            largeEditorRef.current.setSelectionRange(newCursor, newCursor);
          }
        }, 0);
      }
    },
    [filteredOptions, replaceWithOption, writeCell, dispatch],
  );

  const style: React.CSSProperties = ready ? {} : { visibility: 'hidden' };
  if (!sheet) {
    return (
      <label className="gs-formula-bar gs-hidden" style={style}>
        <div className="gs-selecting-address"></div>
        <div className="gs-fx">Fx</div>
        <div className="gs-formula-bar-editor-inner">
          <textarea />
        </div>
      </label>
    );
  }
  const renderOverlays = () => {
    if (!isFocused || typeof document === 'undefined') {
      return null;
    }
    if (largeEditorRef.current !== document.activeElement) {
      return null;
    }

    const rect = largeEditorRef.current?.getBoundingClientRect();
    if (!rect) {
      return null;
    }

    const top = rect.bottom;
    const left = rect.left;

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
        {filteredOptions.length > 0 && choosing.x !== -1 && (
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

  return (
    <div
      className="gs-formula-bar"
      data-sheet-id={store.sheetId}
      data-spill={originAddress != null ? 'true' : undefined}
      style={style}
    >
      <ScrollHandle style={{ position: 'absolute', left: 0, top: 0, zIndex: 2 }} vertical={-1} />
      <div className="gs-selecting-address">{originAddress != null ? originAddress : address}</div>
      <div className="gs-fx">Fx</div>
      <div className="gs-formula-bar-editor-inner">
        <div
          className="gs-editor-hl"
          ref={hlRef}
          style={{
            height: largeEditorRef.current?.clientHeight,
            width: '100%',
          }}
        >
          {(cell?.formulaEnabled ?? true) ? editorStyle(inputting) : inputting}
        </div>
        <textarea
          name="gs-formula-bar-editor"
          data-sheet-id={store.sheetId}
          data-size="large"
          rows={1}
          spellCheck={false}
          ref={largeEditorRef}
          value={inputting}
          // Spilled cells must not be edited from the FormulaBar — input here
          // would modify `inputting` one character at a time (via onInput) even
          // though the underlying cell cannot be written to.
          readOnly={originAddress != null}
          onInput={handleInput}
          onFocus={handleFocus}
          onSelect={handleSelect}
          onPaste={(e) => {
            e.stopPropagation();
          }}
          onKeyDown={handleKeyDown}
          onKeyUp={updateScroll}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={(e) => {
            composingRef.current = false;
            dispatch(setInputting(e.currentTarget.value));
          }}
          onScroll={updateScroll}
          onMouseEnter={(e) => {
            dispatch(setEditorHovering(true));
          }}
          onMouseLeave={(e) => {
            dispatch(setEditorHovering(false));
          }}
        ></textarea>
        {renderOverlays()}
      </div>
    </div>
  );
};
