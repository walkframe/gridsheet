import React from 'react';
import { Context } from '../store';
import { p2a } from '../lib/converters';
import { setEditingCell, setInputting, setLastEdited, setLastFocusedRef, walk, write } from '../store/actions';
import * as prevention from '../lib/prevention';
import { insertTextAtCursor } from '../lib/input';
import { useSheetContext } from './SheetProvider';
import { editorStyle } from './Editor';

export const FormulaBar: React.FC = () => {
  const { store, dispatch } = React.useContext(Context);
  const [before, setBefore] = React.useState('');
  const { choosing, editorRef, largeEditorRef, table, inputting, editingCell } = store;
  const [, sheetContext] = useSheetContext();
  const hlRef = React.useRef<HTMLDivElement | null>(null);

  const address = choosing.x === -1 ? '' : p2a(choosing);
  React.useEffect(() => {
    let value = table.getByPoint(choosing)?.value ?? '';
    // debug to remove this line
    value = table.stringify(choosing, value);
    largeEditorRef.current!.value = value;
    setBefore(value as string);
  }, [address, table]);

  const writeCell = (value: string) => {
    if (before !== value) {
      dispatch(write(value));
    }
    dispatch(setEditingCell(''));
    editorRef.current!.focus();
  };
  React.useEffect(() => {
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

  const handleFocus = () => {
    if (!largeInput) {
      return;
    }
    dispatch(setEditingCell(address));
    dispatch(setLastFocusedRef(largeEditorRef));
    sheetContext?.setLastFocusedRef?.(largeEditorRef);
  };
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    dispatch(setInputting(e.currentTarget.value));
    sheetContext?.forceRender?.();
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
          {editorStyle(inputting)}
        </div>
        <textarea
          rows={1}
          spellCheck={false}
          ref={largeEditorRef}
          value={inputting}
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={(e) => {
            dispatch(setLastEdited(before));
            if (e.target.value.startsWith('=')) {
              return true;
            } else {
              if (editingCell) {
                writeCell(e.target.value);
              }
            }
          }}
          onKeyDown={(e) => {
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
                dispatch(setEditingCell(''));
                e.preventDefault();
                editorRef.current!.focus();

                break;
              }
            }

            const cell = table.getByPoint(choosing);
            if (prevention.isPrevented(cell?.prevention, prevention.Write)) {
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
