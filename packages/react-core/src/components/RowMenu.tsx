import { type FC, useContext } from 'react';
import { Context } from '../store';
import { setRowMenu, insertRowsAbove, insertRowsBelow, removeRows } from '../store/actions';
import { Fixed } from './Fixed';
import * as prevention from '../lib/operation';
import { y2r } from '../lib/coords';
import { between } from '../lib/spatial';
import { copier, cutter, paster, searcher } from '../store/dispatchers';
import { focus } from '../lib/dom';

export const RowMenu: FC = () => {
  const { store, dispatch } = useContext(Context);
  const { rowMenuState, sheetReactive: sheetRef, editorRef, selectingZone } = store;
  const sheet = sheetRef.current;

  const y = rowMenuState?.y;
  const position = rowMenuState?.position;

  const handleClose = () => {
    dispatch(setRowMenu(null));
    focus(editorRef.current);
  };

  if (!rowMenuState || !sheet || y == null || !position) {
    return null;
  }

  const rowCell = sheet.getCellByPoint({ y, x: 0 }, 'SYSTEM');

  // Calculate the number of selected rows that include the current row
  const selRowStart = Math.min(selectingZone.startY, selectingZone.endY);
  const selRowEnd = Math.max(selectingZone.startY, selectingZone.endY);
  const isFullRowSelection = selectingZone.startX === 1 && selectingZone.endX === sheet.getNumCols();
  const numSelectedRows =
    isFullRowSelection && between({ start: selectingZone.startY, end: selectingZone.endY }, y)
      ? selRowEnd - selRowStart + 1
      : 1;

  const insertDisabled = sheet.maxNumRows !== -1 && sheet.getNumRows() + numSelectedRows > sheet.maxNumRows;
  const insertAboveDisabled =
    insertDisabled || prevention.hasOperation(rowCell?.prevention, prevention.InsertRowsAbove);
  const insertBelowDisabled =
    insertDisabled || prevention.hasOperation(rowCell?.prevention, prevention.InsertRowsBelow);
  const removeDisabled =
    (sheet.minNumRows !== -1 && sheet.getNumRows() - numSelectedRows < sheet.minNumRows) ||
    prevention.hasOperation(rowCell?.prevention, prevention.RemoveRows);

  return (
    <Fixed
      className="gs-menu-modal gs-row-menu-modal"
      onClick={(e: MouseEvent) => {
        e.preventDefault();
        handleClose();
        return false;
      }}
    >
      <div className="gs-row-menu" style={{ top: position.y, left: position.x }} onClick={(e) => e.stopPropagation()}>
        <ul className="gs-menu-items">
          <li
            className="gs-menu-item gs-enabled"
            onClick={async () => {
              await cutter({ store, dispatch });
              dispatch(setRowMenu(null));
            }}
          >
            <div className="gs-menu-name">Cut</div>
            <div className="gs-menu-shortcut">
              <span className="gs-menu-underline">X</span>
            </div>
          </li>
          <li
            className="gs-menu-item gs-enabled"
            onClick={async () => {
              await copier({ store, dispatch });
              dispatch(setRowMenu(null));
            }}
          >
            <div className="gs-menu-name">Copy</div>
            <div className="gs-menu-shortcut">
              <span className="gs-menu-underline">C</span>
            </div>
          </li>
          <li
            className="gs-menu-item gs-enabled"
            onClick={async () => {
              await paster({ store, dispatch }, false);
              dispatch(setRowMenu(null));
            }}
          >
            <div className="gs-menu-name">Paste</div>
            <div className="gs-menu-shortcut">
              <span className="gs-menu-underline">V</span>
            </div>
          </li>
          <li
            className="gs-menu-item gs-enabled"
            onClick={async () => {
              await paster({ store, dispatch }, true);
              dispatch(setRowMenu(null));
            }}
          >
            <div className="gs-menu-name">Paste only value</div>
            <div className="gs-menu-shortcut">
              Shift + <span className="gs-menu-underline">V</span>
            </div>
          </li>
          <li className="gs-menu-divider" />
          <li
            className={`gs-menu-item ${insertAboveDisabled ? 'gs-disabled' : 'gs-enabled'}`}
            onClick={() => {
              if (!insertAboveDisabled) {
                dispatch(insertRowsAbove({ numRows: numSelectedRows, y, operator: 'USER' }));
                dispatch(setRowMenu(null));
                focus(editorRef.current);
              }
            }}
          >
            <div className="gs-menu-name">
              Insert {numSelectedRows} row{numSelectedRows > 1 ? 's' : ''} above
            </div>
          </li>
          <li
            className={`gs-menu-item ${insertBelowDisabled ? 'gs-disabled' : 'gs-enabled'}`}
            onClick={() => {
              if (!insertBelowDisabled) {
                dispatch(insertRowsBelow({ numRows: numSelectedRows, y, operator: 'USER' }));
                dispatch(setRowMenu(null));
                focus(editorRef.current);
              }
            }}
          >
            <div className="gs-menu-name">
              Insert {numSelectedRows} row{numSelectedRows > 1 ? 's' : ''} below
            </div>
          </li>
          <li
            className={`gs-menu-item ${removeDisabled ? 'gs-disabled' : 'gs-enabled'}`}
            onClick={() => {
              if (!removeDisabled) {
                dispatch(removeRows({ numRows: numSelectedRows, y, operator: 'USER' }));
                dispatch(setRowMenu(null));
                focus(editorRef.current);
              }
            }}
          >
            <div className="gs-menu-name">
              Remove {numSelectedRows} row{numSelectedRows > 1 ? 's' : ''}
            </div>
          </li>
          <li className="gs-menu-divider" />
          <li
            className="gs-menu-item gs-enabled"
            onClick={async () => {
              await searcher({ store, dispatch });
              dispatch(setRowMenu(null));
            }}
          >
            <div className="gs-menu-name">Search</div>
            <div className="gs-menu-shortcut">
              <span className="gs-menu-underline">F</span>
            </div>
          </li>
        </ul>
      </div>
    </Fixed>
  );
};
