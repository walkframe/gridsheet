import type { KeyboardEvent } from 'react';
import { useContext, useEffect, useState, useRef } from 'react';
import { Context } from '../store';
import { p2a } from '../lib/converters';
import { setEditingAddress, setInputting, walk, write } from '../store/actions';
import * as prevention from '../lib/operation';
import { insertTextAtCursor } from '../lib/input';
import { editorStyle } from './Editor';
import { ScrollHandle } from './ScrollHandle';

export const FormulaBar = () => {
  const { store, dispatch } = useContext(Context);
  const [before, setBefore] = useState('');
  const { choosing, editorRef, largeEditorRef, table, inputting, editingAddress: editingCell } = store;
  const hlRef = useRef<HTMLDivElement | null>(null);

  const address = choosing.x === -1 ? '' : p2a(choosing);
  const cell = table.getByPoint(choosing);
  useEffect(() => {
    let value = table.getByPoint(choosing)?.value ?? '';
    // debug to remove this line
    value = table.stringify({ point: choosing, cell: { ...cell, value }, refEvaluation: 'raw' });
    largeEditorRef.current!.value = value;
    setBefore(value as string);
  }, [address, table]);

  const writeCell = (value: string) => {
    if (before !== value) {
      dispatch(write({ value }));
    }
    dispatch(setEditingAddress(''));
    editorRef.current!.focus();
  };
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

  const handleInput = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    dispatch(setInputting(e.currentTarget.value));
  };

  const updateScroll = () => {
    if (!hlRef.current || !largeEditorRef.current) {
      return;
    }
    hlRef.current.style.height = `${largeEditorRef.current.clientHeight}px`;
    hlRef.current.scrollLeft = largeEditorRef.current.scrollLeft;
    hlRef.current.scrollTop = largeEditorRef.current.scrollTop;
  };
  return (
    <label className="gs-formula-bar">
      <ScrollHandle style={{ position: 'absolute', left: 0, top: 0, zIndex: 2 }} vertical={-1} />
      <div className="gs-selecting-address">{address}</div>
      <div className="gs-fx">Fx</div>
      <div className="gs-formula-bar-editor-inner">
        <div
          className="gs-editor-hl"
          ref={hlRef}
          style={{
            height: largeEditorRef.current?.clientHeight,
            width: largeEditorRef.current?.clientWidth,
          }}
        >
          {cell?.disableFormula ? inputting : editorStyle(inputting)}
        </div>
        <textarea
          data-sheet-id={store.sheetId}
          data-size="large"
          rows={1}
          spellCheck={false}
          ref={largeEditorRef}
          value={inputting}
          onInput={handleInput}
          onFocus={(e) => {
            if (!largeInput) {
              return;
            }
            dispatch(setEditingAddress(address));
            table.wire.lastFocused = e.currentTarget;
          }}
          onBlur={(e) => {
            if (e.currentTarget.value!.startsWith('=')) {
              return true;
            } else {
              if (editingCell) {
                writeCell(e.currentTarget.value);
              }
            }
          }}
          onKeyDown={(e) => {
            if (e.ctrlKey) {
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

            const cell = table.getByPoint(choosing);
            if (prevention.hasOperation(cell?.prevention, prevention.Write)) {
              console.warn('This cell is protected from writing.');
              e.preventDefault();
            }
            updateScroll();
            return false;
          }}
          onKeyUp={updateScroll}
          onScroll={updateScroll}
        ></textarea>
      </div>
    </label>
  );
};
