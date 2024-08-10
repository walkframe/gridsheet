import React from 'react';
import { Context } from '../store';
import { p2a } from '../lib/converters';
import { setEditingCell, setLastEdited, walk, write } from '../store/actions';
import * as prevention from '../lib/prevention';
import { expandInput, insertTextAtCursor } from '../lib/input';

type Props = {
  width: number;
};

export const FormulaBar: React.FC<Props> = ({ width }) => {
  const { store, dispatch } = React.useContext(Context);
  const [origin, setOrigin] = React.useState('');
  const { choosing, editorRef, largeEditorRef, table } = store;

  const address = choosing.x === -1 ? '' : p2a(choosing);
  React.useEffect(() => {
    let value = table.getByPoint(choosing)?.value || '';
    // debug to remove this line
    value = table.stringify(choosing, value);
    largeEditorRef.current!.value = value;
    setOrigin(value as string);
  }, [address, table]);

  const writeCell = (value: string) => {
    if (origin !== value) {
      dispatch(write(value));
    }
    dispatch(setEditingCell(''));
    editorRef.current!.focus();
  };

  const sync = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const largeInput = e.currentTarget;
    // Cursor position is not synchronized properly and is delayed by setTimeout
    window.setTimeout(() => {
      const start = largeInput.selectionStart;
      editorRef.current!.value = largeInput.value;
      editorRef.current!.selectionStart = start;
    }, 0)
    expandInput(largeInput);
  }

  return (
    <label className="gs-formula-bar" style={{ width: width - 1 }}>
      <div className="gs-selecting-address">{address}</div>
      <div className="gs-fx">Fx</div>
      <textarea
        rows={1}
        ref={largeEditorRef}
        onInput={sync}
        onFocus={sync}
        onChange={sync}
        onBlur={(e) => {
          dispatch(setLastEdited(origin));
          if (e.target.value.startsWith('=')) {
            return false;
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
              input.value = origin;
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
