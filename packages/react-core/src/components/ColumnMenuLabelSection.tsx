import { type FC, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Context } from '../store';
import { setStore } from '../store/actions';
import { operations as prevention } from '@gridsheet/core';
import { x2c, p2a } from '@gridsheet/core';
import { getLabel } from '@gridsheet/core';
import { registerMenuComponent, type ColMenuSectionProps } from '../lib/menu';

const LabelSection: FC<ColMenuSectionProps> = ({ x, close }) => {
  const { store, dispatch } = useContext(Context);
  const { sheetReactive: sheetRef } = store;
  const sheet = sheetRef.current;
  const labelInputRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState('');

  // Restore label value when x changes
  useEffect(() => {
    if (sheet) {
      const colCell = sheet.getCell({ y: 0, x }, { resolution: 'SYSTEM' });
      setLabel(colCell?.label ?? '');
    }
  }, [x, sheet]);

  const handleApplyLabel = useCallback(() => {
    if (!sheet) {
      return;
    }
    const address = p2a({ y: 0, x });
    sheet.update({
      diff: { [address]: { label: label || undefined } },
      partial: true,
      ignoreFields: [],
      undoReflection: {
        sheetId: sheet.id,
        selectingZone: store.selectingZone,
        choosing: store.choosing,
      },
      redoReflection: {
        sheetId: sheet.id,
        selectingZone: store.selectingZone,
        choosing: store.choosing,
      },
    });
    dispatch(setStore({ sheetReactive: { current: sheet } }));
    close();
  }, [dispatch, x, label, close, sheet, store.selectingZone, store.choosing]);

  if (!sheet) {
    return null;
  }

  const colCell = sheet.getCell({ y: 0, x }, { resolution: 'SYSTEM' });
  const labelDisabled = prevention.hasOperation(colCell?.prevention, prevention.SetLabel);
  const labelPlaceholder = getLabel(sheet, colCell?.label, { y: 0, x }, x) ?? x2c(x);

  return (
    <li className={`gs-menu-item gs-column-menu-label${labelDisabled ? ' gs-disabled' : ''}`}>
      <label className="gs-label-input-row">
        <div className="gs-label-input-label">Label:</div>
        <input
          ref={labelInputRef}
          className="gs-label-input"
          type="text"
          placeholder={labelPlaceholder}
          value={label}
          disabled={labelDisabled}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) {
              return;
            }
            if (e.key === 'Enter') {
              handleApplyLabel();
            }
            if (e.key === 'Escape') {
              close();
            }
          }}
        />
        <button className="gs-label-apply-btn" onClick={handleApplyLabel} disabled={labelDisabled}>
          UPDATE
        </button>
      </label>
    </li>
  );
};

registerMenuComponent('col-label', LabelSection);
export { LabelSection };
