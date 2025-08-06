import type { KeyboardEvent } from 'react';
import { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Context } from '../store';
import { p2a } from '../lib/converters';
import { setEditingAddress, setInputting, walk, write } from '../store/actions';
import * as prevention from '../lib/operation';
import { insertTextAtCursor } from '../lib/input';
import { editorStyle } from './Editor';
import { ScrollHandle } from './ScrollHandle';

type FormulaBarProps = {
  ready: boolean;
};

export const FormulaBar = ({ ready }: FormulaBarProps) => {
  const { store, dispatch } = useContext(Context);
  const [before, setBefore] = useState('');
  const {
    choosing,
    editorRef,
    largeEditorRef,
    tableReactive: tableRef,
    inputting,
    editingAddress: editingCell,
  } = store;
  const table = tableRef.current;
  const hlRef = useRef<HTMLDivElement | null>(null);

  const address = choosing.x === -1 ? '' : p2a(choosing);
  const cell = table?.getCellByPoint(choosing, 'SYSTEM');
  useEffect(() => {
    if (!table) {
      return;
    }
    let value = table.getCellByPoint(choosing, 'SYSTEM')?.value ?? '';
    // debug to remove this line
    value = table.stringify({ point: choosing, cell: { ...cell, value }, refEvaluation: 'RAW' });
    largeEditorRef.current!.value = value;
    setBefore(value as string);
  }, [address, table]);

  const writeCell = useCallback(
    (value: string) => {
      if (before !== value) {
        dispatch(write({ value }));
      }
      dispatch(setEditingAddress(''));
      editorRef.current!.focus();
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

  const largeInput = largeEditorRef.current;

  const handleInput = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    dispatch(setInputting(e.currentTarget.value));
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
      if (!largeInput || !table) {
        return;
      }
      dispatch(setEditingAddress(address));
      table.wire.lastFocused = e.currentTarget;
    },
    [largeInput, address, table],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
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
      if (e.ctrlKey || !table) {
        return true;
      }
      const input = e.currentTarget;

      switch (e.key) {
        case 'Enter': {
          if (e.altKey) {
            insertTextAtCursor(input, '\n');
          } else {
            writeCell(input.value);
            dispatch(setInputting(''));
            dispatch(
              walk({
                numRows: table.getNumRows(),
                numCols: table.getNumCols(),
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
          editorRef.current!.focus();

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

      const cell = table.getCellByPoint(choosing, 'SYSTEM');
      if (prevention.hasOperation(cell?.prevention, prevention.Write)) {
        console.warn('This cell is protected from writing.');
        e.preventDefault();
      }
      updateScroll();
      return false;
    },
    [table, choosing, before, writeCell, updateScroll],
  );

  const style: React.CSSProperties = ready ? {} : { visibility: 'hidden' };
  if (!table) {
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
  return (
    <label className="gs-formula-bar" data-sheet-id={store.sheetId} style={style}>
      <ScrollHandle style={{ position: 'absolute', left: 0, top: 0, zIndex: 2 }} vertical={-1} />
      <div className="gs-selecting-address">{address}</div>
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
          {cell?.disableFormula ? inputting : editorStyle(inputting)}
        </div>
        <textarea
          name="gs-formula-bar-editor"
          data-sheet-id={store.sheetId}
          data-size="large"
          rows={1}
          spellCheck={false}
          ref={largeEditorRef}
          value={inputting}
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onKeyUp={updateScroll}
          onScroll={updateScroll}
        ></textarea>
      </div>
    </label>
  );
};
