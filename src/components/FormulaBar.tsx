import React from 'react';
import { Context } from '../store';
import { p2a } from '../lib/converters';
import { setEditingCell, setLastEdited, setLastFocusedRef, walk, write } from '../store/actions';
import * as prevention from '../lib/prevention';
import { copyInput, insertTextAtCursor } from '../lib/input';
import { useSheetContext } from './SheetProvider';

type Props = {
  width: number;
};

export const FormulaBar: React.FC<Props> = ({ width }) => {
  const { store, dispatch } = React.useContext(Context);
  const [before, setBefore] = React.useState('');
  const { choosing, editorRef, largeEditorRef, table } = store;

  const [, sheetContext] = useSheetContext();

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

  const largeInput = largeEditorRef.current;

  const handleFocus = () => {
    if (!largeInput) {
      return;
    }
    copyInput(largeInput, editorRef.current);
    dispatch(setEditingCell(address));
    dispatch(setLastFocusedRef(largeEditorRef));
    sheetContext?.setLastFocusedRef?.(largeEditorRef);
  };
  const handleChange = () => {
    copyInput(largeInput, editorRef.current);
    sheetContext?.forceRender?.();
  };

  return (
    <label className="gs-formula-bar" style={{ width: width + 1 }}>
      <div className="gs-selecting-address">{address}</div>
      <div className="gs-fx">Fx</div>
      <textarea
        rows={1}
        ref={largeEditorRef}
        onInput={handleChange}
        //onChange={handleChange}
        onFocus={handleFocus}
        onBlur={(e) => {
          dispatch(setLastEdited(before));
          if (e.target.value.startsWith('=')) {
            return true;
          } else {
            writeCell(e.target.value);
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
                input.value = '';
                editorRef.current!.value = '';
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
          return false;
        }}
      ></textarea>
    </label>
  );
};
