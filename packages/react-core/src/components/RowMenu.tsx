import { type FC, useContext } from 'react';
import { Context } from '../store';
import { setRowMenu, insertRowsAbove, insertRowsBelow, removeRows } from '../store/actions';
import { Fixed } from './Fixed';
import * as prevention from '../lib/operation';
import { y2r } from '../lib/coords';
import { between } from '../lib/spatial';
import { copier, cutter, paster } from '../store/dispatchers';

export const RowMenu: FC = () => {
  const { store, dispatch } = useContext(Context);
  const { rowMenuState, tableReactive: tableRef, editorRef, selectingZone } = store;
  const table = tableRef.current;

  const y = rowMenuState?.y;
  const position = rowMenuState?.position;

  const handleClose = () => {
    dispatch(setRowMenu(null));
    editorRef.current?.focus();
  };

  if (!rowMenuState || !table || y == null || !position) {
    return null;
  }

  const rowCell = table.getCellByPoint({ y, x: 0 }, 'SYSTEM');

  // Calculate the number of selected rows that include the current row
  const selRowStart = Math.min(selectingZone.startY, selectingZone.endY);
  const selRowEnd = Math.max(selectingZone.startY, selectingZone.endY);
  const isFullRowSelection = selectingZone.startX === 1 && selectingZone.endX === table.getNumCols();
  const numSelectedRows =
    isFullRowSelection && between({ start: selectingZone.startY, end: selectingZone.endY }, y)
      ? selRowEnd - selRowStart + 1
      : 1;

  const insertDisabled = table.maxNumRows !== -1 && table.getNumRows() + numSelectedRows > table.maxNumRows;
  const insertAboveDisabled =
    insertDisabled || prevention.hasOperation(rowCell?.prevention, prevention.InsertRowsAbove);
  const insertBelowDisabled =
    insertDisabled || prevention.hasOperation(rowCell?.prevention, prevention.InsertRowsBelow);
  const removeDisabled =
    (table.minNumRows !== -1 && table.getNumRows() - numSelectedRows < table.minNumRows) ||
    prevention.hasOperation(rowCell?.prevention, prevention.RemoveRows);

  return (
    <Fixed
      className="gs-row-menu-modal"
      onClick={(e: MouseEvent) => {
        e.preventDefault();
        handleClose();
        return false;
      }}
    >
      <div className="gs-row-menu" style={{ top: position.y, left: position.x }} onClick={(e) => e.stopPropagation()}>
        <ul>
          <li
            className="gs-enabled"
            onClick={async () => {
              await cutter({ store, dispatch });
              dispatch(setRowMenu(null));
            }}
          >
            <div className="gs-menu-name">Cut</div>
          </li>
          <li
            className="gs-enabled"
            onClick={async () => {
              await copier({ store, dispatch });
              dispatch(setRowMenu(null));
            }}
          >
            <div className="gs-menu-name">Copy</div>
          </li>
          <li
            className="gs-enabled"
            onClick={async () => {
              await paster({ store, dispatch }, false);
              dispatch(setRowMenu(null));
            }}
          >
            <div className="gs-menu-name">Paste</div>
          </li>
          <li
            className="gs-enabled"
            onClick={async () => {
              await paster({ store, dispatch }, true);
              dispatch(setRowMenu(null));
            }}
          >
            <div className="gs-menu-name">Paste only value</div>
          </li>
          <li className="gs-menu-divider" />
          <li
            className={insertAboveDisabled ? 'gs-disabled' : 'gs-enabled'}
            onClick={() => {
              if (!insertAboveDisabled) {
                dispatch(insertRowsAbove({ numRows: numSelectedRows, y, operator: 'USER' }));
                dispatch(setRowMenu(null));
                editorRef.current?.focus();
              }
            }}
          >
            <div className="gs-menu-name">
              Insert {numSelectedRows} row{numSelectedRows > 1 ? 's' : ''} above
            </div>
          </li>
          <li
            className={insertBelowDisabled ? 'gs-disabled' : 'gs-enabled'}
            onClick={() => {
              if (!insertBelowDisabled) {
                dispatch(insertRowsBelow({ numRows: numSelectedRows, y, operator: 'USER' }));
                dispatch(setRowMenu(null));
                editorRef.current?.focus();
              }
            }}
          >
            <div className="gs-menu-name">
              Insert {numSelectedRows} row{numSelectedRows > 1 ? 's' : ''} below
            </div>
          </li>
          <li
            className={removeDisabled ? 'gs-disabled' : 'gs-enabled'}
            onClick={() => {
              if (!removeDisabled) {
                dispatch(removeRows({ numRows: numSelectedRows, y, operator: 'USER' }));
                dispatch(setRowMenu(null));
                editorRef.current?.focus();
              }
            }}
          >
            <div className="gs-menu-name">
              Remove {numSelectedRows} row{numSelectedRows > 1 ? 's' : ''}
            </div>
          </li>
        </ul>
      </div>
    </Fixed>
  );
};
