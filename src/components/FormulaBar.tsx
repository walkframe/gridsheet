import React from 'react';
import { Context } from '../store';
import { p2a } from '../lib/converters';
import { blur, setEditingCell, walk, write } from '../store/actions';
import * as prevention from '../lib/prevention';
import { insertNewLineAtCursor } from '../lib/input';

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

  return (
    <label className="gs-formula-bar" style={{ width }}>
      <div className="gs-selecting-address">
        {address}
      </div>
      <div
        className="gs-fx"
      >
        Fx
      </div>
      <textarea
          rows={1}
          ref={largeEditorRef}
          onInput={(e) => {
            dispatch(setEditingCell(address));
            editorRef.current!.value = e.currentTarget.value;
          }}
          onBlur={(e) => {
            writeCell(e.currentTarget.value);
            dispatch(blur(null));
          }}
          onKeyDown={(e) => {
            const input = e.currentTarget;
            switch (e.key) {
              case 'Enter': {
                if (e.altKey) {
                  insertNewLineAtCursor(input);
                } else {
                  writeCell(input.value);
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
