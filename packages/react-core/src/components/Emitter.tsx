import type { FC } from 'react';
import { useContext, useEffect, useRef } from 'react';
import { Context } from '../store';

export const Emitter: FC = () => {
  const { store } = useContext(Context);
  const { choosing: pointing, selectingZone: zone, sheetReactive } = store;
  const sheet = sheetReactive.current;

  useEffect(() => {
    if (sheet?.isInitialized && sheet.currentVersion > 0 && sheet.binding.onChange) {
      sheet.binding.onChange({
        sheet,
        points: {
          pointing,
          selectingFrom: { y: zone.startY, x: zone.startX },
          selectingTo: { y: zone.endY, x: zone.endX },
        },
      });
    }
  }, [sheetReactive]);

  useEffect(() => {
    if (sheet && sheet.binding.onSelect) {
      sheet.binding.onSelect({
        sheet,
        points: {
          pointing,
          selectingFrom: { y: zone.startY, x: zone.startX },
          selectingTo: { y: zone.endY, x: zone.endX },
        },
      });
    }
  }, [pointing, zone]);
  return null;
};
